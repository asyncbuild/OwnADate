import { ArrowRight, Gift, Sparkles } from "lucide-react";

const MARKETING_HOOKS = [
  { id: 1, text: "If you're a true Virat fan but can't afford the ₹20,000 shoes, prove your loyalty by owning his birthday." },
  { id: 2, text: "Surprise your partner on your anniversary before someone else claims your special day." },
  { id: 3, text: "Immortalize the exact day your startup launched, your graduation happened, or your life changed forever." },
  { id: 4, text: "Give a gift that can never be lost, broken, or forgotten — a dedicated digital date claim." },
  { id: 5, text: "Claim your birth date. Because technically, you've been waiting for it your whole life." },
  { id: 6, text: "Your parents remember the day you were born. Now give that date your name too." },
  { id: 7, text: "Your first date deserves more than a photo buried in your camera roll." },
  { id: 8, text: "Met your soulmate on this day? You know what to do. ❤️" },
  { id: 9, text: "Your wedding anniversary comes every year. Your claim makes the date part of your story." },
  { id: 10, text: "Your best friend's birthday is coming up. Give them something nobody else can gift." },
  { id: 11, text: "Everyone remembers their first big win. Put yours on the calendar." },
  { id: 12, text: "Started your business on this day? Make it more than a date in your documents." },
  { id: 13, text: "The day you got your first job. The day you quit it. The day you finally became your own boss." },
  { id: 14, text: "Some people collect watches. Some collect sneakers. You can own a date." },
  { id: 15, text: "You don't need a reason to own a date. You just need one you love." },
  { id: 16, text: "Someone is going to claim your favourite date. The only question is who." },
  { id: 17, text: "There are 366 dates. Millions of people. One current claimant per date." },
  { id: 18, text: "Found your lucky number? Now find your lucky date. 🍀" },
  { id: 19, text: "11/11. Make a wish. Then check if it's still available. ✨" },
  { id: 20, text: "February 29 doesn't come around often. Neither does a chance to own it." },
  { id: 21, text: "Born on a beautiful date? Don't let someone else put their name on it." },
  { id: 22, text: "Your graduation date deserves more than a certificate sitting in a drawer." },
  { id: 23, text: "The day you moved to your dream city changed your life. Claim it." },
  { id: 24, text: "The day you bought your first car. You remember it. Now own it. 🚗" },
  { id: 25, text: "The day you got your first salary hits different. 💸" },
  { id: 26, text: "The day you met your best friend probably wasn't ordinary." },
  { id: 27, text: "Your child's birthday will always be one of the most important dates of your life." },
  { id: 28, text: "Your parents' anniversary. Your grandparents' anniversary. Some dates belong to the whole family." },
  { id: 29, text: "Claim the date your biggest dream finally became real." },
  { id: 30, text: "The day you launched your first product. Years later, you'll still remember it." },
  { id: 31, text: "Your first concert. Your first flight. Your first paycheck. Your first love." },
  { id: 32, text: "You probably have one date you can never forget. Is it still available?" },
  { id: 33, text: "It's just another date to everyone else. Unless it's yours." },
  { id: 34, text: "Don't just post the memory. Put your name on the date." },
  { id: 35, text: "Screenshots get buried. Stories on the calendar don't." },
  { id: 36, text: "A photo captures the moment. A date captures when it happened." },
  { id: 37, text: "You can't buy another birthday. But you can claim the date." },
  { id: 38, text: "Imagine coming back years from now and seeing your name right here." },
  { id: 39, text: "One tiny piece of the calendar. One story that's completely yours." },
  { id: 40, text: "Your favourite date shouldn't belong to a stranger." },
  { id: 41, text: "You found the date. Don't wait for somebody else to find it first." },
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
        <div className="relative h-[720px] overflow-hidden">
          {/* Top & Bottom Gradient Vignette/Fade directly on white background */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white via-white/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white via-white/85 to-transparent" />

          {/* Marquee Vertical Track */}
          <div className="animate-marquee-vertical space-y-2 py-1 px-1">
            {[...MARKETING_HOOKS, ...MARKETING_HOOKS].map((hook, index) => (
              <div
                key={`${hook.id}-${index}`}
                className="group/card rounded-xl border border-black/[0.06] bg-[#fafaf7] p-3.5 transition-all duration-200 hover:bg-white hover:border-black/15 hover:shadow-sm cursor-pointer"
                onClick={scrollToCalendar}
              >
                <p className="text-[11.5px] leading-relaxed font-semibold text-black/80">
                  "{hook.text}"
                </p>
                <div className="mt-2 flex items-center justify-end">
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
                className="w-72 shrink-0 rounded-2xl border border-black/[0.06] bg-[#fafaf7] p-3.5 shadow-xs cursor-pointer"
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
