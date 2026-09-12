import type { DateCell, DateOwner } from "../../types/calendar";
import { CALENDAR_YEAR, MONTHS } from "../../constants/calendar";
import { getDaysInMonth } from "../../utils/calendar";
import MonthCard from "./MonthCard";

interface CalendarGridProps {
  ownedDates?: Record<string, DateOwner>;
  hoveredDate: string | null;
  setHoveredDate: (value: string | null) => void;
  onSelect?: (date: DateCell) => void;
  onSelectDate?: (date: DateCell) => void;
}

export function CalendarGrid({
  ownedDates = {},
  hoveredDate,
  setHoveredDate,
  onSelect,
  onSelectDate,
}: CalendarGridProps) {
  const handleSelect = onSelect || onSelectDate || (() => {});

  return (
    <section id="calendar" className="min-w-0">
      <div className="mb-4 flex items-end justify-between px-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
            The Calendar
          </div>

          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            365 Days
          </h2>
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
