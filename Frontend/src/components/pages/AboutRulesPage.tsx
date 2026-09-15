import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, ShieldCheck, Heart, Lock, CalendarDays, Gift, Award, HelpCircle, ArrowRight, AlertTriangle } from "lucide-react";

interface AboutRulesPageProps {
  initialTab?: "about" | "rules";
  onBack: () => void;
}

export function AboutRulesPage({
  initialTab = "about",
  onBack,
}: AboutRulesPageProps) {
  const [activeTab, setActiveTab] = useState<"about" | "rules">(initialTab);
  const [displayTab, setDisplayTab] = useState<"about" | "rules">(initialTab);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const aboutRef = useRef<HTMLButtonElement>(null);
  const rulesRef = useRef<HTMLButtonElement>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      setDisplayTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const updatePill = () => {
      const activeElement = activeTab === "about" ? aboutRef.current : rulesRef.current;
      if (activeElement) {
        setPillStyle({
          left: activeElement.offsetLeft,
          width: activeElement.offsetWidth,
        });
      }
    };

    updatePill();
    // Re-measure after initial layout/fonts load
    const timer = setTimeout(updatePill, 50);
    window.addEventListener("resize", updatePill);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePill);
    };
  }, [activeTab]);

  const handleTabChange = (targetTab: "about" | "rules") => {
    if (targetTab === activeTab || isFadingOut) return;

    // 1. Immediately move active indicator pill
    setActiveTab(targetTab);

    // 2. Trigger vanish (fade-out) of current content
    setIsFadingOut(true);

    // 3. Swap content once vanished and fade in new content
    setTimeout(() => {
      setDisplayTab(targetTab);
      setIsFadingOut(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#151515] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Top Header & Navigation Bar */}
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="group flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-bold whitespace-nowrap shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white hover:shadow-md"
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          <span className="hidden sm:inline">Back to Calendar</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Tab Switcher with Dynamic Sliding Background Pill */}
        <div className="relative flex shrink-0 items-center rounded-full border border-black/10 bg-white p-1 shadow-sm overflow-hidden">
          {pillStyle.width > 0 && (
            <div
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
              }}
              className="absolute top-1 bottom-1 rounded-full bg-black shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
          )}

          <button
            ref={aboutRef}
            type="button"
            onClick={() => handleTabChange("about")}
            className={`relative z-10 rounded-full px-3.5 py-1.5 sm:px-4 text-xs font-bold whitespace-nowrap transition-colors duration-200 ${
              activeTab === "about"
                ? "text-white"
                : "text-black/55 hover:text-black"
            }`}
          >
            About
          </button>
          <button
            ref={rulesRef}
            type="button"
            onClick={() => handleTabChange("rules")}
            className={`relative z-10 rounded-full px-3.5 py-1.5 sm:px-4 text-xs font-bold whitespace-nowrap transition-colors duration-200 ${
              activeTab === "rules"
                ? "text-white"
                : "text-black/55 hover:text-black"
            }`}
          >
            Terms & Guidelines
          </button>
        </div>
      </div>

      {/* Main Dedicated Page Container */}
      <main className="mx-auto mt-5 sm:mt-8 max-w-4xl">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-xl sm:p-12">
          {/* Animated Vanish-then-Appear Content Wrapper */}
          <div
            className={`transition-all duration-200 ease-out ${
              isFadingOut
                ? "opacity-0 translate-y-1.5 scale-[0.995]"
                : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f4f0] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
                <Sparkles size={11} /> Own A Date — Platform Guidelines
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {displayTab === "about" ? "About Own a Date" : "Terms & Guidelines"}
              </h1>

              <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                Digital Date Claims • 365 Days
              </p>
            </div>

            {/* TAB 1: ABOUT PAGE CONTENT */}
            {displayTab === "about" && (
              <div className="mt-10 space-y-8 text-black/80">
                {/* Hero Section */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fafaf7] p-6 sm:p-8">
                  <h2 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                    Every day belongs to someone.
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-black/70 sm:text-base">
                    There are 365 days in the calendar. A single date can mark the day two people crossed paths, the start of an ambitious dream, a birthday that changed everything, or a quiet memory you never want to forget.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-black/70 sm:text-base">
                    <strong className="text-black">Own a Date</strong> is a platform for creating digital claims associated with calendar dates. Add your name, title, story, and optional link, and share your moment with the world.
                  </p>
                </div>

                {/* How It Works */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-black/40">
                    How It Works
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                        <CalendarDays size={18} />
                      </div>
                      <div className="mt-4 text-base font-bold text-black">01 — Pick Your Date</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                        Choose an anniversary, birthday, graduation day, or any moment that holds personal meaning.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                        <Gift size={18} />
                      </div>
                      <div className="mt-4 text-base font-bold text-black">02 — Tell Your Story</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                        Claim it for yourself or gift it. Add your name, title, message, and optional link.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                        <Lock size={18} />
                      </div>
                      <div className="mt-4 text-base font-bold text-black">03 — Claim It</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                        Pay the displayed claim price and your claim details appear active on the calendar.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                        <Award size={18} />
                      </div>
                      <div className="mt-4 text-base font-bold text-black">04 — Digital Claim Certificate</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                        Every claim generates a dedicated public link (/date/YYYY-MM-DD) and a shareable Date Claim Certificate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Why We Built This */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#f5f5f2] p-6 sm:p-8">
                  <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-black">
                    <Heart size={16} className="text-rose-500" />
                    Why We Built This
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">
                    In an era of disposable digital feeds, meaningful moments get lost in the noise. Own a Date creates a tangible space on the web to honor the days that shaped your life.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: RULES & GUIDELINES PAGE CONTENT */}
            {displayTab === "rules" && (
              <div className="mt-10 space-y-8 text-black/80">
                <p className="text-xs text-black/60 sm:text-sm">
                  To keep the platform transparent, respectful, and legally compliant, all claims adhere to the following Terms & Guidelines:
                </p>

                {/* Section 1: Nature of Claim */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-base font-black text-black">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    1. Nature of the Digital Date Claim
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-black/70">
                    A date claim is a digital feature provided within the Own A Date platform. Purchasing a claim does not grant legal ownership of the calendar date itself, property rights, trademark rights, exclusivity outside the Own A Date platform, or any other legal ownership over the underlying date.
                  </p>
                  <p className="text-xs leading-relaxed text-black/55 italic">
                    Note: The platform maps all 365 annual calendar dates using the 2026 calendar structure baseline, providing permanent digital claims for every day of the year.
                  </p>
                </div>

                {/* Section 2: Takeover System */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-base font-black text-black">
                    <Lock size={18} className="text-indigo-600" />
                    2. Date Claiming & Takeover System
                  </div>
                  <ul className="space-y-2 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                    <li>Each date can have one current claimant at a time. An available date can be claimed at its displayed price.</li>
                    <li>Once a date has been claimed, another visitor may claim the same date by paying the next displayed claim price ($1 or ₹100 higher than the current claim price).</li>
                    <li>When a new claim is successfully completed, the previous claim ends and the new claimant becomes the current claimant.</li>
                    <li>The previous claimant does not receive any portion of the new payment. Date claims are digital experiences, not financial investments or resale opportunities.</li>
                  </ul>
                </div>

                {/* Section 3: Payments & Refunds */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-base font-black text-black">
                    <HelpCircle size={18} className="text-amber-600" />
                    3. Payments & Refund Policy
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-black/70">
                    All claim purchases are intended to be final once the claim has been successfully processed and the digital claim has been issued. If a payment is charged but the claim is not created due to a technical failure, contact us to investigate and, where appropriate, refund or resolve the transaction. Nothing in this policy limits any consumer rights that cannot legally be excluded.
                  </p>
                </div>

                {/* Section 4: Content & Moderation */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-base font-black text-black">
                    <AlertTriangle size={18} className="text-rose-600" />
                    4. Content, Impersonation & External Links
                  </div>
                  <ul className="space-y-2 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                    <li><strong>User Responsibility:</strong> Users are responsible for the accuracy and legality of all submitted information, text, images, and links.</li>
                    <li><strong>No Impersonation or Infringement:</strong> Claims must not falsely impersonate another individual, organization, or brand, nor infringe any copyright, trademark, or intellectual property rights.</li>
                    <li><strong>External Links:</strong> Own A Date does not endorse or guarantee third-party external links. Malicious, deceptive, or unsafe links may be removed without prior notice.</li>
                    <li><strong>Moderation:</strong> We reserve the right to edit, hide, or remove any claim or content that violates these Terms or applicable law.</li>
                  </ul>
                </div>

                {/* Section 5: Availability */}
                <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-base font-black text-black">
                    <Award size={18} className="text-slate-600" />
                    5. Platform Availability & Eligibility
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-black/70">
                    We strive to maintain high platform availability, but we do not guarantee uninterrupted or error-free access. Users must be at least 18 years old to make purchases, or have parent/guardian consent.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom CTA to return to calendar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row">
            <div>
              <div className="text-base font-black">Ready to claim your date?</div>
              <div className="text-xs text-white/60">
                Explore available dates on the 365-day calendar.
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-black transition hover:bg-white/90"
            >
              Explore Calendar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AboutRulesPage;
