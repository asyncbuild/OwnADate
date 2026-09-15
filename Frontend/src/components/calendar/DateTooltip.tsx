import { ArrowRight, Gift, Lock, Sparkles } from "lucide-react";
import type { DateCell } from "../../types/calendar";
import { formatDate } from "../../utils/calendar";
import { CATEGORY_THEMES, DEFAULT_CATEGORY_THEME, STANDARD_PRICE, PREMIUM_PRICE } from "../../constants/calendar";

interface DateTooltipProps {
  cell: DateCell;
  currency?: "INR" | "USD";
  alignLeft?: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function DateTooltip({
  cell,
  currency = "INR",
  alignLeft = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: DateTooltipProps) {
  const owner = cell.owner;
  const theme = owner?.category
    ? CATEGORY_THEMES[owner.category] || DEFAULT_CATEGORY_THEME
    : null;

  const isINR = currency === "INR";
  const price = isINR
    ? cell.isPremium ? PREMIUM_PRICE : STANDARD_PRICE
    : cell.isPremium ? 8.99 : 4.99;
  const symbol = isINR ? "₹" : "$";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute top-1/2 z-30 w-[200px] -translate-y-1/2 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-[0_15px_50px_rgba(0,0,0,0.16)] animate-in fade-in zoom-in-95 duration-100 ${
        alignLeft
          ? "right-[calc(100%+8px)]"
          : "left-[calc(100%+8px)]"
      }`}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-[10px] font-black">
            {formatDate(cell.dateKey)}
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[8px] font-medium text-black/40">
            {owner ? (
              <>
                <Lock size={9} /> Active Date Claim
              </>
            ) : cell.isPremium ? (
              <span className="flex items-center gap-0.5 font-bold text-amber-600">
                <Sparkles size={8} /> Premium Date
              </span>
            ) : (
              "Available to claim"
            )}
          </div>
        </div>

        {owner && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[8px] font-black text-white shadow-sm">
            {owner.initial}
          </div>
        )}
      </div>

      {owner ? (
        <>
          <div className="rounded-xl bg-[#f6f6f3] p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-black/50">
                {owner.name}
              </span>
              {theme && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] font-bold ${theme.badgeBg}`}
                >
                  <span className={`h-1 w-1 rounded-full ${theme.dotBg}`} />
                  {owner.category}
                </span>
              )}
            </div>

            {owner.isGift && owner.senderName && (
              <div className="mt-1 flex items-center gap-1 text-[8px] font-semibold text-rose-500">
                <Gift size={9} /> Gifted by {owner.senderName}
              </div>
            )}

            <div className="mt-1.5 text-[11px] font-bold leading-4 text-black/90">
              {owner.title}
            </div>

            <div className="mt-1 text-[9px] leading-3.5 text-black/55">
              "{owner.story}"
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-[#f6f6f3] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-black/40">
              One-Time Price
            </span>
            {cell.isPremium && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[7px] font-bold text-amber-800">
                Popular
              </span>
            )}
          </div>

          <div className="mt-0.5 text-xl font-black">{symbol}{price}</div>
        </div>
      )}

      <button
        onClick={onClick}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-[9px] font-bold text-white transition hover:bg-black/85"
      >
        {owner ? (
          "View Certificate"
        ) : (
          `Claim or Gift for ${symbol}${price}`
        )}

        <ArrowRight size={11} />
      </button>
    </div>
  );
}

export default DateTooltip;
