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
import rateLimit from "express-rate-limit";

import dns from "dns";

dotenv.config();
dns.setDefaultResultOrder("ipv4first");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin: true,
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

// -------------------------------------------------------------
// RATE LIMITERS (Protection against DoS, brute-force, quota abuse)
// -------------------------------------------------------------
export const globalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // max 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again shortly." },
});

export const sendOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 OTP requests per 10 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many verification codes requested. Please wait 10 minutes before trying again." },
});

export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 verification attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many incorrect verification attempts. Please wait 15 minutes before trying again." },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 image uploads per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Upload limit reached. Please wait a few minutes before uploading more images." },
});

export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // max 15 order creations per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many checkout requests. Please wait a few minutes before trying again." },
});

export const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // max 25 settings updates per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many settings updates. Please wait a few minutes before trying again." },
});

// -------------------------------------------------------------
// STRICT IMAGE VALIDATION & UPLOAD
// -------------------------------------------------------------
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype.toLowerCase())) {
      callback(new Error("Invalid file format. Only JPEG, PNG, WebP, and GIF images are allowed."));
      return;
    }
    callback(null, true);
  },
});

const imageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  imageUpload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Image size exceeds 5MB limit. Please choose a smaller photo." });
      }
      return res.status(400).json({ error: `Upload error: ${error.message}` });
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
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true" || smtpPort === 465, 
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
} as any);
const PRICES = {
    INR: { STANDARD: 24900, PREMIUM: 69900 },
    USD: { STANDARD: 499, PREMIUM: 899 },
}

const OrderInputSchema = z.object({
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isGift: z.boolean(),
    name: z.string().min(1).max(100),
    imageUrl: z.string().url().or(z.literal("")).optional(),
    currency: z.enum(["INR", "USD"]).default("INR"),
    senderName: z.string().max(100).optional(),
    recipientEmail: z.string().email().or(z.literal("")).optional(),
    giftNote: z.string().max(1000).optional(),
    buyerEmail: z.string().email(),
    title: z.string().min(1).max(200),
    story: z.string().min(1).max(2000),
    category: z.nativeEnum(Category),
    link: z.string().url().or(z.literal("")).optional(),
    showPhotoOnTile: z.boolean().default(true).optional(),
    isPrivate: z.boolean().default(false).optional(),
});

async function fulfillOrder(paymentId: string) {
  let createdClaim: any = null;
  let fulfilledOrder: any = null;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: paymentId } });
    if (!order || order.status === PaymentStatus.PAID) return;

    fulfilledOrder = order;

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
        recipientEmail: order.recipientEmail,
        giftNote: order.giftNote,
        buyerEmail: order.buyerEmail,
        title: order.title,
        story: order.story,
        category: order.category,
        link: order.link,
        pricePaid: order.amount,
        currency: order.currency,
        paymentId,
        showPhotoOnTile: order.showPhotoOnTile ?? true,
        isPrivate: order.isPrivate ?? false,
      },
    });

    createdClaim = claim;

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
        imageUrl: claim.showPhotoOnTile ? (order.imageUrl || null) : null,
        dateLabel,
        title: claim.isPrivate ? "Private Dedication" : order.title,
        price: order.amount / 100,
        currency: order.currency,
      },
    });

    io.emit("date_claimed", {
      claim: {
        name: claim.ownerName,
        initial: claim.initial,
        imageUrl: claim.showPhotoOnTile ? (claim.imageUrl || undefined) : undefined,
        senderName: claim.senderName || undefined,
        isGift: claim.isGift,
        title: claim.title,
        story: claim.isPrivate ? "Private Dedication" : claim.story,
        category: claim.category,
        link: claim.isPrivate ? undefined : (claim.link || undefined),
        price: claim.pricePaid / 100,
        currency: claim.currency,
        certificateId: claim.certificateId,
        showPhotoOnTile: claim.showPhotoOnTile,
        isPrivate: claim.isPrivate,
        claimedAt: claim.claimedAt.toLocaleDateString("en-GB", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
      activity,
    });
  }, { maxWait: 15000, timeout: 30000 });

  // Post-transaction emails (Fire & Forget, won't block response)
  if (createdClaim && fulfilledOrder) {
    const dateObj = new Date(`${fulfilledOrder.dateKey}T00:00:00`);
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // 1. If Gift & recipient email is present, send Gift Reveal Notification to recipient
    if (fulfilledOrder.isGift && fulfilledOrder.recipientEmail) {
      sendGiftRevealEmail({
        recipientEmail: fulfilledOrder.recipientEmail,
        recipientName: fulfilledOrder.name,
        senderName: fulfilledOrder.senderName || "A special someone",
        dateLabel,
        dateKey: fulfilledOrder.dateKey,
        title: fulfilledOrder.title,
        giftNote: fulfilledOrder.giftNote || undefined,
        certificateId: createdClaim.certificateId,
      }).catch((err) => console.error("Error sending gift reveal email:", err));
    }

    // 2. Send Claim Confirmation & Certificate receipt to Buyer
    sendOwnerConfirmationEmail({
      buyerEmail: fulfilledOrder.buyerEmail,
      ownerName: fulfilledOrder.name,
      senderName: fulfilledOrder.senderName || undefined,
      isGift: fulfilledOrder.isGift,
      dateLabel,
      dateKey: fulfilledOrder.dateKey,
      title: fulfilledOrder.title,
      certificateId: createdClaim.certificateId,
      amount: fulfilledOrder.amount / 100,
      currency: fulfilledOrder.currency,
    }).catch((err) => console.error("Error sending owner confirmation email:", err));
  }
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
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
);

// Apply global rate limiter to all API endpoints (excluding webhooks)
app.use("/api", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/webhook")) return next();
    return globalApiLimiter(req, res, next);
});

app.post("/api/upload", uploadLimiter, imageUploadMiddleware, async (req: Request, res: Response) => {
  const file = req.file;
  const cloudName = process.env.cloudName;
  const uploadPreset = process.env.uploadPreset;

  if (!file) {
    return res.status(400).json({ error: "Image file is required" });
  }

  // Deep verification: Verify actual binary magic bytes match an allowed image type
  const detectedType = await fileTypeFromBuffer(file.buffer);
  if (!detectedType || !allowedImageTypes.has(detectedType.mime)) {
    return res.status(400).json({
      error: "The uploaded file is not a valid image format. Only JPG, PNG, WebP, and GIF are allowed.",
    });
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
                        showPhotoOnTile: true,
                        isPrivate: true,
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
                    imageUrl: d.claim.showPhotoOnTile ? (d.claim.imageUrl || undefined) : undefined,
                    senderName: d.claim.senderName || undefined,
                    isGift: d.claim.isGift,
                    title: d.claim.title,
                    story: d.claim.isPrivate ? "Private Dedication" : d.claim.story,
                    category: d.claim.category,
                    link: d.claim.isPrivate ? undefined : (d.claim.link || undefined),
                    price: d.claim.pricePaid/100, //convert paisa to rupees
                    certificateId: d.claim.certificateId,
                    showPhotoOnTile: d.claim.showPhotoOnTile,
                    isPrivate: d.claim.isPrivate,
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
    const queryEmail = (req.query.email as string | undefined)?.toLowerCase().trim();

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

        const isOwner = Boolean(queryEmail && claim.buyerEmail.toLowerCase().trim() === queryEmail);

        // If private and not the verified owner, return privacy-protected view
        if (claim.isPrivate && !isOwner) {
            return res.json({
                dateKey: claim.dateKey,
                isPrivate: true,
                owner: {
                    name: claim.ownerName,
                    initial: claim.initial,
                    imageUrl: claim.showPhotoOnTile ? (claim.imageUrl || undefined) : undefined,
                    senderName: claim.senderName || undefined,
                    isGift: claim.isGift,
                    title: "Private Dedication",
                    story: "This date's story and certificate have been set to private by the owner.",
                    category: claim.category,
                    price: claim.pricePaid / 100,
                    certificateId: claim.certificateId,
                    showPhotoOnTile: claim.showPhotoOnTile,
                    isPrivate: true,
                    claimedAt: claim.claimedAt.toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    }),
                }
            });
        }

        res.json({
            dateKey: claim.dateKey,
            isPrivate: claim.isPrivate,
            isOwner,
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
                showPhotoOnTile: claim.showPhotoOnTile,
                isPrivate: claim.isPrivate,
                buyerEmail: isOwner ? claim.buyerEmail : undefined,
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

// PATCH & POST /api/claim/settings - Allows verified owners to update visibility toggles anytime
const handleClaimSettings = async (req: Request, res: Response) => {
    const { dateKey, email, showPhotoOnTile, isPrivate } = req.body;
    if (!dateKey || !email) {
        return res.status(400).json({ error: "dateKey and email are required" });
    }

    try {
        const claim = await prisma.claim.findUnique({ where: { dateKey } });
        if (!claim) {
            return res.status(404).json({ error: "Date claim not found" });
        }

        if (claim.buyerEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
            return res.status(403).json({ error: "Unauthorized. Email does not match the registered owner." });
        }

        const updated = await prisma.claim.update({
            where: { dateKey },
            data: {
                ...(typeof showPhotoOnTile === "boolean" ? { showPhotoOnTile } : {}),
                ...(typeof isPrivate === "boolean" ? { isPrivate } : {}),
            },
        });

        // Broadcast real-time update to all calendar clients
        io.emit("date_updated", {
            dateKey,
            claim: {
                name: updated.ownerName,
                initial: updated.initial,
                imageUrl: updated.showPhotoOnTile ? (updated.imageUrl || undefined) : undefined,
                senderName: updated.senderName || undefined,
                isGift: updated.isGift,
                title: updated.title,
                story: updated.isPrivate ? "Private Dedication" : updated.story,
                category: updated.category,
                link: updated.isPrivate ? undefined : (updated.link || undefined),
                price: updated.pricePaid / 100,
                currency: updated.currency,
                certificateId: updated.certificateId,
                showPhotoOnTile: updated.showPhotoOnTile,
                isPrivate: updated.isPrivate,
                claimedAt: updated.claimedAt.toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
            },
        });

        res.json({
            success: true,
            showPhotoOnTile: updated.showPhotoOnTile,
            isPrivate: updated.isPrivate,
        });
    } catch (err: any) {
        console.error("Error updating claim settings:", err);
        res.status(500).json({ error: err.message || "Failed to update settings" });
    }
};
app.patch("/api/claim/settings", settingsLimiter, handleClaimSettings);
app.post("/api/claim/settings", settingsLimiter, handleClaimSettings);

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

app.post("/api/payment/create-order", checkoutLimiter, async (req: Request, res: Response) => {
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
        recipientEmail: data.recipientEmail || null,
        giftNote: data.giftNote || null,
        buyerEmail: data.buyerEmail,
        title: data.title,
        story: data.story,
        category: data.category,
        link: data.link || null,
        showPhotoOnTile: data.showPhotoOnTile ?? true,
        isPrivate: data.isPrivate ?? false,
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
async function sendMailHelper({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: [to],
          subject,
          html,
        }),
      });
      if (res.ok) return;
      const errData: any = await res.json().catch(() => ({}));
      console.warn("Resend API warning, falling back to SMTP:", errData?.message || res.status);
    } catch (resendErr) {
      console.warn("Resend API fetch error, falling back to SMTP:", resendErr);
    }
  }

  await transporter.sendMail({
    from: process.env.SENDER_EMAIL || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

async function sendVerificationEmail(toEmail: string, otp: string) {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 440px; margin: 0 auto; padding: 28px; border: 1px solid #e5e5e5; border-radius: 20px; background: #ffffff;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-size: 18px; font-weight: 900; color: #111; letter-spacing: -0.5px;">Own a Date</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #111; margin: 0 0 8px;">Verify Your Email</h2>
      <p style="color: #666; font-size: 14px; margin: 0 0 20px; line-height: 1.5;">Enter this 6-digit verification code to complete your date reservation:</p>
      <div style="background: #fafaf8; border: 1px solid #e5e5df; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #000; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #999; margin: 0;">This code expires in 5 minutes. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await sendMailHelper({
    to: toEmail,
    subject: `Your Verification Code: ${otp}`,
    html: htmlContent,
  });
}

async function sendGiftRevealEmail({
  recipientEmail,
  recipientName,
  senderName,
  dateLabel,
  dateKey,
  title,
  giftNote,
  certificateId,
}: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  dateLabel: string;
  dateKey: string;
  title: string;
  giftNote?: string;
  certificateId: string;
}) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const plaqueUrl = `${frontendUrl}/date/${dateKey}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; border: 1px solid #e0ded6; border-radius: 24px; background: #faf9f6; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 40px; margin-bottom: 8px;">🎁</span>
        <h1 style="font-size: 24px; font-weight: 800; color: #111; margin: 0 0 6px; letter-spacing: -0.5px;">A Special Date Was Claimed For You!</h1>
        <p style="font-size: 14px; color: #666; margin: 0;">Dear <strong>${recipientName}</strong>, someone has immortalized a calendar day in your honor.</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e6e4dc; border-radius: 18px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="text-align: center; border-bottom: 1px dashed #e6e4dc; padding-bottom: 16px; margin-bottom: 16px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #b48c36;">Permanently Claimed Date</span>
          <div style="font-size: 28px; font-weight: 900; color: #000; margin: 6px 0 2px;">${dateLabel}</div>
          <div style="font-size: 14px; font-weight: 600; color: #555;">"${title}"</div>
        </div>

        <div style="font-size: 13px; color: #444; line-height: 1.6;">
          <p style="margin: 0 0 10px;"><strong>Dedicated with love by:</strong> ${senderName}</p>
          ${
            giftNote
              ? `<div style="background: #fdfbf7; border-left: 3px solid #b48c36; padding: 12px 14px; border-radius: 8px; font-style: italic; color: #444; margin-top: 12px;">"${giftNote}"</div>`
              : ""
          }
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${plaqueUrl}" style="display: inline-block; background: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
          ✨ View Your Date Plaque & Certificate
        </a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #999; margin: 0;">
        Certificate ID: <span style="font-family: monospace;">${certificateId}</span> • Registered on <a href="${frontendUrl}" style="color: #666; text-decoration: underline;">OwnADate.com</a>
      </p>
    </div>
  `;

  await sendMailHelper({
    to: recipientEmail,
    subject: `🎁 ${senderName} has dedicated ${dateLabel} to you on Own a Date!`,
    html: htmlContent,
  });
}

async function sendOwnerConfirmationEmail({
  buyerEmail,
  ownerName,
  senderName,
  isGift,
  dateLabel,
  dateKey,
  title,
  certificateId,
  amount,
  currency,
}: {
  buyerEmail: string;
  ownerName: string;
  senderName?: string;
  isGift: boolean;
  dateLabel: string;
  dateKey: string;
  title: string;
  certificateId: string;
  amount: number;
  currency: string;
}) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const plaqueUrl = `${frontendUrl}/date/${dateKey}`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e0ded6; border-radius: 24px; background: #ffffff; color: #1a1a1a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="font-size: 32px;">✨</span>
        <h2 style="font-size: 22px; font-weight: 800; color: #111; margin: 6px 0;">Claim Confirmed & Sealed</h2>
        <p style="font-size: 13px; color: #666; margin: 0;">Your date has been permanently registered in the public registry.</p>
      </div>

      <div style="background: #fafaf8; border: 1px solid #eae8e1; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e6e0; padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #777;">Claimed Date:</span>
          <strong>${dateLabel}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e6e0; padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #777;">Dedicated To:</span>
          <strong>${ownerName}</strong>
        </div>
        ${
          isGift && senderName
            ? `<div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e6e0; padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
                <span style="color: #777;">Gifted By:</span>
                <strong>${senderName}</strong>
              </div>`
            : ""
        }
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e6e0; padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
          <span style="color: #777;">Dedication Title:</span>
          <strong>${title}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #777;">Certificate ID:</span>
          <strong style="font-family: monospace;">${certificateId}</strong>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${plaqueUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 26px; border-radius: 50px; font-weight: 700; font-size: 13px;">
          View & Download Certificate
        </a>
      </div>

      <p style="font-size: 11px; text-align: center; color: #999; margin: 0;">
        Amount Paid: ${currency === "INR" ? "₹" : "$"}${amount} • Keep this email as your permanent claim receipt.
      </p>
    </div>
  `;

  await sendMailHelper({
    to: buyerEmail,
    subject: `✨ Claim Confirmed: ${dateLabel} is officially yours! (${certificateId})`,
    html: htmlContent,
  });
}

// -------------------------------------------------------------
// DYNAMIC OPEN GRAPH SOCIAL PREVIEW CARD GENERATOR (1200x630 SVG)
// -------------------------------------------------------------
app.get("/api/og/:dateKey", async (req: Request<{ dateKey: string }>, res: Response) => {
  const { dateKey } = req.params;

  try {
    const claim = await prisma.claim.findUnique({
      where: { dateKey },
    });

    const dateObj = new Date(`${dateKey}T00:00:00`);
    const formattedMonth = dateObj.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
    const formattedDay = dateObj.toLocaleDateString("en-US", { day: "numeric" });
    const formattedFull = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });

    const ownerName = claim?.isPrivate ? "Private Owner" : (claim?.ownerName || "Available Date");
    const title = claim?.isPrivate ? "Dedicated Memory" : (claim?.title || "Own This Special Calendar Date");
    const certId = claim?.certificateId || "OFFICIAL REGISTRY";
    const subtitle = claim
      ? (claim.isGift && claim.senderName ? `Dedicated with love by ${claim.senderName}` : `Claimed in perpetuity by ${ownerName}`)
      : "Available to claim on Own a Date";

    // Escape special XML characters for SVG
    const escapeXml = (str: string) =>
      str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case "<": return "&lt;";
          case ">": return "&gt;";
          case "&": return "&amp;";
          case "'": return "&apos;";
          case '"': return "&quot;";
          default: return c;
        }
      });

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#141312"/>
            <stop offset="50%" stop-color="#0e0d0c"/>
            <stop offset="100%" stop-color="#050505"/>
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f5e0a0"/>
            <stop offset="40%" stop-color="#d4af37"/>
            <stop offset="70%" stop-color="#aa7c11"/>
            <stop offset="100%" stop-color="#f7ebc2"/>
          </linearGradient>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#1f1d19" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#141311" stop-opacity="0.9"/>
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>

        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>

        <!-- Outer Gold Border -->
        <rect x="24" y="24" width="1152" height="582" rx="28" fill="none" stroke="url(#gold)" stroke-width="2.5" stroke-opacity="0.4"/>
        <rect x="34" y="34" width="1132" height="562" rx="20" fill="none" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.15" stroke-dasharray="6,6"/>

        <!-- Top Header: Own a Date Brand -->
        <g transform="translate(60, 68)">
          <circle cx="16" cy="16" r="14" fill="none" stroke="url(#gold)" stroke-width="2"/>
          <text x="16" y="21" font-family="-apple-system, sans-serif" font-size="14" font-weight="900" fill="url(#gold)" text-anchor="middle">★</text>
          <text x="44" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="1">OWN A DATE</text>
          <text x="180" y="23" font-family="-apple-system, sans-serif" font-size="13" font-weight="600" fill="url(#gold)" letter-spacing="3">• OFFICIAL REGISTRY</text>
        </g>

        <!-- Main Content Plaque -->
        <g transform="translate(60, 120)">
          <rect width="1080" height="430" rx="20" fill="url(#cardGrad)" stroke="url(#gold)" stroke-width="1.5" stroke-opacity="0.3" filter="url(#shadow)"/>

          <!-- Left Column: Big Date Display -->
          <g transform="translate(50, 40)">
            <rect width="260" height="350" rx="16" fill="#12110f" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.25"/>
            <text x="130" y="70" font-family="-apple-system, sans-serif" font-size="15" font-weight="800" fill="url(#gold)" text-anchor="middle" letter-spacing="4">${escapeXml(formattedMonth)}</text>
            <text x="130" y="210" font-family="Georgia, serif" font-size="120" font-weight="900" fill="#ffffff" text-anchor="middle">${escapeXml(formattedDay)}</text>
            <line x1="40" y1="240" x2="220" y2="240" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.3"/>
            <text x="130" y="280" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#a09d94" text-anchor="middle" letter-spacing="2">PERMANENT REGISTRY</text>
            <text x="130" y="310" font-family="monospace" font-size="11" fill="url(#gold)" text-anchor="middle" opacity="0.8">${escapeXml(certId)}</text>
          </g>

          <!-- Right Column: Dedication Details -->
          <g transform="translate(360, 50)">
            <text x="0" y="35" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="url(#gold)" letter-spacing="3">IMMORTALIZED CALENDAR PLAQUE</text>
            
            <text x="0" y="105" font-family="Georgia, serif" font-size="44" font-weight="800" fill="#ffffff">"${escapeXml(title.length > 32 ? title.slice(0, 32) + '...' : title)}"</text>
            
            <text x="0" y="175" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" font-weight="700" fill="url(#gold)">${escapeXml(ownerName)}</text>
            <text x="0" y="210" font-family="-apple-system, sans-serif" font-size="16" font-weight="500" fill="#b0aca2">${escapeXml(subtitle)}</text>

            <g transform="translate(0, 270)">
              <rect width="420" height="50" rx="25" fill="#0c0b0a" stroke="url(#gold)" stroke-width="1" stroke-opacity="0.4"/>
              <circle cx="25" cy="25" r="10" fill="url(#gold)"/>
              <text x="50" y="31" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#ffffff">Verified & Sealed at ownadate.com/date/${escapeXml(dateKey)}</text>
            </g>
          </g>
        </g>
      </svg>
    `;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.send(svg.trim());
  } catch (err: any) {
    console.error("OG Image generation error:", err);
    res.status(500).send("Error generating preview card");
  }
});

// -------------------------------------------------------------
// SOCIAL CRAWLER PREVIEW ENDPOINT (OpenGraph for WhatsApp/Twitter/Telegram/iMessage)
// -------------------------------------------------------------
app.get("/share/:dateKey", async (req: Request<{ dateKey: string }>, res: Response) => {
  const { dateKey } = req.params;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const targetUrl = `${frontendUrl}/date/${dateKey}`;

  try {
    const claim = await prisma.claim.findUnique({
      where: { dateKey },
    });

    const dateObj = new Date(`${dateKey}T00:00:00`);
    const dateLabel = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    const ogTitle = claim
      ? `${claim.isPrivate ? "Dedicated Memory" : claim.title} • ${dateLabel} on Own a Date`
      : `${dateLabel} • Own a Date`;

    const ogDescription = claim
      ? (claim.isPrivate
          ? `View the permanently claimed date plaque for ${dateLabel}.`
          : `Dedicated to ${claim.ownerName}${claim.isGift && claim.senderName ? ` by ${claim.senderName}` : ""}: "${claim.story.slice(0, 140)}..."`)
      : `Claim ${dateLabel} permanently on Own a Date before someone else does!`;

    const ogImage = `${baseUrl}/api/og/${dateKey}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${ogTitle}</title>
        <meta name="description" content="${ogDescription}" />

        <!-- Open Graph / Facebook / WhatsApp / iMessage -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${targetUrl}" />
        <meta property="og:title" content="${ogTitle}" />
        <meta property="og:description" content="${ogDescription}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Own a Date" />

        <!-- Twitter / X -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="${targetUrl}" />
        <meta name="twitter:title" content="${ogTitle}" />
        <meta name="twitter:description" content="${ogDescription}" />
        <meta name="twitter:image" content="${ogImage}" />

        <meta http-equiv="refresh" content="0;url=${targetUrl}" />
      </head>
      <body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <p>Redirecting to <a href="${targetUrl}" style="color:#f3e5ab;">${dateLabel} Plaque</a>...</p>
        <script>window.location.href = "${targetUrl}";</script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html.trim());
  } catch (err) {
    res.redirect(targetUrl);
  }
});

  // -------------------------------------------------------------
  // POST /api/auth/send-otp
  // -------------------------------------------------------------
  app.post("/api/auth/send-otp", sendOtpLimiter, async (req: Request, res: Response) => {
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

      await sendVerificationEmail(email, otp);

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (err: any) {
      console.error("OTP sending error:", err?.message || err);
      const isMissingCredentials = !process.env.RESEND_API_KEY && (!process.env.SMTP_USER || !process.env.SMTP_PASS);
      const detail = err?.message ? `: ${err.message}` : "";
      res.status(500).json({
        error: isMissingCredentials
          ? "SMTP / Resend API credentials missing on server. Please add RESEND_API_KEY or SMTP_USER and SMTP_PASS."
          : `Failed to send verification email${detail}`,
      });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/verify-otp
  // -------------------------------------------------------------
  app.post("/api/auth/verify-otp", verifyOtpLimiter, async (req: Request, res: Response) => {
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