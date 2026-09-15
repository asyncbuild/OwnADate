import { useState, useEffect } from "react";
import { X, Sparkles, ShieldCheck, Heart, Lock, CalendarDays, Gift, Award, HelpCircle, AlertTriangle } from "lucide-react";

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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f4f0] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black/50">
                <Sparkles size={11} /> Own A Date — Guidelines & Policies
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
              About How It Works
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
              Terms & Platform Guidelines
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
                  There are 365 days in the calendar. A single date can mark the day two people crossed paths, the start of an ambitious dream, a birthday that changed everything, or a quiet memory you never want to forget.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
                  <strong className="text-black">Own a Date</strong> is a platform for creating digital claims associated with calendar dates. Add your name, title, story, and optional link, and share your moment with the world.
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
                    <div className="mt-3 text-sm font-bold text-black">01 — Pick a Date</div>
                    <p className="mt-1 text-xs text-black/60 leading-relaxed">
                      Choose an anniversary, birthday, graduation day, or any moment that holds personal meaning.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                      <Gift size={16} />
                    </div>
                    <div className="mt-3 text-sm font-bold text-black">02 — Tell Your Story</div>
                    <p className="mt-1 text-xs text-black/60 leading-relaxed">
                      Claim it for yourself or gift it. Add your name, title, message, and optional link.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                      <Lock size={16} />
                    </div>
                    <div className="mt-3 text-sm font-bold text-black">03 — Claim It</div>
                    <p className="mt-1 text-xs text-black/60 leading-relaxed">
                      Pay the displayed claim price and your claim details appear active on the calendar.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-xs">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white">
                      <Award size={16} />
                    </div>
                    <div className="mt-3 text-sm font-bold text-black">04 — Digital Claim Certificate</div>
                    <p className="mt-1 text-xs text-black/60 leading-relaxed">
                      Every claim generates a dedicated public link (/date/YYYY-MM-DD) and a shareable Date Claim Certificate.
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
                  In an era of disposable digital feeds, meaningful moments get lost in the noise. Own a Date creates a tangible space on the web to honor the days that shaped your life.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: RULES & GUIDELINES */}
          {activeTab === "rules" && (
            <div className="mt-6 space-y-5 text-black/80">
              <p className="text-xs text-black/60">
                To keep the platform transparent, respectful, and legally compliant, all claims adhere to the following Terms & Guidelines:
              </p>

              {/* Section 1: Nature of Claim */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  1. Nature of the Digital Date Claim
                </div>
                <p className="text-xs leading-relaxed text-black/70">
                  A date claim is a digital feature provided within the Own A Date platform. Purchasing a claim does not grant legal ownership of the calendar date itself, property rights, trademark rights, exclusivity outside the Own A Date platform, or any other legal ownership over the underlying date.
                </p>
                <p className="text-[11px] leading-relaxed text-black/55 italic">
                  Note: The platform maps all 365 annual calendar dates using the 2026 calendar structure baseline, providing permanent digital claims for every day of the year.
                </p>
              </div>

              {/* Section 2: Claiming Rules */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <Lock size={16} className="text-indigo-600" />
                  2. Date Claiming & Takeover System
                </div>
                <ul className="space-y-1.5 pl-5 text-xs leading-relaxed text-black/70 list-disc">
                  <li>Each date can have one current claimant at a time. An available date can be claimed at its displayed price.</li>
                  <li>Once a date has been claimed, another visitor may claim the same date by paying the next displayed claim price ($1 or ₹100 higher than the current claim price).</li>
                  <li>When the new claim is successfully completed, the previous claim ends and the new claimant becomes the current claimant.</li>
                  <li>The previous claimant does not receive any portion of the new payment. Date claims are digital experiences, not financial investments or resale opportunities.</li>
                </ul>
              </div>

              {/* Section 3: Payments & Refunds */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <HelpCircle size={16} className="text-amber-600" />
                  3. Payments & Refund Policy
                </div>
                <p className="text-xs leading-relaxed text-black/70">
                  All claim purchases are intended to be final once the claim has been successfully processed and the digital claim has been issued. If a payment is charged but the claim is not created due to a technical failure, contact us to investigate and, where appropriate, refund or resolve the transaction. Nothing in this policy limits any consumer rights that cannot legally be excluded.
                </p>
              </div>

              {/* Section 4: Content & Moderation */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <AlertTriangle size={16} className="text-rose-600" />
                  4. Content, Impersonation & External Links
                </div>
                <ul className="space-y-1.5 pl-5 text-xs leading-relaxed text-black/70 list-disc">
                  <li><strong>User Responsibility:</strong> Users are responsible for the accuracy and legality of all submitted information, text, images, and links.</li>
                  <li><strong>No Impersonation or Infringement:</strong> Claims must not falsely impersonate another individual, organization, or brand, nor infringe any copyright, trademark, or intellectual property rights.</li>
                  <li><strong>External Links:</strong> Own A Date does not endorse or guarantee third-party external links. Malicious, deceptive, or unsafe links may be removed without prior notice.</li>
                  <li><strong>Moderation:</strong> We reserve the right to edit, hide, or remove any claim or content that violates these Terms or applicable law.</li>
                </ul>
              </div>

              {/* Section 5: Service Availability & Age */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-black">
                  <Award size={16} className="text-slate-600" />
                  5. Platform Availability & Eligibility
                </div>
                <p className="text-xs leading-relaxed text-black/70">
                  We strive to maintain high platform availability, but we do not guarantee uninterrupted or error-free access. Users must be at least 18 years old to make purchases, or have parent/guardian consent.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AboutRulesModal;
