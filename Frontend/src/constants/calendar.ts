import type { DateOwner, Activity, CategoryTheme } from "../types/calendar";
import { Flame, Trophy, Gift } from "lucide-react";

export const CALENDAR_YEAR = 2020;

export const STANDARD_PRICE = 499;  // ₹499 for standard dates
export const PREMIUM_PRICE = 999;   // ₹999 for Valentine's, NYE, etc.

export const PREMIUM_DATE_KEYS = new Set([
  "2020-01-01", // New Year's Day
  "2020-02-14", // Valentine's Day
  "2020-02-29", // Leap Day
  "2020-10-31", // Halloween
  "2020-12-25", // Christmas
  "2020-12-31", // New Year's Eve
]);

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const months = MONTHS;

export const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
export const weekDays = WEEKDAYS;

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  Love: {
    name: "Love",
    dotBg: "bg-rose-500",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-600",
    borderColor: "border-rose-300",
    accentBg: "bg-rose-500",
    glowColor: "shadow-rose-500/20",
    pastelBg: "bg-rose-50/90 hover:bg-rose-100",
    pastelBorder: "border-rose-200",
    pastelText: "text-rose-950",
    avatarBg: "bg-rose-500 text-white",
  },
  Birthday: {
    name: "Birthday",
    dotBg: "bg-amber-500",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "text-amber-600",
    borderColor: "border-amber-300",
    accentBg: "bg-amber-500",
    glowColor: "shadow-amber-500/20",
    pastelBg: "bg-amber-50/90 hover:bg-amber-100",
    pastelBorder: "border-amber-200",
    pastelText: "text-amber-950",
    avatarBg: "bg-amber-500 text-white",
  },
  Anniversary: {
    name: "Anniversary",
    dotBg: "bg-pink-500",
    badgeBg: "bg-pink-50 text-pink-700 border-pink-200",
    badgeText: "text-pink-600",
    borderColor: "border-pink-300",
    accentBg: "bg-pink-500",
    glowColor: "shadow-pink-500/20",
    pastelBg: "bg-pink-50/90 hover:bg-pink-100",
    pastelBorder: "border-pink-200",
    pastelText: "text-pink-950",
    avatarBg: "bg-pink-500 text-white",
  },
  Milestone: {
    name: "Milestone",
    dotBg: "bg-indigo-500",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    badgeText: "text-indigo-600",
    borderColor: "border-indigo-300",
    accentBg: "bg-indigo-500",
    glowColor: "shadow-indigo-500/20",
    pastelBg: "bg-indigo-50/90 hover:bg-indigo-100",
    pastelBorder: "border-indigo-200",
    pastelText: "text-indigo-950",
    avatarBg: "bg-indigo-500 text-white",
  },
  Memory: {
    name: "Memory",
    dotBg: "bg-violet-500",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200",
    badgeText: "text-violet-600",
    borderColor: "border-violet-300",
    accentBg: "bg-violet-500",
    glowColor: "shadow-violet-500/20",
    pastelBg: "bg-violet-50/90 hover:bg-violet-100",
    pastelBorder: "border-violet-200",
    pastelText: "text-violet-950",
    avatarBg: "bg-violet-500 text-white",
  },
  Special: {
    name: "Special",
    dotBg: "bg-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-600",
    borderColor: "border-emerald-300",
    accentBg: "bg-emerald-500",
    glowColor: "shadow-emerald-500/20",
    pastelBg: "bg-emerald-50/90 hover:bg-emerald-100",
    pastelBorder: "border-emerald-200",
    pastelText: "text-emerald-950",
    avatarBg: "bg-emerald-500 text-white",
  },
};

export const DEFAULT_CATEGORY_THEME: CategoryTheme = {
  name: "Special",
  dotBg: "bg-slate-500",
  badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
  badgeText: "text-slate-600",
  borderColor: "border-slate-300",
  accentBg: "bg-slate-500",
  glowColor: "shadow-slate-500/20",
  pastelBg: "bg-slate-100 hover:bg-slate-200",
  pastelBorder: "border-slate-200",
  pastelText: "text-slate-900",
  avatarBg: "bg-slate-800 text-white",
};

export const INITIAL_OWNED_DATES: Record<string, DateOwner> = {
  "2020-02-14": {
    name: "Priya",
    initial: "P",
    senderName: "Rahul",
    isGift: true,
    title: "Our first Valentine's Day ❤️",
    story: "To the most special person in my life. You make every ordinary day magical.",
    price: 999,
    category: "Love",
    link: "https://instagram.com",
    certificateId: "CERT-FEB14-001",
    claimedAt: "Feb 14, 2026",
  },
  "2020-02-29": {
    name: "Siddharth",
    initial: "S",
    title: "A day that only comes every 4 years ⏳",
    story: "Claimed the rarest date on the calendar as a reminder to make rare moments count.",
    price: 999,
    category: "Special",
    link: "https://example.com",
    certificateId: "CERT-FEB29-002",
    claimedAt: "Feb 29, 2026",
  },
  "2020-05-18": {
    name: "Sarah",
    initial: "S",
    senderName: "Mom & Dad",
    isGift: true,
    title: "Graduation Day 🎓",
    story: "So proud of your dedication and persistence. The world is yours.",
    price: 499,
    category: "Milestone",
    certificateId: "CERT-MAY18-003",
    claimedAt: "May 18, 2026",
  },
};

export const ownedDates = INITIAL_OWNED_DATES;

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 1,
    name: "Rahul",
    initial: "R",
    action: "gifted",
    date: "February 14",
    title: "Gifted to Priya ❤️",
    price: 999,
    time: "2 mins ago",
    icon: Gift,
  },
  {
    id: 2,
    name: "Siddharth",
    initial: "S",
    action: "claimed",
    date: "February 29",
    title: "A day that only comes every 4 years",
    price: 999,
    time: "10 mins ago",
    icon: Flame,
  },
  {
    id: 3,
    name: "Mom & Dad",
    initial: "M",
    action: "gifted",
    date: "May 18",
    title: "Graduation Day 🎓",
    price: 499,
    time: "1 hour ago",
    icon: Trophy,
  },
];

export const activities = INITIAL_ACTIVITIES;
