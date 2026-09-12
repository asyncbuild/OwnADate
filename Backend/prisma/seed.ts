import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PREMIUM_DATES = new Set([
    "2026-01-01", 
    "2026-02-14", 
    "2026-10-31", 
    "2026-12-25", 
    "2026-12-31", 
]) 

async function main(){
        const year = 2026;
    const entries = [];

    for(let month = 0 ; month < 12; month++){
        const daysInMonth = new Date(year,month + 1,0).getDate();

        for(let day = 1; day <= daysInMonth; day++){
            const dateKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            entries.push({
                dateKey,
                month,
                day,
                isPremium: PREMIUM_DATES.has(dateKey),
                status: 'AVAILABLE' as const,
            })
        }
    }

    console.log(`Seeding ${entries.length} calender dates into db....`);

    await prisma.dateEntry.createMany({
        data: entries,
        skipDuplicates: true,
    });
    console.log(`All ${entries.length} dates successfully seeded into db!`);

}

async function run() {
    try {
        await main();
    } catch (e) {
        console.error("Seeding failed with error: ", e);
        throw e;
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

run();
