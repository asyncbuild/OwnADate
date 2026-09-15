import { useState } from "react";
import type { DateCell, DateOwner } from "../../types/calendar";
import { CALENDAR_YEAR, MONTHS, CATEGORY_THEMES } from "../../constants/calendar";
import { getDaysInMonth } from "../../utils/calendar";
import MonthCard from "./MonthCard";

interface CalendarGridProps {
  ownedDates?: Record<string, DateOwner>;
  premiumDateKeys?: Set<string>;
  currency?: "INR" | "USD";
  hoveredDate: string | null;
  setHoveredDate: (value: string | null) => void;
  onSelect?: (date: DateCell) => void;
  onSelectDate?: (date: DateCell) => void;
}

export function CalendarGrid({
  ownedDates = {},
  premiumDateKeys,
  currency = "INR",
  hoveredDate,
  setHoveredDate,
  onSelect,
  onSelectDate,
}: CalendarGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const handleSelect = onSelect || onSelectDate || (() => {});

  return (
    <section id="calendar" className="min-w-0">
      {/* Calendar Header & Categories Legend */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
            The Calendar Registry
          </div>

          <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
            365 Days
          </h2>
        </div>

        {/* Date Categories Badge Filter Legend */}
        <div className="relative max-w-full overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-xs">
          {/* Right edge fade indicator for horizontal scroll */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent rounded-r-2xl" />

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-2 sm:px-3">
            <span className="mr-1 text-[9px] font-black uppercase tracking-wider text-black/40 shrink-0">
              Filter:
            </span>
            {Object.values(CATEGORY_THEMES).map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition cursor-pointer shrink-0 whitespace-nowrap ${
                    isSelected
                      ? `${cat.accentBg} text-white border-transparent shadow-md scale-105`
                      : `${cat.badgeBg} hover:scale-105`
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : cat.dotBg}`} />
                  {cat.name}
                </button>
              );
            })}

            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="ml-1 text-[9px] font-extrabold uppercase text-black/50 hover:text-black cursor-pointer underline shrink-0 whitespace-nowrap pr-3"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 12 Month Calendar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MONTHS.map((month, monthIndex) => {
          const cells = getDaysInMonth(monthIndex, CALENDAR_YEAR, ownedDates, premiumDateKeys);

          return (
            <MonthCard
              key={month}
              month={month}
              cells={cells}
              selectedCategory={selectedCategory}
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
