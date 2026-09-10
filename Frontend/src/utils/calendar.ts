import type { DateCell, DateOwner } from "../types/calendar";
import { PREMIUM_DATE_KEYS } from "../constants/calendar";

export function getDaysInMonth(
  month: number,
  year: number,
  ownedDates: Record<string, DateOwner> = {}
): DateCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDay = (firstDay.getDay() + 6) % 7;
  const cells: DateCell[] = [];

  for (let i = 0; i < startingDay; i++) {
    cells.push({
      day: 0,
      dateKey: `empty-${month}-${i}`,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    cells.push({
      day,
      dateKey,
      isPremium: PREMIUM_DATE_KEYS.has(dateKey),
      owner: ownedDates[dateKey],
    });
  }

  return cells;
}

export function formatDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}
