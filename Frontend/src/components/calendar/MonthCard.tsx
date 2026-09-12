import type { DateCell } from "../../types/calendar";
import { weekDays, CATEGORY_THEMES, DEFAULT_CATEGORY_THEME } from "../../constants/calendar";
import DateTooltip from "./DateTooltip";
import { Gift, Sparkles } from "lucide-react";

interface MonthCardProps {
  month: string;
  cells: DateCell[];
  hoveredDate: string | null;
  setHoveredDate: (value: string | null) => void;
  onSelect: (date: DateCell) => void;
}

export function MonthCard({
  month,
  cells,
  hoveredDate,
  setHoveredDate,
  onSelect,
}: MonthCardProps) {
  return (
    <div className="relative rounded-[20px] border border-black/[0.07] bg-white p-3 shadow-[0_5px_25px_rgba(0,0,0,0.025)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-black tracking-tight">{month}</h3>

        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-black/25">
          Calendar
        </span>
      </div>

      {/* Week days */}
      <div className="mb-1 grid grid-cols-7">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="flex h-5 items-center justify-center text-[8px] font-bold text-black/25"
          >
            {day}
          </div>
        ))}

      {/* Dates */}
        {cells.map((cell, cellIndex) => {
          if (cell.day === 0) {
            return <div key={cell.dateKey} className="aspect-square" />;
          }

          const isOwned = Boolean(cell.owner);
          const isHovered = hoveredDate === cell.dateKey;
          const theme = cell.owner?.category
            ? CATEGORY_THEMES[cell.owner.category] || DEFAULT_CATEGORY_THEME
            : null;
          const colIndex = cellIndex % 7;

          return (
            <div key={cell.dateKey} className="relative">
              <button
                onMouseEnter={() => setHoveredDate(cell.dateKey)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => onSelect(cell)}
                className={`
                  relative flex aspect-square w-full flex-col
                  items-center justify-center rounded-lg border
                  text-[9px] font-semibold transition-all duration-150

                  ${
                    isOwned && theme
                      ? `${theme.pastelBg} ${theme.borderColor} ${theme.badgeText} font-black hover:-translate-y-0.5 hover:shadow-md`
                      : cell.isPremium
                      ? "border-amber-200 bg-[#fffdf5] text-amber-950 font-bold hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100/50 hover:shadow-md"
                      : "border-black/[0.06] bg-[#fafaf8] text-black/65 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-md"
                  }
                `}
              >
                {isOwned && cell.owner?.imageUrl ? (
                  <img
                    src={cell.owner.imageUrl}
                    alt={cell.owner.name}
                    className="absolute inset-0 z-0 h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <span className="relative z-10 leading-none text-[10px] font-black">
                    {isOwned ? cell.owner?.initial : cell.day}
                  </span>
                )}

                {/* Subtle Gift Icon Badge if gifted */}
                {isOwned && cell.owner?.isGift && (
                  <span className="absolute right-0.5 top-0.5 z-10 text-rose-500">
                    <Gift size={7} />
                  </span>
                )}

                {/* Premium Sparkle Icon for Unclaimed Premium Dates */}
                {!isOwned && cell.isPremium && (
                  <span className="absolute right-0.5 top-0.5 z-10 text-amber-500">
                    <Sparkles size={7} />
                  </span>
                )}
              </button>

              {/* Hover card */}
              {isHovered && (
                <DateTooltip
                  cell={cell}
                  alignLeft={colIndex >= 5}
                  onMouseEnter={() => setHoveredDate(cell.dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onClick={() => onSelect(cell)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthCard;
