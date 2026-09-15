import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PREMIUM_DATES = new Set([
  // New Year & Winter Season
  "2026-01-01", // New Year's Day
  "2026-12-24", // Christmas Eve
  "2026-12-25", // Christmas Day
  "2026-12-30", // Eve of New Year's Eve
  "2026-12-31", // New Year's Eve

  // Romance Season
  "2026-02-13", // Valentine's Eve
  "2026-02-14", // Valentine's Day
  "2026-02-15", // Singles Awareness

  // Symmetry & Lucky Numbers
  "2026-02-02", // 02/02
  "2026-03-03", // 03/03
  "2026-06-06", // 06/06
  "2026-07-07", // 07/07
  "2026-11-11", // 11/11
  "2026-12-12", // 12/12

  // Pop-Culture & Global Events
  "2026-03-14", // Pi Day
  "2026-04-01", // April Fools'
  "2026-05-04", // Star Wars Day
  "2026-07-04", // 4th of July
  "2026-08-15", // Independence Day
  "2026-10-31", // Halloween
]);

async function main() {
  const year = 2026;
  const entries = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      entries.push({
        dateKey,
        month,
        day,
        isPremium: PREMIUM_DATES.has(dateKey),
        status: "AVAILABLE" as const,
      });
    }
  }

  console.log(`Seeding & updating ${entries.length} calendar dates into DB...`);

  // 1. Create missing entries
  await prisma.dateEntry.createMany({
    data: entries,
    skipDuplicates: true,
  });

  const premiumArray = Array.from(PREMIUM_DATES);

  // 2. Set isPremium = false for standard dates
  await prisma.dateEntry.updateMany({
    where: { dateKey: { notIn: premiumArray } },
    data: { isPremium: false },
  });

  // 3. Set isPremium = true for premium dates
  await prisma.dateEntry.updateMany({
    where: { dateKey: { in: premiumArray } },
    data: { isPremium: true },
  });

  console.log(`All ${entries.length} dates (with ${PREMIUM_DATES.size} premium dates) successfully updated in DB!`);
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
