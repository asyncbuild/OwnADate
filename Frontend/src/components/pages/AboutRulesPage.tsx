import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, ShieldCheck, Heart, Lock, CalendarDays, Gift, Award, HelpCircle, ArrowRight } from "lucide-react";

interface AboutRulesPageProps {
  initialTab?: "about" | "rules";
  onBack: () => void;
}

export function AboutRulesPage({
  initialTab = "about",
  onBack,
}: AboutRulesPageProps) {
  const [activeTab, setActiveTab] = useState<"about" | "rules">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#151515] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header & Navigation Bar */}
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold transition hover:bg-black hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Calendar
        </button>

        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "about"
                ? "bg-black text-white"
                : "text-black/55 hover:text-black"
            }`}
          >
            About
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "rules"
                ? "bg-black text-white"
                : "text-black/55 hover:text-black"
            }`}
          >
            Rules & Guidelines
          </button>
        </div>
      </div>

      {/* Main Dedicated Page Container */}
      <main className="mx-auto mt-8 max-w-4xl">
        <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-xl sm:p-12">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f4f0] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
              <Sparkles size={11} /> Official Registry Specification
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              {activeTab === "about" ? "About Own a Date" : "Rules & Registry Guidelines"}
            </h1>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                  Permanent Calendar Registry • 365 Unique Days in 2026
            </p>
          </div>

          {/* TAB 1: ABOUT PAGE CONTENT */}
          {activeTab === "about" && (
            <div className="mt-10 space-y-8 text-black/80">
              {/* Hero Section */}
              <div className="rounded-2xl border border-black/[0.08] bg-[#fafaf7] p-6 sm:p-8">
                <h2 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                  Every day belongs to someone.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-black/70 sm:text-base">
                  There are 365 days in the 2026 calendar. A single date can mark the day two people crossed paths, the start of an ambitious dream, a birthday that changed everything, or a quiet memory you never want to forget.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-black/70 sm:text-base">
                  <strong className="text-black">Own a Date</strong> is a permanent digital registry. It lets you claim a specific day on the calendar, engrave your story into it, or gift it to someone special.
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
                    <div className="mt-4 text-base font-bold text-black">1. Pick Your Date</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                      Choose an anniversary, birthday, graduation day, or any moment that holds personal meaning.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                      <Gift size={18} />
                    </div>
                    <div className="mt-4 text-base font-bold text-black">2. Personalize the Dedication</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                      Claim it for yourself or send it as a gift. Add the owner’s name, an occasion title, a personal message, and an optional link.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                      <Lock size={18} />
                    </div>
                    <div className="mt-4 text-base font-bold text-black">3. Permanent Ownership</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                      Once claimed, the date is locked forever. No renewals, no expirations, and no outbidding.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                      <Award size={18} />
                    </div>
                    <div className="mt-4 text-base font-bold text-black">4. Instant Digital Certificate</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                      Every claim generates a dedicated, permanent public link (/date/YYYY-MM-DD) and an official, printable Certificate of Ownership.
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
                  In an era of disposable digital feeds, meaningful moments get lost in the noise. Own a Date creates a permanent, tangible space on the internet to immortalize the days that shaped your life.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-black/70">
                  Whether it is a surprise gift for someone you love or a personal milestone you want to claim, your date remains yours forever.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RULES & GUIDELINES PAGE CONTENT */}
          {activeTab === "rules" && (
            <div className="mt-10 space-y-8 text-black/80">
              <p className="text-xs text-black/60 sm:text-sm">
                To keep the calendar respectful, authentic, and lasting for everyone, every claim adheres to the following guidelines:
              </p>

              {/* Section 1 */}
              <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-base font-black text-black">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  1. Permanent Ownership Policy
                </div>
                <ul className="space-y-2 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                  <li>
                    <strong className="text-black">One Owner Per Date:</strong> There are 365 unique dates available in 2026.
                  </li>
                  <li>
                    <strong className="text-black">No Takeovers:</strong> Once a payment is verified, the date is permanently reserved. It cannot be bought out, transferred, or replaced by another user.
                  </li>
                  <li>
                    <strong className="text-black">All Sales Are Final:</strong> Due to the permanent digital reservation of calendar slots, payments cannot be refunded once a certificate is issued.
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-base font-black text-black">
                  <HelpCircle size={18} className="text-amber-600" />
                  2. Pricing & Payments
                </div>
                <ul className="space-y-2 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                  <li>
                    <strong className="text-black">Standard Dates:</strong> Claimable at the standard one-time fee (₹499).
                  </li>
                  <li>
                    <strong className="text-black">Premium Dates:</strong> Nationally recognized celebrations and milestones (such as New Year's Day, Valentine's Day, and Leap Day) carry premium pricing (₹999).
                  </li>
                  <li>
                    <strong className="text-black">No Subscription:</strong> The fee is strictly a one-time purchase with permanent registry status.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-base font-black text-black">
                  <Lock size={18} className="text-rose-600" />
                  3. Content & Dedication Standards
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-black/70">
                  Every date includes a public title, message, and optional link. We reserve the right to remove public text or links without refund if dedications include:
                </p>
                <ul className="space-y-1.5 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                  <li>Hate speech, harassment, defamation, or threats.</li>
                  <li>Explicit, adult, or illegal content.</li>
                  <li>Malicious links, phishing URLs, scams, or commercial spam.</li>
                  <li>Impersonation intended to mislead or harm others.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="rounded-2xl border border-black/[0.08] bg-[#fbfbf9] p-6 space-y-3">
                <div className="flex items-center gap-2.5 text-base font-black text-black">
                  <Award size={18} className="text-indigo-600" />
                  4. The Certificate & Dedicated Link
                </div>
                <ul className="space-y-2 pl-6 text-xs sm:text-sm leading-relaxed text-black/70 list-disc">
                  <li>
                    The generated <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-mono font-bold text-black">/date/:dateKey</code> URL is a publicly accessible permanent record.
                  </li>
                  <li>
                    Certificates can be shared, printed, or downloaded as high-resolution assets anytime via your private verification link.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Bottom CTA to return to calendar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-black p-6 text-white sm:flex-row">
            <div>
              <div className="text-base font-black">Ready to claim your date?</div>
              <div className="text-xs text-white/60">
                Explore available dates on the 365-day 2026 calendar registry.
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
