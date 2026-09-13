import { Zap } from "lucide-react";
import type { Activity } from "../../types/calendar";
import { INITIAL_ACTIVITIES } from "../../constants/calendar";
import ActivityItem from "../common/ActivityItem";

interface RightSidebarProps {
  activities?: Activity[];
}

export function RightSidebar({ activities = INITIAL_ACTIVITIES }: RightSidebarProps) {
  return (
    <aside className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.035)] xl:sticky xl:top-24 overflow-hidden">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
              Live activity
            </div>

            <h2 className="mt-1 text-lg font-black tracking-tight">
              What's happening
            </h2>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
            <Zap size={14} />
          </div>
        </div>

        <div className="mt-5 flex-1">
          <div className="space-y-1">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
