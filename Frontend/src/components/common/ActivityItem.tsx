import type { ActivityItemType } from "../../types/calendar";

interface ActivityItemProps {
  activity: ActivityItemType;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = activity.icon;
  const isGift = activity.action === "gifted";

  return (
    <div className="group rounded-2xl p-3 transition hover:bg-[#f7f7f4]">
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-[9px] font-black text-white">
            {activity.initial}
          </div>

          <div
            className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
              isGift ? "bg-rose-100 text-rose-600" : "bg-[#f0f0ed] text-black"
            }`}
          >
            <Icon size={8} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] leading-4">
            <span className="font-bold">{activity.name}</span>{" "}
            <span className={isGift ? "font-semibold text-rose-500" : "text-black/45"}>
              {isGift ? "gifted" : "claimed"}
            </span>{" "}
            <span className="font-bold">{activity.date}</span>
          </div>

          <div className="mt-0.5 truncate text-[9px] text-black/40">
            {activity.title}
          </div>

          <div className="mt-1 flex items-center justify-between">
            <span className="text-[8px] text-black/25">{activity.time}</span>

            <span className="text-[9px] font-black">₹{activity.price}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityItem;
