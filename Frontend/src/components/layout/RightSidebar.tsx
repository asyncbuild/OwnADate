import { useEffect, useState } from "react";
import { Zap, Flame, Calendar, Gift, Trophy } from "lucide-react";
import type { Activity } from "../../types/calendar";
import { INITIAL_ACTIVITIES } from "../../constants/calendar";
import ActivityItem from "../common/ActivityItem";
import type { ExtendedActivityItem } from "../common/ActivityItem";
import { getSocket } from "../../utils/socket";
import { apiUrl } from "../../config/api";

interface RightSidebarProps {
  activities?: Activity[];
  currency?: "INR" | "USD";
  onSelectDateKey?: (dateKey: string) => void;
}

export function RightSidebar({
  activities: initialPropActivities = INITIAL_ACTIVITIES,
  currency = "INR",
  onSelectDateKey,
}: RightSidebarProps) {
  const [activitiesList, setActivitiesList] = useState<ExtendedActivityItem[]>([]);
  const [viewerCount, setViewerCount] = useState<number>(0);

  // 1. Load initial activities from backend API + fallback to initialPropActivities
  useEffect(() => {
    let isMounted = true;
    const fetchActivities = async () => {
      try {
        const res = await fetch(apiUrl("/api/activities"));
        if (!res.ok) throw new Error("Failed to load activities");
        const data = await res.json();
        if (data.activities && Array.isArray(data.activities) && data.activities.length > 0 && isMounted) {
          const mapped: ExtendedActivityItem[] = data.activities.map((act: any) => ({
            id: act.id,
            name: act.actorName || "Anonymous",
            initial: act.initial || act.actorName?.charAt(0) || "U",
            action: act.action === "gifted" ? "gifted" : "claimed",
            date: act.dateLabel || "Recently",
            title: act.title || "Claimed a special date",
            price: act.price || 499,
            time: "Just now",
            icon: act.action === "gifted" ? Gift : act.price > 499 ? Trophy : Flame,
            currency: act.currency || currency,
          }));
          setActivitiesList(mapped);
          return;
        }
      } catch (err) {
        // Fallback to prop activities if backend fetch fails
      }

      if (isMounted) {
        setActivitiesList(
          initialPropActivities.map((act) => ({
            ...act,
            icon: act.icon || Flame,
          }))
        );
      }
    };

    fetchActivities();

    return () => {
      isMounted = false;
    };
  }, [initialPropActivities, currency]);

  // 2. Real-time Socket.io Subscription for Live Viewers & Date Claims
  useEffect(() => {
    const socket = getSocket();

    const handleViewerCount = (count: number) => {
      setViewerCount(count);
    };

    const handleDateClaimed = (data: { claim?: any; activity?: any }) => {
      if (data && (data.activity || data.claim)) {
        const act = data.activity;
        const clm = data.claim;

        const newActivity: ExtendedActivityItem = {
          id: act?.id || Date.now(),
          name: act?.actorName || clm?.name || "Someone",
          initial: act?.initial || clm?.initial || "S",
          action: (act?.action || (clm?.isGift ? "gifted" : "claimed")) as "claimed" | "gifted",
          date: act?.dateLabel || "Just now",
          title: act?.title || clm?.title || "Claimed a date",
          price: act?.price || clm?.price || 499,
          time: "Just now",
          icon: (act?.action === "gifted" || clm?.isGift) ? Gift : Flame,
          currency: act?.currency || clm?.currency || currency,
          isNew: true,
        };

        setActivitiesList((prev) => [newActivity, ...prev.slice(0, 19)]);
      }
    };

    socket.on("viewer_count", handleViewerCount);
    socket.on("date_claimed", handleDateClaimed);

    return () => {
      socket.off("viewer_count", handleViewerCount);
      socket.off("date_claimed", handleDateClaimed);
    };
  }, [currency]);

  return (
    <aside className="rounded-[24px] border border-black/[0.07] bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.035)] xl:sticky xl:top-24 overflow-hidden flex flex-col gap-4">
      {/* 1. Header & Minimal Live Viewer Status */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
              Live Activity
            </div>
            <h2 className="mt-0.5 text-lg font-black tracking-tight text-black">
              What's happening
            </h2>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-xs">
            <Zap size={14} />
          </div>
        </div>

        {/* Minimal Live Status Pill */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-[#fafaf7] px-3.5 py-2.5 border border-black/[0.05]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11.5px] font-extrabold text-black/80">
              {viewerCount > 0 ? `${viewerCount} active viewers` : "Live registry sync"}
            </span>
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-black/40">
            Realtime
          </span>
        </div>
      </div>

      {/* =========================================================
          DESKTOP (xl:): CONTINUOUS UPWARD FLOATING LIVE FEED
      ========================================================== */}
      <div className="hidden xl:flex xl:flex-col flex-1 min-h-0 border-t border-black/[0.06] pt-4">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-black/40" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-black/40">
              Recent Claims
            </span>
          </div>
          <span className="text-[9px] font-bold text-black/30">Hover to pause</span>
        </div>

        {/* Upward Floating Feed with Fade Mask */}
        <div className="relative h-[480px] overflow-hidden">
          {/* Top & Bottom Gradient Vignette */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-white via-white/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-white via-white/80 to-transparent" />

          {/* Marquee Track */}
          <div className="animate-marquee-vertical-fast space-y-1.5 py-1">
            {activitiesList.length > 0 ? (
              [...activitiesList, ...activitiesList].map((activity, idx) => (
                <ActivityItem
                  key={`desk-${activity.id}-${idx}`}
                  activity={activity}
                  currency={currency}
                  onClick={() => {
                    if (activity.dateKey) {
                      onSelectDateKey?.(activity.dateKey);
                    }
                  }}
                />
              ))
            ) : (
              <div className="p-4 text-center text-[11px] font-medium text-black/40">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE & TABLET (<xl): SIDE-BY-SIDE HORIZONTAL MARQUEE
      ========================================================== */}
      <div className="xl:hidden border-t border-black/[0.06] pt-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-black/40" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-black/40">
              Recent Claims
            </span>
          </div>
          <span className="text-[9px] font-bold text-black/30">Hover to pause</span>
        </div>

        <div className="relative overflow-hidden py-2">
          {/* Left & Right Edge Fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />

          <div className="animate-marquee-horizontal-fast flex gap-3 w-max px-1">
            {activitiesList.length > 0 ? (
              [...activitiesList, ...activitiesList].map((activity, idx) => (
                <div
                  key={`mob-act-${activity.id}-${idx}`}
                  className="w-64 shrink-0 rounded-2xl border border-black/[0.06] bg-[#fafaf7] p-3 shadow-xs cursor-pointer hover:border-black/20 hover:bg-white transition-all"
                  onClick={() => {
                    if (activity.dateKey) {
                      onSelectDateKey?.(activity.dateKey);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-[9px] font-black text-white shrink-0">
                        {activity.initial || activity.name?.charAt(0) || "U"}
                      </div>
                      <div className="truncate text-xs font-bold text-black">
                        {activity.name}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[9px] font-black text-black/70">
                      {activity.currency === "USD" ? "$" : "₹"}{activity.price}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="truncate font-semibold text-black/60">
                      {activity.action === "gifted" ? "Gifted" : "Claimed"} {activity.date}
                    </span>
                    <span className="text-black/35 font-medium shrink-0 ml-2">{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-[11px] font-medium text-black/40">
                No recent activity yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightSidebar;
