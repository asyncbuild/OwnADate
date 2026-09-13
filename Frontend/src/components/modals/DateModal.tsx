import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  ExternalLink, 
  X, 
  Gift, 
  Lock, 
  Sparkles, 
  HeartHandshake,
  Upload,
  Loader2,
  ChevronDown,
  Heart,
  PartyPopper,
  Trophy,
  Flame,
  Bookmark,
  Check,
  Clock,
} from "lucide-react";
import type { DateCell, Category } from "../../types/calendar";
import { formatDate } from "../../utils/calendar";
import { STANDARD_PRICE, PREMIUM_PRICE } from "../../constants/calendar";
import { apiUrl } from "../../config/api";
import { getDetectedCurrency } from "../../utils/currency";

interface DateModalProps {
  date: DateCell;
  currency?: "INR" | "USD";
  onClose: () => void;
  onViewCertificate?: (dateKey: string) => void;
}

const CATEGORY_OPTIONS: {
  key: Category;
  label: string;
  icon: typeof Heart;
  colorClass: string;
  bgClass: string;
}[] = [
  { key: "Love", label: "Love", icon: Heart, colorClass: "text-rose-600", bgClass: "bg-rose-50 border border-rose-200" },
  { key: "Birthday", label: "Birthday", icon: PartyPopper, colorClass: "text-amber-600", bgClass: "bg-amber-50 border border-amber-200" },
  { key: "Anniversary", label: "Anniversary", icon: Sparkles, colorClass: "text-pink-600", bgClass: "bg-pink-50 border border-pink-200" },
  { key: "Milestone", label: "Milestone", icon: Trophy, colorClass: "text-indigo-600", bgClass: "bg-indigo-50 border border-indigo-200" },
  { key: "Special", label: "Special", icon: Flame, colorClass: "text-emerald-600", bgClass: "bg-emerald-50 border border-emerald-200" },
  { key: "Memory", label: "Memory", icon: Bookmark, colorClass: "text-violet-600", bgClass: "bg-violet-50 border border-violet-200" },
];

export function DateModal({
  date,
  currency: initialCurrency,
  onClose,
  onViewCertificate,
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currency, setCurrency] = useState<"INR" | "USD">(initialCurrency || "INR");
  const [submitting, setSubmitting] = useState(false);
  const displayPrice = currency === "INR" ? price : date.isPremium ? 14.99 : 8.99;

  // OTP Verification States
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number>(300);
  const [isVerified, setIsVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    if (!otpSent || isVerified || otpTimer <= 0) return;

    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, isVerified, otpTimer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (initialCurrency) {
      setCurrency(initialCurrency);
    } else {
      getDetectedCurrency().then(setCurrency);
    }
  }, [initialCurrency]);

  const handleSendOtp = async () => {
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      setOtpError("Please enter a valid email address first.");
      return;
    }

    setSendingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");

      setOtpSent(true);
      setOtpTimer(300);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit code.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail.trim(), otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      setIsVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Image size must be under 3MB");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Image upload failed");
    return data.imageUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setOtpError("Please verify your email address via OTP before proceeding.");
      return;
    }
    setSubmitting(true);

    try {
      let uploadedImageUrl = "";
      if (imageFile) {
        setUploadingImage(true);
        uploadedImageUrl = await uploadImage(imageFile);
        setUploadingImage(false);
      }

      const res = await fetch(apiUrl("/api/payment/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: date.dateKey,
          isGift,
          name: name.trim(),
          imageUrl: uploadedImageUrl || undefined,
          currency,
          senderName: isGift ? senderName.trim() : undefined,
          buyerEmail: buyerEmail.trim(),
          title: title.trim(),
          story: story.trim(),
          category,
          link: link.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Order creation failed");
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const selectedCatObj = CATEGORY_OPTIONS.find((c) => c.key === category) || CATEGORY_OPTIONS[5];
  const SelectedCatIcon = selectedCatObj.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/40">
                {owner ? "Current Claimant" : "Available Date"}
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
              <a
                href={`/date/${date.dateKey}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  onViewCertificate?.(date.dateKey);
                  onClose();
                }}
                className="flex items-center gap-1 font-bold text-black hover:underline cursor-pointer"
              >
                View Certificate <ArrowRight size={12} />
              </a>
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
                    Dedication Photo (Optional)
                  </label>

                  {imagePreview ? (
                    <div className="relative mt-1.5 h-24 w-24 overflow-hidden rounded-2xl border border-black/10">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                        aria-label="Remove dedication photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-[#fafaf8] py-3 text-xs font-semibold text-black/60 transition hover:border-black/50 hover:bg-white">
                      <Upload size={14} />
                      <span>Upload a Photo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

              {/* Email & OTP Verification */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Your Email Address (For Certificate & Receipt) *
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="email"
                    disabled={isVerified}
                    value={buyerEmail}
                    onChange={(e) => {
                      setBuyerEmail(e.target.value);
                      if (isVerified) setIsVerified(false);
                    }}
                    placeholder="you@example.com"
                    className="flex-1 rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold text-black transition focus:border-black focus:bg-white focus:outline-none disabled:opacity-60"
                    required
                  />

                  {!isVerified ? (
                    <button
                      type="button"
                      disabled={sendingOtp || !buyerEmail}
                      onClick={handleSendOtp}
                      className="rounded-xl border border-black bg-black px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-black/80 disabled:opacity-40"
                    >
                      {sendingOtp ? "Sending..." : otpSent ? "Resend" : "Send Code"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600">
                      ✓ Verified
                    </span>
                  )}
                </div>

                {/* OTP Input Box (Shows only after code is sent and before verification) */}
                {otpSent && !isVerified && (
                  <div className="mt-2 rounded-xl border border-black/10 bg-[#fafaf8] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-black/70">
                        Enter the 6-digit code sent to your inbox:
                      </p>
                      {otpTimer > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Clock size={11} />
                          Expires in {formatTimer(otpTimer)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          Code expired
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-32 rounded-lg border border-black/15 bg-white px-3 py-2 text-center text-sm font-bold tracking-widest text-black focus:border-black focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={verifyingOtp || otp.length !== 6 || otpTimer === 0}
                        onClick={handleVerifyOtp}
                        className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/80 disabled:opacity-40"
                      >
                        {verifyingOtp ? "Checking..." : "Verify Code"}
                      </button>
                    </div>
                  </div>
                )}

                {otpError && (
                  <p className="text-[11px] font-medium text-red-500">{otpError}</p>
                )}
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
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(!categoryOpen)}
                      className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-[#fafaf8] px-3 py-2 text-xs font-semibold text-stone-900 transition-all hover:border-black/30 hover:bg-white focus:border-black focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${selectedCatObj.bgClass} ${selectedCatObj.colorClass}`}>
                          <SelectedCatIcon size={11} />
                        </span>
                        <span className="font-bold">{category}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-stone-400 transition-transform duration-200 ${categoryOpen ? "rotate-180 text-black" : ""}`}
                      />
                    </button>

                    {categoryOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setCategoryOpen(false)}
                        />
                        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                          <div className="space-y-0.5">
                            {CATEGORY_OPTIONS.map((item) => {
                              const ItemIcon = item.icon;
                              const isSelected = category === item.key;
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setCategory(item.key);
                                    setCategoryOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                                    isSelected
                                      ? "bg-black text-white shadow-xs"
                                      : "text-stone-700 hover:bg-stone-100 hover:text-black"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`flex h-5 w-5 items-center justify-center rounded-md ${
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : `${item.bgClass} ${item.colorClass}`
                                      }`}
                                    >
                                      <ItemIcon size={11} />
                                    </span>
                                    <span>{item.label}</span>
                                  </div>
                                  {isSelected && <Check size={13} className="text-white" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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
                <div className="mt-0.5 text-2xl font-black">
                  {currency === "INR" ? "₹" : "$"}{displayPrice}
                </div>
              </div>
              <div className="text-right text-[10px] font-medium text-black/50">
                Digital Date Claim
                <br />
                Date Claim Certificate
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || uploadingImage || !isVerified}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-sm font-bold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{uploadingImage ? "Uploading Photo..." : "Preparing Checkout..."}</span>
                </>
              ) : !isVerified ? (
                <span>Verify Email to Continue</span>
              ) : (
                <>
                  <span>
                    {isGift ? "Gift Date" : "Claim Date"} for {currency === "INR" ? "₹" : "$"}{displayPrice}
                  </span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}

export default DateModal;
