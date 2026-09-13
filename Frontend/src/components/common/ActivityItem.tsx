import type { ActivityItemType } from "../../types/calendar";
import { Flame } from "lucide-react";

export interface ExtendedActivityItem extends ActivityItemType {
  dateKey?: string;
  isNew?: boolean;
  currency?: "INR" | "USD";
}

interface ActivityItemProps {
  activity: ExtendedActivityItem;
  onClick?: () => void;
  currency?: "INR" | "USD";
}

export function ActivityItem({ activity, onClick, currency = "INR" }: ActivityItemProps) {
  const Icon = activity.icon || Flame;
  const isGift = activity.action === "gifted";
  const curr = activity.currency || currency;
  const priceSymbol = curr === "USD" ? "$" : "₹";

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl p-3 transition-all duration-200 cursor-pointer border border-transparent ${
        activity.isNew
          ? "bg-amber-50/80 border-amber-200/80 shadow-xs hover:bg-amber-100/80"
          : "hover:bg-[#f7f7f4] hover:border-black/[0.05]"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[10px] font-black text-white shadow-xs">
            {activity.initial || activity.name?.charAt(0) || "U"}
          </div>

          <div
            className={`absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white ${
              isGift ? "bg-rose-100 text-rose-600" : "bg-[#f0f0ed] text-black"
            }`}
          >
            <Icon size={9} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="text-[11px] leading-4 truncate">
              <span className="font-bold text-black">{activity.name}</span>{" "}
              <span className={isGift ? "font-semibold text-rose-500" : "text-black/45"}>
                {isGift ? "gifted" : "claimed"}
              </span>{" "}
              <span className="font-bold text-black">{activity.date}</span>
            </div>
            {activity.isNew && (
              <span className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white animate-pulse">
                NEW
              </span>
            )}
          </div>

          <div className="mt-0.5 truncate text-[10px] text-black/45 group-hover:text-black/70 transition-colors">
            {activity.title}
          </div>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-[9px] text-black/35 font-medium">{activity.time}</span>
            <span className="text-[10px] font-black text-black/80">
              {priceSymbol}{activity.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityItem;
