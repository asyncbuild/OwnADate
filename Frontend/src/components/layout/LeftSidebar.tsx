import { ArrowRight, CalendarDays, Gift, Sparkles, Users } from "lucide-react";
import StatCard from "../common/StatCard";
import { CATEGORY_THEMES } from "../../constants/calendar";

interface LeftSidebarProps {
  claimedCount?: number;
}

export function LeftSidebar({ claimedCount = 3 }: LeftSidebarProps) {
  return (
    <aside className="rounded-[24px] border border-black/[0.07] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.035)] xl:min-h-[calc(100vh-130px)]">
      <div className="flex h-full flex-col">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#f2f2ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">
            <Sparkles size={12} />
            365 Unique Dates
          </div>

          <h1 className="text-[34px] font-black leading-[0.98] tracking-[-0.045em]">
            Own a date.
            <br />
            <span className="text-black/35">Gift a memory.</span>
          </h1>

          <p className="mt-5 text-[13px] leading-6 text-black/55">
            Every day belongs to someone. Permanently claim a date for yourself
            or gift it to someone special with an official certificate of ownership.
          </p>

          <button
            onClick={() => {
              document.getElementById("calendar")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="group mt-6 flex w-full items-center justify-between rounded-2xl bg-black px-4 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-black/85"
          >
            <span className="flex items-center gap-2">
              <Gift size={16} className="text-rose-400" />
              Claim or Gift Date
            </span>
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* Category Key */}
        <div className="mt-6">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35">
            Date Categories
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {Object.values(CATEGORY_THEMES).map((cat) => (
              <span
                key={cat.name}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold transition hover:scale-105 ${cat.badgeBg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cat.dotBg}`} />
                {cat.name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-auto pt-6">
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={<CalendarDays size={14} />}
              value="365"
              label="Total Dates"
            />

            <StatCard
              icon={<Users size={14} />}
              value={String(claimedCount)}
              label="Claimed"
            />
          </div>

          <div className="mt-4 rounded-2xl bg-[#f6f6f3] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
              <div className="h-1.5 w-1.5 rounded-full bg-black" />
              How it works
            </div>

            <p className="mt-2 text-xs leading-5 text-black/55">
              Pick an available date. Claim it or gift it. Once claimed, you receive an official printable certificate of ownership permanently.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default LeftSidebar;
