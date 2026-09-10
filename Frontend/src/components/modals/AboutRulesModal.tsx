import { useState, useEffect } from "react";
import { X, Sparkles, ShieldCheck, Heart, Lock, CalendarDays, Gift, Award, HelpCircle } from "lucide-react";

interface AboutRulesModalProps {
  isOpen: boolean;
  initialTab?: "about" | "rules";
  onClose: () => void;
}

export function AboutRulesModal({
  isOpen,
  initialTab = "about",
  onClose,
}: AboutRulesModalProps) {
  const [activeTab, setActiveTab] = useState<"about" | "rules">(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f4f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
              <Sparkles size={11} /> Registry Information
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Own a Date
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f4f1] transition hover:bg-black hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="mt-6 flex gap-6 border-b border-black/10 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition ${
              activeTab === "about"
                ? "border-b-2 border-black text-black"
                : "text-black/40 hover:text-black"
            }`}
          >
            About
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition ${
              activeTab === "rules"
                ? "border-b-2 border-black text-black"
                : "text-black/40 hover:text-black"
            }`}
          >
            Rules & Registry Guidelines
          </button>
        </div>

        {/* TAB 1: ABOUT */}
        {activeTab === "about" && (
          <div className="mt-6 space-y-6 text-black/80">
            {/* Hero Section */}
            <div className="rounded-2xl bg-[#fafaf7] p-5 border border-black/[0.06]">
              <h3 className="text-xl font-black tracking-tight text-black">
                Every day belongs to someone.
              </h3>
              <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
                There are only 366 days in the calendar. A single date can mark the day two people crossed paths, the start of an ambitious dream, a birthday that changed everything, or a quiet memory you never want to forget.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
                <strong className="text-black">Own a Date</strong> is a permanent digital registry. It lets you claim a specific day on the calendar, engrave your story into it, or gift it to someone special.
              </p>
            </div>

            {/* How It Works */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-black/40">
                How It Works
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                    <CalendarDays size={16} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-black">1. Pick Your Date</div>
                  <p className="mt-1 text-xs text-black/60 leading-relaxed">
                    Choose an anniversary, birthday, graduation day, or any moment that holds personal meaning.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                    <Gift size={16} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-black">2. Personalize the Dedication</div>
                  <p className="mt-1 text-xs text-black/60 leading-relaxed">
                    Claim it for yourself or send it as a gift. Add the owner’s name, an occasion title, a personal message, and an optional link.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                    <Lock size={16} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-black">3. Permanent Ownership</div>
                  <p className="mt-1 text-xs text-black/60 leading-relaxed">
                    Once claimed, the date is locked forever. No renewals, no expirations, and no outbidding.
                  </p>
                </div>

                <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                    <Award size={16} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-black">4. Instant Digital Certificate</div>
                  <p className="mt-1 text-xs text-black/60 leading-relaxed">
                    Every claim generates a dedicated, permanent public link (/date/YYYY-MM-DD) and an official, printable Certificate of Ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* Why We Built This */}
            <div className="rounded-2xl border border-black/[0.07] bg-[#f7f7f4] p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black">
                <Heart size={14} className="text-rose-500" />
                Why We Built This
              </div>
              <p className="mt-2 text-xs leading-relaxed text-black/70 sm:text-sm">
                In an era of disposable digital feeds, meaningful moments get lost in the noise. Own a Date creates a permanent, tangible space on the internet to immortalize the days that shaped your life.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-black/70 sm:text-sm">
                Whether it is a surprise gift for someone you love or a personal milestone you want to claim, your date remains yours forever.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: RULES & GUIDELINES */}
        {activeTab === "rules" && (
          <div className="mt-6 space-y-6 text-black/80">
            <p className="text-xs text-black/60">
              To keep the calendar respectful, authentic, and lasting for everyone, every claim adheres to the following guidelines:
            </p>

            {/* Section 1 */}
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-black">
                <ShieldCheck size={16} className="text-emerald-600" />
                1. Permanent Ownership Policy
              </div>
              <ul className="space-y-1.5 pl-6 text-xs leading-relaxed text-black/70 list-disc">
                <li>
                  <strong className="text-black">One Owner Per Date:</strong> There are only 366 unique dates available (including February 29).
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
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-black">
                <HelpCircle size={16} className="text-amber-600" />
                2. Pricing & Payments
              </div>
              <ul className="space-y-1.5 pl-6 text-xs leading-relaxed text-black/70 list-disc">
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
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-black">
                <Lock size={16} className="text-rose-600" />
                3. Content & Dedication Standards
              </div>
              <p className="text-xs leading-relaxed text-black/70">
                Every date includes a public title, message, and optional link. We reserve the right to remove public text or links without refund if dedications include:
              </p>
              <ul className="space-y-1 pl-6 text-xs leading-relaxed text-black/70 list-disc">
                <li>Hate speech, harassment, defamation, or threats.</li>
                <li>Explicit, adult, or illegal content.</li>
                <li>Malicious links, phishing URLs, scams, or commercial spam.</li>
                <li>Impersonation intended to mislead or harm others.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-black text-black">
                <Award size={16} className="text-indigo-600" />
                4. The Certificate & Dedicated Link
              </div>
              <ul className="space-y-1.5 pl-6 text-xs leading-relaxed text-black/70 list-disc">
                <li>
                  The generated <code className="rounded bg-black/5 px-1 py-0.5 text-[11px] font-mono font-bold text-black">/date/:dateKey</code> URL is a publicly accessible permanent record.
                </li>
                <li>
                  Certificates can be shared, printed, or downloaded as high-resolution assets anytime via your private verification link.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AboutRulesModal;
