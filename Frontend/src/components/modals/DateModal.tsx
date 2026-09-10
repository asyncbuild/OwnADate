import { useState } from "react";
import { 
  ArrowRight, 
  ExternalLink, 
  X, 
  Gift, 
  Lock, 
  Sparkles, 
  HeartHandshake 
} from "lucide-react";
import type { DateCell, DateOwner, Category } from "../../types/calendar";
import { formatDate } from "../../utils/calendar";
import { STANDARD_PRICE, PREMIUM_PRICE } from "../../constants/calendar";

interface DateModalProps {
  date: DateCell;
  onClose: () => void;
  onViewCertificate: (dateKey: string) => void;
  onClaimDate: (newOwner: DateOwner) => void;
}

export function DateModal({
  date,
  onClose,
  onViewCertificate,
  onClaimDate,
}: DateModalProps) {
  const owner = date.owner;
  const price = date.isPremium ? PREMIUM_PRICE : STANDARD_PRICE;

  // Checkout form states
  const [isGift, setIsGift] = useState(false);
  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState<Category>("Memory");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock client-side creation (Backend Razorpay integration will replace this)
    const newOwner: DateOwner = {
      name: name.trim(),
      initial: name.trim().charAt(0).toUpperCase(),
      senderName: isGift ? senderName.trim() : undefined,
      isGift,
      buyerEmail: buyerEmail.trim(),
      title: title.trim(),
      story: story.trim(),
      category,
      link: link.trim() || undefined,
      price,
      certificateId: `CERT-${date.dateKey.replace(/-/g, "").slice(4)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      claimedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    onClaimDate(newOwner);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                {owner ? "Permanently Claimed" : "Available Date"}
              </span>
              {date.isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                  <Sparkles size={10} /> Premium Date
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              {formatDate(date.dateKey)}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f4f1] transition hover:bg-black hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* ALREADY CLAIMED VIEW */}
        {owner ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-black/[0.07] bg-[#fbfbf9] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-black text-white shadow-sm">
                    {owner.initial}
                  </div>
                  <div>
                    <div className="text-sm font-black text-black">
                      {owner.name}
                    </div>
                    {owner.isGift && owner.senderName && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-black/50">
                        <Gift size={11} className="text-rose-500" />
                        Gifted with love by {owner.senderName}
                      </div>
                    )}
                  </div>
                </div>

                <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-bold text-black/60">
                  {owner.category}
                </span>
              </div>

              <div className="mt-4 border-t border-black/[0.06] pt-3">
                <div className="text-xs font-bold text-black">{owner.title}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-black/60">
                  "{owner.story}"
                </p>
              </div>

              {owner.link && (
                <a
                  href={owner.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-black/50 transition hover:text-black"
                >
                  Visit link <ExternalLink size={11} />
                </a>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f5f5f2] p-4 text-xs font-semibold text-black/60">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-black/40" />
                <span>This date is permanently owned</span>
              </div>
              <button
                onClick={() => onViewCertificate(date.dateKey)}
                className="flex items-center gap-1 font-bold text-black hover:underline"
              >
                View Certificate <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* CLAIM / GIFT PURCHASE FORM */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Gifting Toggle */}
            <div className="flex rounded-2xl bg-[#f2f2ee] p-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsGift(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition ${
                  !isGift ? "bg-white text-black shadow-sm" : "text-black/50 hover:text-black"
                }`}
              >
                <HeartHandshake size={14} /> For Myself
              </button>
              <button
                type="button"
                onClick={() => setIsGift(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition ${
                  isGift ? "bg-white text-black shadow-sm" : "text-black/50 hover:text-black"
                }`}
              >
                <Gift size={14} className="text-rose-500" /> Gift to Someone
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              {isGift && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                    Your Name (The Gifter) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  {isGift ? "Recipient's Name (Whose date is this?) *" : "Your Name *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isGift ? "e.g. Priya" : "e.g. Alex"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Your Email (For Certificate & Receipt) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Title / Occasion *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The day we first met ❤️"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                  >
                    {["Love", "Birthday", "Anniversary", "Milestone", "Special", "Memory"].map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                    Custom Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  {isGift ? "Dedication Message *" : "Your Story *"}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    isGift
                      ? "Write a heartfelt message to be engraved on their certificate..."
                      : "Why does this date matter to you?"
                  }
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                />
              </div>
            </div>

            {/* Price Summary */}
            <div className="flex items-center justify-between rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4">
              <div>
                <div className="text-[9px] font-bold uppercase text-black/40">
                  One-time Claim Price
                </div>
                <div className="mt-0.5 text-2xl font-black">₹{price}</div>
              </div>
              <div className="text-right text-[10px] font-medium text-black/50">
                Permanent ownership
                <br />
                Instant Digital Certificate
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-sm font-bold text-white transition hover:bg-black/85"
            >
              <span>{isGift ? `Gift Date for ₹${price}` : `Claim Date for ₹${price}`}</span>
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DateModal;
