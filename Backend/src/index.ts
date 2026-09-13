import express from "express";
import type { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import multer from "multer";
import { Category, DateStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";
import { fileTypeFromBuffer } from "file-type";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    }
})
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
      return;
    }
    callback(null, true);
  },
});
const imageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  imageUpload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Image size must be under 3MB"
        : "Image upload failed";
      return res.status(400).json({ error: message });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
};

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || process.env.DODO_BEARER_TOKEN!,
  environment: (process.env.DODO_PAYMENTS_ENVIRONMENT || process.env.DODO_ENVIRONMENT) === "live_mode" ? "live_mode" : "test_mode",
})
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, 
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
const PRICES = {
    INR: { STANDARD: 49900, PREMIUM: 99900 },
    USD: { STANDARD: 899, PREMIUM: 1499 },
}

const OrderInputSchema = z.object({
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isGift: z.boolean(),
    name: z.string().min(1).max(100),
    imageUrl: z.string().url().or(z.literal("")).optional(),
    currency: z.enum(["INR", "USD"]).default("INR"),
    senderName: z.string().max(100).optional(),
    buyerEmail: z.string().email(),
    title: z.string().min(1).max(200),
    story: z.string().min(1).max(2000),
    category: z.nativeEnum(Category),
    link:z.string().url().or(z.literal("")).optional(),
})

async function fulfillOrder(paymentId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: paymentId } });
    if (!order || order.status === PaymentStatus.PAID) return;

    // Lock the date row
    await tx.dateEntry.update({
      where: { dateKey: order.dateKey },
      data: { status: DateStatus.LOCKED },
    });

    // Mark order as PAID
    await tx.order.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.PAID },
    });

    const shortCode = order.dateKey.replace(/-/g, "").slice(4);
    const certificateId = `CERT-${shortCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const claim = await tx.claim.create({
      data: {
        certificateId,
        dateKey: order.dateKey,
        ownerName: order.name,
        initial: order.name.trim().charAt(0).toUpperCase(),
        imageUrl: order.imageUrl || null,
        isGift: order.isGift,
        senderName: order.senderName,
        buyerEmail: order.buyerEmail,
        title: order.title,
        story: order.story,
        category: order.category,
        link: order.link,
        pricePaid: order.amount,
        currency: order.currency,
        paymentId,
      },
    });

    const dateObj = new Date(`${order.dateKey}T00:00:00`);
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const actorName = order.isGift && order.senderName ? order.senderName : order.name;

    const activity = await tx.activity.create({
      data: {
        claimId: claim.id,
        action: order.isGift ? "gifted" : "claimed",
        actorName,
        initial: actorName.trim().charAt(0).toUpperCase(),
        imageUrl: order.imageUrl || null,
        dateLabel,
        title: order.title,
        price: order.amount / 100,
        currency: order.currency,
      },
    });

    io.emit("date_claimed", {
      claim: {
        name: claim.ownerName,
        initial: claim.initial,
        imageUrl: claim.imageUrl || undefined,
        senderName: claim.senderName || undefined,
        isGift: claim.isGift,
        title: claim.title,
        story: claim.story,
        category: claim.category,
        link: claim.link || undefined,
        price: claim.pricePaid / 100,
        currency: claim.currency,
        certificateId: claim.certificateId,
        claimedAt: claim.claimedAt.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
      activity,
    });
  }, { maxWait: 15000, timeout: 30000 });
}

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

      if (!webhookSecret) {
        return res.status(500).send("Webhook secret not configured");
      }

      const headers = {
        "webhook-id": req.headers["webhook-id"] as string,
        "webhook-signature": req.headers["webhook-signature"] as string,
        "webhook-timestamp": req.headers["webhook-timestamp"] as string,
      };

      if (!headers["webhook-id"] || !headers["webhook-signature"] || !headers["webhook-timestamp"]) {
        return res.status(400).send("Missing webhook headers");
      }

      const rawBody = req.body.toString();

      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(rawBody, headers);
      } catch {
        return res.status(400).send("Invalid signature");
      }

      const payload = JSON.parse(rawBody);

      if (payload.type === "payment.succeeded") {
        const paymentId = payload.data.payment_id;
        await fulfillOrder(paymentId);
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    })
);

app.post("/api/upload", imageUploadMiddleware, async (req: Request, res: Response) => {
  const file = req.file;
  const cloudName = process.env.cloudName;
  const uploadPreset = process.env.uploadPreset;

  if (!file) {
    return res.status(400).json({ error: "Image file is required" });
  }
  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || detectedType.mime !== file.mimetype || !allowedImageTypes.has(detectedType.mime)) {
    return res.status(400).json({ error: "The uploaded file is not a valid supported image" });
  }
  if (!cloudName || !uploadPreset) {
    return res.status(500).json({ error: "Cloudinary configuration is missing" });
  }

  try {
    const formData = new FormData();
    formData.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    formData.append("upload_preset", uploadPreset);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const cloudinaryData = await cloudinaryResponse.json() as { secure_url?: string; error?: { message?: string } };

    if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
      return res.status(502).json({
        error: cloudinaryData.error?.message || "Image upload failed",
      });
    }

    return res.json({ imageUrl: cloudinaryData.secure_url });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return res.status(502).json({ error: "Image upload failed" });
  }
});

// 1. GET /api/dates
app.get("/api/dates", async (req: Request, res: Response) => {
    try{
        const dates = await prisma.dateEntry.findMany({
            include: {
                claim:{
                    select:{
                        ownerName: true,
                        initial: true,
                        imageUrl: true,
                        senderName: true,
                        isGift: true,
                        title: true,
                        story: true,
                        category: true,
                        link: true,
                        pricePaid: true,
                        certificateId: true,
                        claimedAt: true,
                    }
                }
            },
            orderBy: {
                dateKey: "asc"
            }
        })
        // Map into Record<dataKey, DateOwner> format matching the frontend 
        const ownedDates: Record<string, any> = {};
        const premiumDates: string[] = [];
        dates.forEach((d)=>{
            if(d.isPremium){
                premiumDates.push(d.dateKey);
            }
            if(d.claim){
                ownedDates[d.dateKey] = {
                    name: d.claim.ownerName,
                    initial: d.claim.initial,
                    imageUrl: d.claim.imageUrl || undefined,
                    senderName: d.claim.senderName || undefined,
                    isGift: d.claim.isGift,
                    title: d.claim.title,
                    story: d.claim.story,
                    category: d.claim.category,
                    link: d.claim.link || undefined,
                    price: d.claim.pricePaid/100, //convert paisa to rupees
                    certificateId: d.claim.certificateId,
                    claimedAt: d.claim.claimedAt.toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }),
                }
            }
        })
        res.json({
            ownedDates,
            premiumDates,
            claimedDates: Object.keys(ownedDates).length,
            totalDates: dates.length,
        })
    }catch (error) {
        console.error("Error fetching dates:", error);
        res.status(500).json({ error: "Failed to fetch calendar dates" });
    }
})

// 2. GET /api/dates/:dateKey
// Returns single date & certificate data for /date/:dateKey page
app.get("/api/dates/:dateKey", async (req: Request<{ dateKey: string }>, res: Response) => {
    const {dateKey} = req.params;
    const paymentId = req.query.payment_id as string | undefined;

    try{
        let claim = await prisma.claim.findUnique({
            where: { dateKey },
        });

        // Fallback: If claim not created by Webhook yet, verify payment directly with Dodo API
        if (!claim && paymentId) {
            const order = await prisma.order.findUnique({ where: { id: paymentId } });
            if (order) {
                try {
                    const paymentInfo = await dodo.payments.retrieve(paymentId);
                    if (paymentInfo && paymentInfo.status === "succeeded") {
                        await fulfillOrder(paymentId);
                        claim = await prisma.claim.findUnique({ where: { dateKey } });
                    }
                } catch (err) {
                    console.error("Dodo payment fallback error:", err);
                }
            }
        }

        if(!claim){
            return res.status(404).json({ error: "No claim found for this date" });
        }
        res.json({
            dateKey: claim.dateKey,
            owner:{
                name : claim.ownerName,
                initial : claim.initial,
                imageUrl : claim.imageUrl || undefined,
                senderName : claim.senderName || undefined,
                isGift : claim.isGift,
                title : claim.title,
                story : claim.story,
                category : claim.category,
                link : claim.link || undefined,
                price : claim.pricePaid/100,
                certificateId: claim.certificateId,
                claimedAt : claim.claimedAt.toLocaleDateString("en-GB",{
                    month : "short",
                    day : "numeric",
                    year : "numeric"
                }),
            },
        })
    }catch(error){
        console.error("Error fetching certificate:", error);
        res.status(500).json({ error: "Failed to fetch certificate" });
    }
})

// 3. GET /api/activities
// Returns recent 10 events for the live activity feed
app.get("/api/activities",async(req:Request ,res:Response)=>{
    try{
    const activities = await prisma.activity.findMany({
        take:10,
        orderBy:{ createdAt : "desc" }
    })
    res.json({activities})
    }catch(error){
        console.error("Error fetching activities ", error)
        res.status(500).json({error : "Failed to fetch activities"})
    }
})

//real-time viewer count tracker
let viewers = 0;
io.on("connection",(socket)=>{
    viewers++;
    io.emit("viewer_count", viewers);

    socket.on("disconnect",()=>{
        viewers = Math.max(0, viewers - 1);
        io.emit("viewer_count", viewers);
    });
})

// -------------------------------------------------------------
// 4. POST /api/payment/create-order
// -------------------------------------------------------------

app.post("/api/payment/create-order", async (req: Request, res: Response) => {
  const parseResult = OrderInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0]?.message });
  }
  const data = parseResult.data;

  try {
    const dateEntry = await prisma.dateEntry.findUnique({
      where: { dateKey: data.dateKey },
    });

    if (!dateEntry || dateEntry.status === DateStatus.LOCKED) {
      return res.status(409).json({ error: "Date unavailable" });
    }

    const currency = data.currency; // "INR" or "USD"
    const isINR = currency === "INR";
    const amount = dateEntry.isPremium
      ? PRICES[currency].PREMIUM
      : PRICES[currency].STANDARD;

    const productId = dateEntry.isPremium
      ? (isINR
          ? process.env.DODO_PREMIUM_PRODUCT_ID_INR
          : process.env.DODO_PREMIUM_PRODUCT_ID_USD) || process.env.DODO_PREMIUM_PRODUCT_ID
      : (isINR
          ? process.env.DODO_STANDARD_PRODUCT_ID_INR
          : process.env.DODO_STANDARD_PRODUCT_ID_USD) || process.env.DODO_STANDARD_PRODUCT_ID;

    if (!productId) {
      return res.status(500).json({
        error: `Missing product ID for ${dateEntry.isPremium ? "PREMIUM" : "STANDARD"} date (${currency}) in Backend/.env`,
      });
    }

    const verification = await prisma.emailVerification.findUnique({where: { email: data.buyerEmail },});
    if (!verification || !verification.verified) {
      return res.status(403).json({ error: "Please verify your email via OTP first." });
    }

    // Create Dodo Checkout Session
    const payment = await dodo.payments.create({
      billing: {
        city: "City",
        country: currency === "INR" ? "IN" : "US",
        state: "State",
        street: "Street",
        zipcode: "000000",
      },
      customer: { email: data.buyerEmail, name: data.name },
      payment_link: true,
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      return_url: `${process.env.FRONTEND_URL}/date/${data.dateKey}?claimed=success`,
    });

    // Save pending order using Dodo's payment_id
    await prisma.order.create({
      data: {
        id: payment.payment_id,
        dateKey: data.dateKey,
        amount,
        currency,
        name: data.name,
        imageUrl: data.imageUrl || null,
        isGift: data.isGift,
        senderName: data.senderName || null,
        buyerEmail: data.buyerEmail,
        title: data.title,
        story: data.story,
        category: data.category,
        link: data.link || null,
      },
    });

    res.json({ checkoutUrl: payment.payment_link });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create payment" });
  }
});

// -------------------------------------------------------------
// 5. POST /api/payment/verify-payment
// -------------------------------------------------------------

app.get("/api/geo", async (req: Request, res: Response) => {
  try {
    // 1. Check Cloudflare header first (production deployment)
    const cfCountry = req.headers["cf-ipcountry"] as string | undefined;
    if (cfCountry && cfCountry !== "XX") {
      return res.json({
        currency: cfCountry.toUpperCase() === "IN" ? "INR" : "USD",
      });
    }

    // 2. Fallback for local testing or non-Cloudflare servers (uses client public IP or IP lookup)
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;
    const ipToQuery = (!clientIp || clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.startsWith("::ffff:127."))
      ? ""
      : clientIp;

    const geoRes = await fetch(`http://ip-api.com/json/${ipToQuery}`);
    if (geoRes.ok) {
      const geoData = (await geoRes.json()) as { countryCode?: string };
      if (geoData.countryCode) {
        return res.json({
          currency: geoData.countryCode.toUpperCase() === "IN" ? "INR" : "USD",
        });
      }
    }
  } catch (err) {
    console.error("GeoIP lookup failed:", err);
  }

  return res.json({ currency: "INR" });
});
  // -------------------------------------------------------------
  // POST /api/auth/send-otp
  // -------------------------------------------------------------
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      await prisma.emailVerification.upsert({
        where: { email },
        update: {
          otpHash,
          verified: false,
          expiresAt,
        },
        create: {
          email,
          otpHash,
          verified: false,
          expiresAt,
        },
      });

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: `Your Verification Code: ${otp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 16px;">
            <h2 style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 8px;">Claim Verification</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Use the 6-digit code below to verify your email and reserve your date:</p>
            <div style="background: #fafaf8; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #000;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #999; margin: 0;">Valid for 5 minutes. If you did not initiate this, you can ignore this email.</p>
          </div>
        `,
      });

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (err: any) {
      console.error("Nodemailer OTP sending error:", err?.message || err);
      const isMissingCredentials = !process.env.SMTP_USER || !process.env.SMTP_PASS;
      const detail = err?.message ? `: ${err.message}` : "";
      res.status(500).json({
        error: isMissingCredentials
          ? "SMTP credentials missing on server. Please add SMTP_USER and SMTP_PASS to environment variables."
          : `Failed to send verification email${detail}`,
      });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/verify-otp
  // -------------------------------------------------------------
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    try {
      const record = await prisma.emailVerification.findUnique({
        where: { email },
      });

      if (!record) {
        return res.status(404).json({ error: "No code was requested for this email" });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ error: "Code expired. Please request a new one." });
      }

      const inputHash = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
      if (inputHash !== record.otpHash) {
        return res.status(400).json({ error: "Incorrect verification code" });
      }

      await prisma.emailVerification.update({
        where: { email },
        data: { verified: true },
      });

      res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
      res.status(500).json({ error: "Verification failed" });
    }
  });
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});