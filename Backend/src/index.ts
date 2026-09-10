import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import { json } from "zod";
import { title } from "process";

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});