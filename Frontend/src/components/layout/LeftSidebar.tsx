import { ArrowRight, Gift, Sparkles } from "lucide-react";

const MARKETING_HOOKS = [
  {
    id: 1,
    tag: "Fan Loyalty 🏏",
    text: "If you're a true Virat Kohli fan and can't afford his ₹20,000 shoes, prove your loyalty by claiming his birthday (Nov 5) on the calendar!",
    borderColor: "border-amber-400/80 hover:border-amber-500",
  },
  {
    id: 2,
    tag: "Love & Romance ❤️",
    text: "Surprise your partner on your anniversary before someone else claims your special day on the calendar!",
    borderColor: "border-rose-400/80 hover:border-rose-500",
  },
  {
    id: 3,
    tag: "Milestones 🚀",
    text: "Immortalize the exact day your startup launched, your graduation, or the day your life changed forever.",
    borderColor: "border-indigo-400/80 hover:border-indigo-500",
  },
  {
    id: 4,
    tag: "Unforgettable Gift 🎁",
    text: "Give a gift that can never be lost, broken, or forgotten — a dedicated digital date claim certificate.",
    borderColor: "border-emerald-400/80 hover:border-emerald-500",
  },
  {
    id: 5,
    tag: "Personal Legacy 🎂",
    text: "Claim your birth date (or your child's birth date) to share your personal story with every visitor on the site!",
    borderColor: "border-violet-400/80 hover:border-violet-500",
  },
  {
    id: 6,
    tag: "Rarest Moments ⏳",
    text: "Only 365 dates exist in 2026. Once a date is claimed, your story stays live on the calendar!",
    borderColor: "border-teal-400/80 hover:border-teal-500",
  },
];

interface LeftSidebarProps {
  claimedCount?: number;
}

export function LeftSidebar({ claimedCount }: LeftSidebarProps) {
  const scrollToCalendar = () => {
    document.getElementById("calendar")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <aside className="rounded-[24px] border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_8px_40px_rgba(0,0,0,0.035)] xl:sticky xl:top-24 xl:flex xl:flex-col overflow-hidden">
      {/* Top Header & CTA */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#f2f2ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black/55">
          <Sparkles size={12} />
          {claimedCount && claimedCount > 0 ? `${claimedCount} / 365 Dates Claimed` : "365 Unique Dates"}
        </div>

        <h1 className="text-[32px] sm:text-[34px] font-black leading-[0.98] tracking-[-0.045em]">
          Own a date.
          <br />
          <span className="text-black/35">Every day has a story.</span>
        </h1>

        <p className="mt-4 text-[13px] leading-6 text-black/55">
          Every day belongs to someone. Claim a date for yourself
          or gift it to someone special with a digital claim certificate.
        </p>

        <button
          type="button"
          onClick={scrollToCalendar}
          className="group mt-5 flex w-full items-center justify-between rounded-2xl bg-black px-4 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-black/85 cursor-pointer"
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

      {/* =========================================================
          DESKTOP (xl:): CONTINUOUS UPWARD FLOATING MARKETING TICKER
      ========================================================== */}
      <div className="hidden xl:flex xl:flex-col mt-5 pt-4 border-t border-black/[0.06]">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-black/40">
            ✦ Story & Marketing Ideas
          </span>
          <span className="text-[9px] font-bold text-black/30">Hover to pause</span>
        </div>

        {/* Upward Floating Feed with Top & Bottom Fade Mask */}
        <div className="relative h-[800px] overflow-hidden">
          {/* Top & Bottom Gradient Vignette/Fade directly on white background */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white via-white/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white via-white/85 to-transparent" />

          {/* Marquee Vertical Track */}
          <div className="animate-marquee-vertical space-y-2.5 py-1 px-1">
            {[...MARKETING_HOOKS, ...MARKETING_HOOKS].map((hook, index) => (
              <div
                key={`${hook.id}-${index}`}
                className={`group/card rounded-xl border bg-[#fafaf7] p-3 transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer ${hook.borderColor}`}
                onClick={scrollToCalendar}
              >
                <p className="text-[11.5px] leading-relaxed font-semibold text-black/80">
                  "{hook.text}"
                </p>
                <div className="mt-1.5 flex items-center justify-end">
                  <span className="text-[9px] font-bold text-black/40 group-hover/card:text-black transition-colors">
                    Claim Date →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================
          MOBILE & TABLET (<xl): SIDE-BY-SIDE HORIZONTAL MARQUEE
      ========================================================== */}
      <div className="xl:hidden mt-6 pt-4 border-t border-black/[0.06]">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-black/40 px-1">
          ✦ Story Ideas
        </div>

        <div className="relative overflow-hidden py-2">
          {/* Left & Right Edge Fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" />

          <div className="animate-marquee-horizontal flex gap-3 w-max px-1">
            {[...MARKETING_HOOKS, ...MARKETING_HOOKS].map((hook, index) => (
              <div
                key={`mob-${hook.id}-${index}`}
                className={`w-72 shrink-0 rounded-2xl border bg-[#fafaf7] p-3.5 shadow-xs cursor-pointer ${hook.borderColor}`}
                onClick={scrollToCalendar}
              >
                <p className="text-xs leading-relaxed font-semibold text-black/80 line-clamp-2">
                  "{hook.text}"
                </p>
                <div className="mt-2 flex items-center justify-end">
                  <span className="text-[9px] font-bold text-black/40">Claim Date →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default LeftSidebar;
