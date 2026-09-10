import type { LucideIcon } from "lucide-react";

export type Category =
  | "Love"
  | "Birthday"
  | "Anniversary"
  | "Milestone"
  | "Memory"
  | "Special";

export interface CategoryTheme {
  name: Category;
  dotBg: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentBg: string;
  glowColor: string;
  pastelBg: string;
  pastelBorder: string;
  pastelText: string;
  avatarBg: string;
}

export type DateOwner = {
  name: string;             // Recipient / Owner name
  initial: string;
  senderName?: string;      // If gifted, e.g. "From Alex"
  isGift?: boolean;
  buyerEmail?: string;
  title: string;
  story: string;
  price: number;            // In ₹ (INR)
  category: Category;
  link?: string;
  certificateId: string;
  claimedAt: string;        // Formatted date string or ISO
};

export type DateCell = {
  day: number;
  dateKey: string;          // "YYYY-MM-DD"
  isPremium?: boolean;      // Premium pricing for holidays
  owner?: DateOwner;
};

export type Activity = {
  id: number | string;
  name: string;
  initial: string;
  action: "claimed" | "gifted";
  date: string;
  title: string;
  price: number;
  time: string;
  icon: LucideIcon;
};

export type ActivityItemType = Activity;
