import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import Razorpay from "razorpay";
import { Category, DateStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";

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

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const STANDARD_PRICE_PAISA = 49900
const PREMIUM_PRICE_PAISA = 99900

const OrderInputSchema = z.object({
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    isGift: z.boolean(),
    name: z.string().min(1).max(100),
    senderName: z.string().max(100).optional(),
    buyerEmail: z.string().email(),
    title: z.string().min(1).max(200),
    story: z.string().min(1).max(2000),
    category: z.nativeEnum(Category),
    link:z.string().url().or(z.literal("")).optional(),
})

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
    })
);

// 1. GET /api/dates
app.get("/api/dates", async (req: Request, res: Response) => {
    try{
        const dates = await prisma.dateEntry.findMany({
            include: {
                claim:{
                    select:{
                        ownerName: true,
                        initial: true,
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

    try{
        const claim = await prisma.claim.findUnique({
            where: { dateKey },
        })
        if(!claim){
            return res.status(404).json({ error: "No claim found for this date" });
        }
        res.json({
            dateKey: claim.dateKey,
            owner:{
                name : claim.ownerName,
                initial : claim.initial,
                senderName : claim.senderName || undefined,
                isGift : claim.isGift,
                title : claim.title,
                story : claim.story,
                category : claim.category,
                link : claim.link || undefined,
                price : claim.pricePaid/100,
                certificateId: claim.certificateId,
                claimedAt : claim.claimedAt.toLocaleTimeString("en-US",{
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
app.get("/api/activites",async(req:Request ,res:Response)=>{
    try{
    const activites = await prisma.activity.findMany({
        take:10,
        orderBy:{ createdAt : "desc" }
    })
    res.json({activites})
    }catch(error){
        console.error("Error fetching activites ", error)
        res.status(500).json({error : "Failed to fetch activites"})
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
    if(!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0]?.message ?? "Invalid request data" });
    }
    const data = parseResult.data;

    try{
        const dateEntry = await prisma.dateEntry.findUnique({
            where: { dateKey: data.dateKey },
        })
        if(!dateEntry) {
            return res.status(404).json({ error: "Date does not found" });
        }
        if(dateEntry.status === DateStatus.LOCKED){
            return res.status(409).json({ error: "This date is already permanently claimed." });
        }

        const price = dateEntry.isPremium ? PREMIUM_PRICE_PAISA : STANDARD_PRICE_PAISA;

        const rzpOrder = await razorpay.orders.create({
            amount: price,
            currency: "INR",
            receipt: `rcpt_${Date.now().toString().slice(-8)}`,
            notes: {dateKey: data.dateKey},
        })
        await prisma.order.create({
            data:{
                id: rzpOrder.id,
                dateKey: data.dateKey,
                amount: price,
                currency: "INR",
                name: data.name,
                isGift: data.isGift,
                senderName: data.senderName || null,
                buyerEmail: data.buyerEmail,
                title: data.title,
                story: data.story,
                category: data.category,
                link: data.link || null,
            }
        })
        res.json({
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency:"INR",
            keyId: process.env.RAZORPAY_KEY_ID,
        })
    }catch(err : any){
        console.error("Order creation error:", err);
        res.status(500).json({ error: err.message || "Failed to create order" });
    }
})

// -------------------------------------------------------------
// 5. POST /api/payment/verify-payment
// -------------------------------------------------------------

app.post("/api/payment/verify-payment", async (req: Request, res: Response) => {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;
    
    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature){
        return res.status(400).json({ success: false, error: "Missing verification payload" });
    }

    //1. Verify Razorpay Signature
    const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

    if(expectedSignature !== razorpay_signature){
        return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    try{
        //2. Atomic Database Transaction with Row Lock
        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: razorpay_order_id },
            })
            if(!order){
                throw new Error("Order not found");
            }
            if(order.status === PaymentStatus.PAID){
                return{duplicate:true, dateKey: order.dateKey};
            }

            // Lock row to prevent race conditions.
            const lockedDates = await tx.$queryRaw<Array<{ dateKey: string ; status: DateStatus }>>`
                SELECT "dateKey", "status" FROM "DateEntry"
                WHERE "dateKey" = ${order.dateKey}
                FOR UPDATE
            `;

            const dateEntry = lockedDates[0];
            if(!dateEntry){
                throw new Error("INVALID_DATE");
            }

            //Handle rare outbid race condition

            if(dateEntry.status === DateStatus.LOCKED){
                await tx.order.update({
                    where: { id: razorpay_order_id },
                    data: { status: PaymentStatus.REFUNDED, paymentId: razorpay_payment_id },
                });
                
                await razorpay.payments.refund(razorpay_payment_id, {
                    amount: order.amount,
                    notes: { reason: "Date already claimed by another user" },
                });
                throw new Error("DATE_ALREADY_CLAIMED");
            }

            //Lock the date
            await tx.dateEntry.update({
                where: { dateKey: order.dateKey },
                data: { status: DateStatus.LOCKED },
            });

            //update order status
            await tx.order.update({
                where: { id: razorpay_order_id },
                data: { status: PaymentStatus.PAID, paymentId: razorpay_payment_id, signature: razorpay_signature },
            });

            //create certificate ID
            const shortCode = order.dateKey.replace(/-/g,"").slice(4);
            const randomSalt = Math.floor(1000 + Math.random()* 9000);
            const certificateId = `CERT-${shortCode}-${randomSalt}`;
            const initial = order.name.trim().charAt(0).toUpperCase();

            //create permanent claim
            const claim = await tx.claim.create({
                data:{
                    certificateId,
                    dateKey: order.dateKey,
                    ownerName: order.name,
                    initial,
                    isGift: order.isGift,
                    senderName: order.isGift ? order.senderName : null,
                    buyerEmail: order.buyerEmail,
                    title: order.title,
                    story: order.story,
                    category: order.category,
                    link: order.link || null,
                    pricePaid: order.amount,
                    paymentId: razorpay_payment_id,
                }
            })

            //Insert Activity Feed item
            const dateObj = new Date(`${order.dateKey}T00:00:00`);
            const dateLabel = dateObj.toLocaleDateString("en-US",{
                month: "short",
                day: "numeric",
            })
            const actorName = order.isGift && order.senderName ? order.senderName : order.name;
            const activity = await tx.activity.create({
                data:{
                    claimId: claim.id,
                    action:order.isGift ? "gifted" : "claimed",
                    actorName,
                    initial: actorName.trim().charAt(0).toUpperCase(),
                    dateLabel,
                    title: order.title,
                    price: order.amount/100,
                } 
            })
            return {claim,activity}
        })

        if("duplicate" in result && result.duplicate){
            return res.status(409).json({ success: false, error: "This date has already been claimed by you.", dateKey: result.dateKey });
        }
        
        // Broadcast real-time activity feed update
        io.emit("date_claimed", {
            claim:{
                name: result.claim!.ownerName,
                initial: result.claim!.initial,
                senderName: result.claim!.senderName || undefined,
                isGift: result.claim!.isGift,
                title: result.claim!.title,
                story: result.claim!.story,
                category: result.claim!.category,
                link: result.claim!.link || undefined,
                price: result.claim!.pricePaid/100,
                certificateId: result.claim!.certificateId,
                claimedAt: result.claim!.claimedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
            },
            activity:result.activity,
        })
        res.json({success:true, certificateId: result.claim!.certificateId})
    }catch(err:any){
        if (err.message === "DATE_ALREADY_LOCKED") {
            return res.status(409).json({
                success: false,
                error: "This date was just claimed a moment before. Your payment has been automatically refunded.",
            });
            }
        console.error("Verification error:", err);
        res.status(500).json({ success: false, error: err.message });
    }

})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});