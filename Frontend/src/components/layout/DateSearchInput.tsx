import { useState, useRef, useEffect } from "react";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { MONTHS } from "../../constants/calendar";

import type { DateOwner } from "../../types/calendar";

interface DateSearchInputProps {
  onSelectDateKey: (dateKey: string) => void;
  ownedDates?: Record<string, DateOwner>;
}

interface DateSearchResult {
  dateKey: string;
  label: string;
  monthName: string;
  day: number;
}

export function DateSearchInput({ onSelectDateKey, ownedDates = {} }: DateSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate 365 date items for 2026
  const allDates: DateSearchResult[] = [];
  const year = 2026;

  MONTHS.forEach((mName, mIdx) => {
    const daysInM = new Date(year, mIdx + 1, 0).getDate();
    for (let d = 1; d <= daysInM; d++) {
      const dateKey = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      allDates.push({
        dateKey,
        label: `${mName} ${d}`,
        monthName: mName,
        day: d,
      });
    }
  });

  // Filter dates matching search query
  const trimmed = query.trim().toLowerCase();
  const results = trimmed.length > 0
    ? allDates.filter((item) => {
        const fullLabel = item.label.toLowerCase(); // e.g. "july 24"
        const numFormat = `${item.monthName.slice(0, 3)} ${item.day}`.toLowerCase(); // e.g. "jul 24"
        const isoFormat = item.dateKey; // "2026-07-24"
        const shortFormat = `${item.day}/${item.monthName.slice(0, 3)}`.toLowerCase(); // "24/jul"
        return (
          fullLabel.includes(trimmed) ||
          numFormat.includes(trimmed) ||
          isoFormat.includes(trimmed) ||
          shortFormat.includes(trimmed)
        );
      }).slice(0, 7)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (dateKey: string) => {
    setQuery("");
    setIsOpen(false);
    onSelectDateKey(dateKey);
  };

  return (
    <div ref={containerRef} className="relative w-32 xs:w-40 sm:w-60">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-black/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search date..."
          className="w-full rounded-full border border-black/10 bg-[#ededea] py-1.5 pl-8 pr-7 text-xs font-semibold text-black placeholder:text-black/35 focus:border-black/30 focus:bg-white focus:outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-black/40 hover:text-black"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[9px] font-black uppercase tracking-wider text-black/35 px-2.5 py-1">
            Matching Dates
          </div>
          <div className="space-y-0.5">
            {results.map((res) => {
              const isClaimed = Boolean(ownedDates[res.dateKey]);
              return (
                <button
                  key={res.dateKey}
                  onClick={() => handleSelect(res.dateKey)}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-bold text-black hover:bg-[#fafaf7] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={13} className="text-black/40" />
                    <span>{res.label}</span>
                  </div>
                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                      👑 Claimed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DateSearchInput;
