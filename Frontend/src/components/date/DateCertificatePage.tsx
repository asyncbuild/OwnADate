import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Check, 
  Sparkles, 
  Gift, 
  Lock, 
  Unlock, 
  Settings, 
  Eye, 
  EyeOff, 
  Loader2, 
  Clock, 
  X,
  ShieldCheck,
  AlertCircle 
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import type { DateOwner } from "../../types/calendar";
import { apiUrl } from "../../config/api";
import { formatDate } from "../../utils/calendar";

type CertTheme = "minimal" | "dark";

interface DateCertificatePageProps {
  dateKey: string;
  owner?: DateOwner;
  onBack: () => void;
}

export function DateCertificatePage({
  dateKey,
  owner,
  onBack,
}: DateCertificatePageProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [theme, setTheme] = useState<CertTheme>("minimal");
  const certificateRef = useRef<HTMLDivElement>(null);
  const scaleContainerRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  const [certificateOwner, setCertificateOwner] = useState<DateOwner | null>(
    owner || null
  );
  const [isOwner, setIsOwner] = useState(false);
  const [isPrivateState, setIsPrivateState] = useState<boolean>(owner?.isPrivate || false);
  const [showPhotoState, setShowPhotoState] = useState<boolean>(owner?.showPhotoOnTile ?? true);
  const [loading, setLoading] = useState(!owner);
  const [notFound, setNotFound] = useState(false);

  // Owner Verification Modal state
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState(
    () => sessionStorage.getItem("verified_owner_email") || ""
  );
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isJustClaimed =
    new URLSearchParams(window.location.search).get("claimed") === "success";

  useEffect(() => {
    if (isJustClaimed) {
      import("canvas-confetti").then((confettiModule) => {
        const confetti = confettiModule.default;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.6 },
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.6 },
          });
        }, 350);
      });
    }
  }, [isJustClaimed]);

  useEffect(() => {
    const handleResize = () => {
      if (scaleContainerRef.current) {
        const availableWidth = scaleContainerRef.current.clientWidth;
        const targetWidth = 794;
        if (availableWidth < targetWidth) {
          setCertScale(availableWidth / targetWidth);
        } else {
          setCertScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let attempt = 0;
    const maxAttempts = isJustClaimed ? 8 : 5;

    const fetchCertificate = async () => {
      try {
        const savedEmail = sessionStorage.getItem("verified_owner_email") || "";
        const searchParams = new URLSearchParams(window.location.search);
        if (savedEmail && !searchParams.has("email")) {
          searchParams.set("email", savedEmail);
        }
        const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
        const res = await fetch(apiUrl(`/api/dates/${dateKey}${query}`));
        if (!res.ok) throw new Error("Not claimed");
        const data: { owner: DateOwner; isPrivate?: boolean; isOwner?: boolean } = await res.json();

        if (isMounted) {
          setCertificateOwner(data.owner);
          setIsOwner(Boolean(data.isOwner));
          setIsPrivateState(Boolean(data.isPrivate || data.owner?.isPrivate));
          setShowPhotoState(Boolean(data.owner?.showPhotoOnTile ?? true));
          setLoading(false);
        }
      } catch (err) {
        attempt++;
        if (attempt < maxAttempts && isMounted) {
          setTimeout(fetchCertificate, 1500);
        } else if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    };

    fetchCertificate();

    return () => {
      isMounted = false;
    };
  }, [dateKey, isJustClaimed]);

  const handleSendOtp = async () => {
    if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      setOtpError("Please enter a valid email address.");
      return;
    }
    setSendingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch(apiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail.trim() }),
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
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch(apiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ownerEmail.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      sessionStorage.setItem("verified_owner_email", ownerEmail.trim());
      setVerifyModalOpen(false);

      // Re-fetch certificate with verified email
      const certRes = await fetch(apiUrl(`/api/dates/${dateKey}?email=${encodeURIComponent(ownerEmail.trim())}`));
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificateOwner(certData.owner);
        setIsOwner(true);
        setIsPrivateState(certData.owner.isPrivate ?? false);
        setShowPhotoState(certData.owner.showPhotoOnTile ?? true);
      }
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const emailToUse = ownerEmail || certificateOwner?.buyerEmail;
      if (!emailToUse) {
        throw new Error("Owner email not found. Please verify your ownership first.");
      }
      const res = await fetch(apiUrl("/api/claim/settings"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey,
          email: emailToUse,
          showPhotoOnTile: showPhotoState,
          isPrivate: isPrivateState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      setSettingsSuccess(true);
      setTimeout(() => {
        setSettingsSuccess(false);
        setSettingsModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setSettingsError(err.message || "Failed to update privacy settings");
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ebe8df] px-6 text-center">
        <div className="w-full max-w-sm rounded-[28px] border border-black/10 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <svg className="absolute inset-0 h-16 w-16" viewBox="0 0 64 64">
              <rect
                x="3"
                y="3"
                width="58"
                height="58"
                rx="16"
                fill="none"
                stroke="rgba(0, 0, 0, 0.08)"
                strokeWidth="2.5"
              />
              <rect
                x="3"
                y="3"
                width="58"
                height="58"
                rx="16"
                fill="none"
                stroke="#111"
                strokeWidth="2.5"
                strokeDasharray="60 170"
                className="animate-square-trace"
              />
            </svg>
            <img
              src="/OwnADate.png"
              alt="Own a Date Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-sm"
            />
          </div>

          <h3 className="text-lg font-black text-black">
            {isJustClaimed ? "Finalizing Your Claim..." : "Verifying Ownership"}
          </h3>

          <p className="mt-2.5 text-xs leading-relaxed font-semibold text-black/60">
            {isJustClaimed
              ? "Please do not close or refresh this page. Your ownership is being permanently sealed on the registry."
              : "Fetching certificate details from the registry..."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f5ed] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-black/45">
            Own a Date Registry
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !certificateOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ebe8df] px-6 text-center">
        <div>
          <div className="mb-4 text-3xl text-black/30">✦</div>
          <p className="text-sm font-semibold text-black/50">
            This date has not been claimed yet.
          </p>
        </div>
      </div>
    );
  }

  const certificate = certificateOwner;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/date/${dateKey}`;
    if (navigator.share) {
      navigator.share({
        title: `${certificate.name}'s Date - ${formatDate(dateKey)}`,
        text: `Check out ${certificate.name}'s owned date: "${certificate.title}" on Own a Date!`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current || downloading) return;
    setDownloading(true);

    try {
      const element = certificateRef.current;
      const dataUrl = await toPng(element, {
        quality: 1.0,
        canvasWidth: 1240,
        canvasHeight: 1754,
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `OwnADate_Certificate_${dateKey}_${theme.toUpperCase()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("toPng failed, trying html2canvas fallback:", err);
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
        });
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `OwnADate_Certificate_${dateKey}_${theme.toUpperCase()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackErr) {
        console.error("All certificate download methods failed:", fallbackErr);
      }
    } finally {
      setDownloading(false);
    }
  };

  // Dynamic Theme Preset Configuration (Minimal & Dark)
  const t = {
    minimal: {
      shadowBg: "bg-[#e5e5e2]",
      cardBg: "bg-[#ffffff]",
      borderOuter: "border-2 border-black/20",
      borderInner: "border border-black/15",
      radialGlow: "bg-[radial-gradient(ellipse_at_50%_25%,rgba(0,0,0,0.03),transparent_65%)]",
      watermarkColor: "text-black",
      badgeClass: "border-black/15 bg-[#f5f5f3] text-black/65",
      badgeText: "Date Claim Certificate",
      heroTitle: "text-[#111111]",
      heroSubtext: "text-black/50",
      heroEdition: "text-black/30",
      filigreeText: "text-black/40",
      filigreeLine: "bg-black/15",
      filigreeGradient: "from-transparent via-black/20 to-transparent",
      ownerSub: "text-black/45",
      avatarRing: "from-black/60 via-black/30 to-black/80",
      avatarBg: "bg-[#181818]",
      avatarText: "text-white",
      ownerName: "text-[#111111]",
      plaqueBg: "bg-[#f7f7f5]",
      plaqueBorder: "border-black/12",
      plaqueInnerBorder: "border-black/6",
      plaqueHeader: "text-black/45",
      plaqueQuote: "text-black/15",
      plaqueTitle: "text-[#111111]",
      plaqueStory: "text-black/70",
      sealBorder: "from-black/80 via-black/50 to-black",
      sealBg: "bg-[#111111]",
      sealInnerBorder: "border-white/25",
      sealDashed: "border-white/30",
      sealTop: "text-white/60",
      sealMid: "text-white",
      sealDot: "bg-white/80",
      sealBottom: "text-white/60",
      sealLabel: "text-black/50",
      footerBorder: "border-black/12",
      footerLabel: "text-black/45",
      footerVal: "text-[#111111]",
      disclaimer: "text-black/45",
      brandSig: "text-black/40",
    },
    dark: {
      shadowBg: "bg-[#080808]",
      cardBg: "bg-[#141414]",
      borderOuter: "border-2 border-[#d4af37]/45",
      borderInner: "border border-[#d4af37]/35",
      radialGlow: "bg-[radial-gradient(ellipse_at_50%_25%,rgba(212,175,55,0.15),transparent_65%)]",
      watermarkColor: "text-[#d4af37]",
      badgeClass: "border-[#d4af37]/40 bg-[#221f18] text-[#f3e5ab]",
      badgeText: "✦ Official Certificate of Date Ownership ✦",
      heroTitle: "text-[#f7f7f5]",
      heroSubtext: "text-[#d4af37]/85",
      heroEdition: "text-white/30",
      filigreeText: "text-[#d4af37]",
      filigreeLine: "bg-[#d4af37]/40",
      filigreeGradient: "from-transparent via-[#d4af37]/50 to-transparent",
      ownerSub: "text-[#d4af37]/80",
      avatarRing: "from-[#d4af37] via-[#f3e5ab] to-[#aa7c11]",
      avatarBg: "bg-[#1f1d18]",
      avatarText: "text-[#f3e5ab]",
      ownerName: "text-white",
      plaqueBg: "bg-[#1e1c18]",
      plaqueBorder: "border-[#d4af37]/30",
      plaqueInnerBorder: "border-[#d4af37]/15",
      plaqueHeader: "text-[#f3e5ab]",
      plaqueQuote: "text-[#d4af37]/30",
      plaqueTitle: "text-white",
      plaqueStory: "text-white/75",
      sealBorder: "from-[#d4af37] via-[#f3e5ab] to-[#aa7c11]",
      sealBg: "bg-[#121212]",
      sealInnerBorder: "border-[#f3e5ab]/40",
      sealDashed: "border-[#d4af37]/40",
      sealTop: "text-[#d4af37]",
      sealMid: "text-[#f3e5ab]",
      sealDot: "bg-[#d4af37]",
      sealBottom: "text-[#d4af37]",
      sealLabel: "text-[#d4af37]/75",
      footerBorder: "border-[#d4af37]/30",
      footerLabel: "text-[#d4af37]/70",
      footerVal: "text-white",
      disclaimer: "text-white/45",
      brandSig: "text-[#d4af37]",
    }
  }[theme];

  return (
    <div className="min-h-screen bg-[#ebe8df] px-3 py-4 sm:px-6 sm:py-7 lg:px-8 text-[#171717] print:min-h-0 print:h-screen print:w-screen print:bg-white print:p-0 print:overflow-hidden">

      {/* =========================================================
          SUCCESS MESSAGE
      ========================================================== */}
      {isJustClaimed && (
        <div className="mx-auto mb-4 sm:mb-6 max-w-2xl rounded-2xl border border-emerald-900/10 bg-[#f5faf6] px-4 py-3 shadow-sm print:hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            Your claim has been permanently sealed.
          </div>
        </div>
      )}

      {/* =========================================================
          ACTION BAR - FULLY RESPONSIVE FOR MOBILE, TABLET & DESKTOP
      ========================================================== */}
      <div className="mx-auto w-full max-w-[794px] space-y-2.5 print:hidden">
        {/* Row 1: Back Navigation (Left) & Theme Switcher (Right) */}
        <div className="flex items-center justify-between gap-2 w-full">
          <button
            onClick={onBack}
            className="group flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3.5 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur transition-all hover:border-black hover:bg-black hover:text-white shrink-0 cursor-pointer"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span>Back</span>
          </button>

          {/* Theme Selector: Minimal vs Midnight */}
          <div className="flex h-9 items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1 shadow-xs text-xs shrink-0">
            <button
              onClick={() => setTheme("minimal")}
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-all cursor-pointer ${
                theme === "minimal"
                  ? "bg-black text-white font-bold shadow-xs"
                  : "text-neutral-600 hover:text-black hover:bg-black/5"
              }`}
            >
              <span>🖤</span>
              <span>Minimal</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-all cursor-pointer ${
                theme === "dark"
                  ? "bg-[#252525] text-[#f3e5ab] font-bold shadow-xs"
                  : "text-neutral-600 hover:text-black hover:bg-black/5"
              }`}
            >
              <span>🌙</span>
              <span>Midnight</span>
            </button>
          </div>
        </div>

        {/* Row 2: Actions Toolbar - 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 w-full">
          {/* Action 1: Owner Privacy Controls */}
          {isOwner ? (
            <button
              onClick={() => {
                setSettingsError(null);
                setSettingsModalOpen(true);
              }}
              className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur transition hover:border-black hover:bg-black hover:text-white cursor-pointer w-full sm:w-auto"
            >
              <Settings size={13} className="shrink-0" />
              <span className="truncate">Privacy Settings</span>
            </button>
          ) : certificate.isPrivate ? (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-black px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-black/80 cursor-pointer w-full sm:w-auto"
            >
              <Unlock size={13} className="shrink-0" />
              <span className="truncate">Unlock as Owner</span>
            </button>
          ) : (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3 text-xs font-semibold text-neutral-600 shadow-xs transition hover:text-black hover:border-black cursor-pointer w-full sm:w-auto"
              title="Are you the owner of this date?"
            >
              <Settings size={13} className="shrink-0" />
              <span className="truncate">Owner?</span>
            </button>
          )}

          {/* Action 2: WhatsApp Direct Share */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${certificate.name}'s claimed date: "${certificate.title}" on Own a Date! ✨ ${window.location.origin}/date/${dateKey}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-500/20 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <span>💬</span>
            <span className="truncate">WhatsApp</span>
          </a>

          {/* Action 3: Copy Link */}
          <button
            onClick={handleShare}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur transition hover:border-black hover:bg-black hover:text-white cursor-pointer w-full sm:w-auto"
          >
            {copied ? (
              <Check size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <Share2 size={13} className="shrink-0" />
            )}
            <span className="truncate">{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          {/* Action 4: Download Certificate */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-black px-4 text-xs font-bold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer whitespace-nowrap w-full sm:w-auto sm:ml-auto shrink-0"
          >
            <Download size={13} className={`shrink-0 ${downloading ? "animate-bounce" : ""}`} />
            <span className="sm:hidden">Download</span>
            <span className="hidden sm:inline">{downloading ? "Downloading..." : "Download Certificate"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          CERTIFICATE - UNIFORM DESKTOP LAYOUT (SCALED RESPONSIBLY)
      ========================================================== */}
      <div
        ref={scaleContainerRef}
        className="mx-auto mt-4 sm:mt-6 w-full max-w-[794px] flex justify-center overflow-hidden print:mt-0 print:h-full print:w-full print:max-w-none print:overflow-visible"
        style={{
          height: certScale < 1 ? `${1123 * certScale}px` : "auto",
        }}
      >
        <div
          style={{
            transform: certScale < 1 ? `scale(${certScale})` : "none",
            transformOrigin: "top center",
          }}
          className="w-[794px] h-[1123px] shrink-0"
        >
          {/* Outer paper shadow */}
          <div className={`relative h-full w-full rounded-[32px] ${t.shadowBg} p-[6px] shadow-[0_35px_90px_rgba(0,0,0,0.22)] print:h-full print:rounded-none print:bg-white print:p-0 print:shadow-none transition-colors duration-300`}>

            {/* Outer Frame - Exact 794x1123 A4 Canvas */}
            <div
              ref={certificateRef}
              className={`relative h-full w-full overflow-hidden rounded-[26px] ${t.borderOuter} ${t.cardBg} p-6 flex flex-col justify-between print:h-full print:rounded-[16px] print:border-black/20 transition-colors duration-300`}
            >

              {/* Background Glow */}
              <div className={`pointer-events-none absolute inset-0 ${t.radialGlow}`} />

              {/* Background Watermark Emblem - Intricate Luxury Parchment Crest & Seal */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.055] select-none z-0 overflow-hidden">
                <div className="flex flex-col items-center justify-center text-center transform scale-100 -translate-y-8">
                  {/* Vector Crest Seal SVG */}
                  <svg
                    className={`w-56 h-56 ${t.watermarkColor} mb-3 opacity-85`}
                    viewBox="0 0 200 200"
                    fill="none"
                    stroke="currentColor"
                  >
                    {/* Outer Ornate Concentric Rings */}
                    <circle cx="100" cy="100" r="95" strokeWidth="1.5" strokeDasharray="5 4" />
                    <circle cx="100" cy="100" r="88" strokeWidth="1" />
                    <circle cx="100" cy="100" r="83" strokeWidth="0.75" opacity="0.6" />
                    
                    {/* Outer Cardinal Star Points */}
                    <path d="M100 6 L103 15 L100 24 L97 15 Z" fill="currentColor" />
                    <path d="M100 176 L103 185 L100 194 L97 185 Z" fill="currentColor" />
                    <path d="M6 100 L15 97 L24 100 L15 103 Z" fill="currentColor" />
                    <path d="M176 100 L185 97 L194 100 L185 103 Z" fill="currentColor" />
                    
                    {/* Subtle Diagonal Axis Lines */}
                    <line x1="34" y1="34" x2="166" y2="166" strokeWidth="0.75" strokeDasharray="3 3" />
                    <line x1="166" y1="34" x2="34" y2="166" strokeWidth="0.75" strokeDasharray="3 3" />

                    {/* 8-Point Compass Starburst Crest */}
                    <polygon points="100,42 113,87 158,100 113,113 100,158 87,113 42,100 87,87" strokeWidth="1.25" />
                    <polygon points="100,56 108,92 144,100 108,108 100,144 92,108 56,100 92,92" strokeWidth="0.75" opacity="0.5" fill="currentColor" fillOpacity="0.1" />
                    <circle cx="100" cy="100" r="18" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
                    <circle cx="100" cy="100" r="4" fill="currentColor" />
                  </svg>

                  {/* Watermark Top Sub-Header */}
                  <span className={`text-[10px] font-black uppercase tracking-[0.45em] ${t.watermarkColor} mb-1 opacity-90 pl-[0.45em]`}>
                    ✦ OFFICIAL REGISTRY ✦
                  </span>

                  {/* Main Watermark Title */}
                  <h2 className={`font-serif text-[44px] font-extrabold uppercase tracking-[0.3em] ${t.watermarkColor} pl-[0.3em] leading-none`}>
                    OWN A DATE
                  </h2>

                  {/* Bottom Filigree Accent */}
                  <div className={`mt-2 flex items-center justify-center gap-2.5 ${t.watermarkColor} opacity-85`}>
                    <div className="h-px w-14 bg-current" />
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.3em] pl-[0.3em]">
                      CALENDAR EMBLEM
                    </span>
                    <div className="h-px w-14 bg-current" />
                  </div>
                </div>
              </div>

              {/* =====================================================
                  DOUBLE FILIGREE INNER FRAME
              ====================================================== */}
              <div className={`relative flex h-full flex-col justify-between rounded-[20px] ${t.borderInner} bg-transparent p-7 lg:p-8 transition-colors duration-300`}>

                {/* Corner Filigree Ornaments */}
                <div className={`pointer-events-none absolute left-3 top-3 flex items-center gap-1 ${t.filigreeText}`}>
                  <span className="text-[14px]">✦</span>
                  <div className={`h-px w-6 ${t.filigreeLine}`} />
                </div>
                <div className={`pointer-events-none absolute right-3 top-3 flex items-center gap-1 ${t.filigreeText}`}>
                  <div className={`h-px w-6 ${t.filigreeLine}`} />
                  <span className="text-[14px]">✦</span>
                </div>
                <div className={`pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 ${t.filigreeText}`}>
                  <span className="text-[14px]">✦</span>
                  <div className={`h-px w-6 ${t.filigreeLine}`} />
                </div>
                <div className={`pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 ${t.filigreeText}`}>
                  <div className={`h-px w-6 ${t.filigreeLine}`} />
                  <span className="text-[14px]">✦</span>
                </div>

                {/* SECTION 1: HEADER & DATE HERO */}
                <div>
                  {/* Top Filigree Line */}
                  <div className="flex items-center justify-center gap-3">
                    <div className={`h-px w-20 bg-gradient-to-r ${t.filigreeGradient}`} />
                    <div className="relative flex h-8 w-8 items-center justify-center">
                      <div className={`absolute inset-0 rotate-45 border ${t.borderInner}`} />
                      <Sparkles
                        size={14}
                        className={`relative ${t.filigreeText}`}
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className={`h-px w-20 bg-gradient-to-r ${t.filigreeGradient}`} />
                  </div>

                  {/* Certificate Badge */}
                  <div className="mt-3.5 text-center">
                    <span className={`inline-flex items-center rounded-full border px-5 py-1.5 text-[8px] font-black uppercase tracking-[0.4em] shadow-sm ${t.badgeClass}`}>
                      {t.badgeText}
                    </span>
                  </div>

                  {/* Date Hero */}
                  <div className="mt-4 text-center">
                    <h1 className={`font-serif text-[48px] lg:text-[54px] font-extrabold leading-[0.95] tracking-[-0.04em] ${t.heroTitle} drop-shadow-sm`}>
                      {formatDate(dateKey)}
                    </h1>

                    <div className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2">
                      <div className={`h-px flex-1 ${t.filigreeLine}`} />
                      <span className={`text-[9px] ${t.filigreeText}`}>✦</span>
                      <div className={`h-px flex-1 ${t.filigreeLine}`} />
                    </div>

                    <p className={`mt-2 text-[8px] font-black uppercase tracking-[0.38em] ${t.heroSubtext}`}>
                      Sealed Digital Date Registration
                    </p>

                    <p className={`mt-0.5 text-[7px] font-bold uppercase tracking-[0.22em] ${t.heroEdition}`}>
                      Own a Date Calendar Registry
                    </p>
                  </div>
                </div>

                {/* SECTION 2: ASSOCIATED OWNER & AVATAR */}
                <div className="mt-4 text-center">
                  <p className={`text-[8px] font-bold uppercase tracking-[0.34em] ${t.ownerSub}`}>
                    This date claim is permanently associated with
                  </p>

                  {/* Avatar / Photo Frame - Square & Enlarged */}
                  <div className="mt-3.5">
                    {certificate.imageUrl ? (
                      <div className="relative mx-auto h-[132px] w-[132px]">
                        <div className={`absolute -inset-2 rounded-2xl border ${t.borderInner}`} />
                        <div className={`relative h-[132px] w-[132px] rounded-xl overflow-hidden bg-gradient-to-tr ${t.avatarRing} p-[3px] shadow-lg`}>
                          <img
                            src={certificate.imageUrl}
                            alt={certificate.name}
                            className="h-full w-full rounded-[9px] object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative mx-auto h-[120px] w-[120px]">
                        <div className={`absolute -inset-2 rounded-2xl border ${t.borderInner}`} />
                        <div className={`relative flex h-[120px] w-[120px] items-center justify-center rounded-xl overflow-hidden bg-gradient-to-tr ${t.avatarRing} p-[3px] shadow-lg`}>
                          <div className={`flex h-full w-full items-center justify-center rounded-[9px] ${t.avatarBg} text-5xl font-serif font-black ${t.avatarText} tracking-wider select-none`}>
                            {(certificate.initial || certificate.name?.charAt(0) || "✦").toUpperCase()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Owner Name */}
                  <div className={`mt-3 text-[30px] lg:text-[36px] font-black tracking-[-0.035em] ${t.ownerName}`}>
                    {certificate.name}
                  </div>

                  {certificate.isGift && certificate.senderName && (
                    <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-rose-300/80 bg-rose-50/90 px-3.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-rose-600 shadow-sm">
                      <Gift size={12} className="text-rose-500" />
                      Dedicated with love by {certificate.senderName}
                    </div>
                  )}
                </div>

                {/* Central Ornament */}
                <div className="mx-auto mt-3.5 flex max-w-md items-center justify-center gap-3">
                  <div className={`h-px flex-1 bg-gradient-to-r ${t.filigreeGradient}`} />
                  <div className={`flex items-center gap-1 ${t.filigreeText}`}>
                    <span className="text-[8px]">✦</span>
                    <span className={`h-1.5 w-1.5 rotate-45 border ${t.borderInner}`} />
                    <span className="text-[8px]">✦</span>
                  </div>
                  <div className={`h-px flex-1 bg-gradient-to-r ${t.filigreeGradient}`} />
                </div>

                {/* SECTION 3: DEDICATION PLAQUE */}
                <div className="mx-auto mt-3.5 w-full max-w-2xl">
                  <div className={`relative rounded-[20px] border ${t.plaqueBorder} ${t.plaqueBg} px-7 py-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_6px_18px_rgba(0,0,0,0.03)] transition-colors duration-300`}>
                    {/* Plaque inner border */}
                    <div className={`pointer-events-none absolute inset-1.5 rounded-[16px] border ${t.plaqueInnerBorder}`} />

                    {certificate.isPrivate && !isOwner ? (
                      <div className="relative text-center py-4">
                        <div className="flex justify-center mb-2">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${theme === "dark" ? "bg-white/10 text-[#f3e5ab]" : "bg-black/5 text-black/60"}`}>
                            <Lock size={18} />
                          </div>
                        </div>
                        <div className={`text-[8px] font-black uppercase tracking-[0.3em] ${t.plaqueHeader}`}>
                          Private Dedication
                        </div>
                        <p className={`mx-auto mt-2 max-w-sm text-[11px] leading-relaxed font-medium ${t.plaqueStory}`}>
                          The owner has reserved this date and set the dedication message to private.
                        </p>
                        <button
                          type="button"
                          onClick={() => setVerifyModalOpen(true)}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-black/80 transition cursor-pointer print:hidden"
                        >
                          <Unlock size={12} />
                          <span>Unlock with Owner Email</span>
                        </button>
                      </div>
                    ) : (
                      <div className="relative text-center">
                        <div className={`text-[7.5px] font-black uppercase tracking-[0.36em] ${t.plaqueHeader}`}>
                          Personal Dedication
                        </div>

                        {/* Decorative quotation */}
                        <div className={`mt-0.5 text-2xl font-serif leading-none ${t.plaqueQuote}`}>
                          “
                        </div>

                        <div className={`mx-auto -mt-1 max-w-xl text-[16px] lg:text-[18px] font-black leading-snug tracking-[-0.02em] ${t.plaqueTitle}`}>
                          {certificate.title}
                        </div>

                        <div className={`mx-auto mt-2.5 h-px w-10 ${t.filigreeLine}`} />

                        <p className={`mx-auto mt-2.5 max-w-xl text-[11px] leading-5 font-medium ${t.plaqueStory}`}>
                          {certificate.story}
                        </p>

                        {certificate.link && (
                          <div className={`mt-3.5 border-t ${t.footerBorder} pt-2`}>
                            <a
                              href={certificate.link}
                              target="_blank"
                              rel="noreferrer"
                              className={`break-all text-[8px] font-bold ${t.plaqueHeader} underline underline-offset-4 transition hover:opacity-80`}
                            >
                              {certificate.link}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: SEAL & REGISTRY FOOTER */}
                <div className={`mt-4.5 border-t ${t.footerBorder} pt-3.5 transition-colors duration-300`}>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    {/* Certificate ID */}
                    <div className="text-left">
                      <div className={`text-[6.5px] font-black uppercase tracking-[0.28em] ${t.footerLabel}`}>
                        Certificate ID
                      </div>
                      <div className={`mt-0.5 font-mono text-[9px] font-black tracking-[0.12em] ${t.footerVal}`}>
                        {certificate.certificateId}
                      </div>
                    </div>

                    {/* Embossed Registry Seal */}
                    <div className="flex flex-col items-center">
                      <div className={`relative flex h-[66px] w-[66px] items-center justify-center rounded-full bg-gradient-to-tr ${t.sealBorder} p-[2px] shadow-md`}>
                        <div className={`relative flex h-full w-full items-center justify-center rounded-full ${t.sealBg} p-1 text-center border ${t.sealInnerBorder}`}>
                          {/* Inner dashed ring */}
                          <div className={`absolute inset-1 rounded-full border border-dashed ${t.sealDashed}`} />

                          <div className="relative text-center">
                            <div className={`text-[5px] font-black uppercase tracking-[0.16em] ${t.sealTop}`}>
                              OWN A DATE
                            </div>
                            <div className={`mt-0.5 text-[8.5px] font-black uppercase tracking-[0.12em] ${t.sealMid}`}>
                              VERIFIED
                            </div>
                            <div className={`mx-auto my-0.5 h-0.5 w-0.5 rotate-45 ${t.sealDot}`} />
                            <div className={`text-[6px] font-black uppercase tracking-[0.16em] ${t.sealBottom}`}>
                              CLAIM
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-1 text-[5px] font-black uppercase tracking-[0.24em] ${t.sealLabel}`}>
                        Digital Record • Verified Registry
                      </div>
                    </div>

                    {/* Registration Date */}
                    <div className="text-right">
                      <div className={`text-[6.5px] font-black uppercase tracking-[0.28em] ${t.footerLabel}`}>
                        Date Claimed
                      </div>
                      <div className={`mt-0.5 text-[9px] font-bold ${t.footerVal}`}>
                        {certificate.claimedAt}
                      </div>
                    </div>
                  </div>

                  {/* Explicit Legal Disclaimer */}
                  <div className={`mt-3 border-t ${t.footerBorder} pt-2 text-center text-[7.5px] font-medium leading-tight ${t.disclaimer}`}>
                    This certificate is an official record of your claim on the Own A Date platform. It does not represent legal ownership of the date itself or any property or intellectual property right.
                  </div>

                  {/* Final Brand Signature */}
                  <div className={`mt-2.5 flex items-center justify-center gap-1.5 ${t.brandSig}`}>
                    <div className={`h-px w-10 ${t.filigreeLine}`} />
                    <div className="flex items-center gap-1">
                      <span className="text-[6px]">✦</span>
                      <span className="text-[6px] font-black uppercase tracking-[0.32em]">
                        OWN A DATE REGISTRY
                      </span>
                      <span className="text-[6px]">✦</span>
                    </div>
                    <div className={`h-px w-10 ${t.filigreeLine}`} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: OWNER VERIFICATION (EMAIL & OTP)
      ========================================================== */}
      {verifyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setVerifyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black">
                  <ShieldCheck size={16} />
                </span>
                <h3 className="text-base font-black text-black">Owner Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f1] text-black/60 hover:bg-black hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-2 text-xs text-black/60 leading-relaxed">
              Enter the buyer email address registered for this date to unlock owner controls and private certificate access:
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  Owner Email Address
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 py-2.5 text-xs font-semibold focus:border-black focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={sendingOtp || !ownerEmail}
                    onClick={handleSendOtp}
                    className="rounded-xl bg-black px-3.5 py-2.5 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-40 transition"
                  >
                    {sendingOtp ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="rounded-xl border border-black/10 bg-[#fafaf8] p-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-black/70">
                    <span>Enter the 6-digit code sent to your inbox:</span>
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                      <Clock size={11} /> {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                    </span>
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
                      disabled={verifyingOtp || otp.length !== 6}
                      onClick={handleVerifyOtp}
                      className="flex-1 rounded-lg bg-black px-4 py-2 text-xs font-bold text-white hover:bg-black/80 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                    >
                      {verifyingOtp ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                      <span>Verify & Access</span>
                    </button>
                  </div>
                </div>
              )}

              {otpError && (
                <p className="text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                  {otpError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: OWNER PRIVACY & VISIBILITY CONTROLS
      ========================================================== */}
      {settingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSettingsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-black">
                  <Settings size={16} />
                </span>
                <h3 className="text-base font-black text-black">Manage Privacy Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4f4f1] text-black/60 hover:bg-black hover:text-white transition"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-2 text-xs text-black/60 leading-relaxed">
              As the owner of <strong>{formatDate(dateKey)}</strong>, you can change your visibility options at any time:
            </p>

            <div className="mt-4 space-y-3 rounded-2xl border border-black/10 bg-[#fafaf8] p-4">
              {/* Toggle 1: Tile Photo */}
              <label className="flex items-start justify-between cursor-pointer gap-3 text-xs">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5 font-bold text-black">
                    {showPhotoState ? <Eye size={13} className="text-emerald-600" /> : <EyeOff size={13} className="text-black/40" />}
                    <span>Show Photo on Calendar Tile</span>
                  </div>
                  <p className="text-[11px] text-black/50 leading-tight mt-1">
                    {showPhotoState
                      ? "Your photo is displayed directly on the calendar date tile."
                      : "Your initial is shown on the date tile instead of your photo."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showPhotoState}
                  onChange={(e) => setShowPhotoState(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-black cursor-pointer shrink-0"
                />
              </label>

              {/* Toggle 2: Certificate Visibility */}
              <label className="flex items-start justify-between cursor-pointer gap-3 text-xs pt-3 border-t border-black/10">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5 font-bold text-black">
                    {isPrivateState ? <Lock size={13} className="text-amber-600" /> : <Unlock size={13} className="text-emerald-600" />}
                    <span>Private Dedication & Certificate</span>
                  </div>
                  <p className="text-[11px] text-black/50 leading-tight mt-1">
                    {isPrivateState
                      ? "Only you can view your full dedication story & certificate after email verification."
                      : "Your dedication story & certificate are publicly viewable by visitors."}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateState}
                  onChange={(e) => setIsPrivateState(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-black cursor-pointer shrink-0"
                />
              </label>
            </div>

            {settingsSuccess && (
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 p-2 text-xs font-bold text-emerald-700 animate-in fade-in duration-150">
                <Check size={14} /> Settings updated successfully!
              </div>
            )}

            {settingsError && (
              <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 p-2.5 text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                <AlertCircle size={14} className="shrink-0" />
                <span>{settingsError}</span>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="flex-1 rounded-xl border border-black/10 bg-[#f7f7f5] py-2.5 text-xs font-bold text-black/70 hover:bg-black/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveSettings}
                className="flex-1 rounded-xl bg-black py-2.5 text-xs font-bold text-white hover:bg-black/80 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingSettings ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>{savingSettings ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateCertificatePage;
