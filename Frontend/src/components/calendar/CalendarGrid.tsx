import type { DateCell, DateOwner } from "../../types/calendar";
import { CALENDAR_YEAR, MONTHS, CATEGORY_THEMES } from "../../constants/calendar";
import { getDaysInMonth } from "../../utils/calendar";
import MonthCard from "./MonthCard";

interface CalendarGridProps {
  ownedDates?: Record<string, DateOwner>;
  currency?: "INR" | "USD";
  hoveredDate: string | null;
  setHoveredDate: (value: string | null) => void;
  onSelect?: (date: DateCell) => void;
  onSelectDate?: (date: DateCell) => void;
}

export function CalendarGrid({
  ownedDates = {},
  currency = "INR",
  hoveredDate,
  setHoveredDate,
  onSelect,
  onSelectDate,
}: CalendarGridProps) {
  const handleSelect = onSelect || onSelectDate || (() => {});

  return (
    <section id="calendar" className="min-w-0">
      {/* Calendar Header & Categories Legend */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
            The Calendar
          </div>

          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            365 Days
          </h2>
        </div>

        {/* Date Categories Badge Legend */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/[0.07] bg-white p-2 sm:px-3 shadow-xs">
          <span className="mr-1 text-[9px] font-black uppercase tracking-wider text-black/40">
            Categories:
          </span>
          {Object.values(CATEGORY_THEMES).map((cat) => (
            <span
              key={cat.name}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold transition hover:scale-105 ${cat.badgeBg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cat.dotBg}`} />
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* 12 Month Calendar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((month, monthIndex) => {
          const cells = getDaysInMonth(monthIndex, CALENDAR_YEAR, ownedDates);

          return (
            <MonthCard
              key={month}
              month={month}
              cells={cells}
              currency={currency}
              hoveredDate={hoveredDate}
              setHoveredDate={setHoveredDate}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </section>
  );
}

export default CalendarGrid;
