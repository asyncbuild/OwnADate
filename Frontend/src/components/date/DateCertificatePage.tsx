import { ArrowLeft, Download, Share2, Check, Sparkles, Gift } from "lucide-react";
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
  const [loading, setLoading] = useState(!owner);
  const [notFound, setNotFound] = useState(false);
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
    if (owner) return;

    let isMounted = true;
    let attempt = 0;
    const maxAttempts = isJustClaimed ? 8 : 5;

    const fetchCertificate = async () => {
      try {
        const query = window.location.search;
        const res = await fetch(apiUrl(`/api/dates/${dateKey}${query}`));
        if (!res.ok) throw new Error("Not claimed");
        const data: { owner: DateOwner } = await res.json();

        if (isMounted) {
          setCertificateOwner(data.owner);
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
  }, [dateKey, owner, isJustClaimed]);

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
      avatarBg: "bg-[#151515]",
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
      avatarBg: "bg-[#252525]",
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
          ACTION BAR - CLEAN ALIGNMENT FOR MOBILE & DESKTOP
      ========================================================== */}
      <div className="mx-auto flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between max-w-[794px] print:hidden">
        {/* Left Row: Back Button & Theme Pill Selector */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:border-black hover:bg-black hover:text-white shrink-0"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span>Back</span>
          </button>

          {/* Theme Selector: Minimal vs Midnight */}
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1 shadow-sm text-[10.5px] font-bold shrink-0">
            <button
              onClick={() => setTheme("minimal")}
              className={`rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
                theme === "minimal"
                  ? "bg-[#151515] text-white shadow-sm font-black"
                  : "text-black/60 hover:text-black hover:bg-black/5"
              }`}
            >
              🖤 Minimal
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-full px-3 py-1 transition-all duration-200 cursor-pointer ${
                theme === "dark"
                  ? "bg-[#252525] text-[#f3e5ab] shadow-sm font-black"
                  : "text-black/60 hover:text-black hover:bg-black/5"
              }`}
            >
              🌙 Midnight
            </button>
          </div>
        </div>

        {/* Right Row: Share & Download Buttons */}
        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto flex-wrap">
          {/* WhatsApp Direct Share Button */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${certificate.name}'s claimed date: "${certificate.title}" on Own a Date! ✨ ${window.location.origin}/date/${dateKey}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-500/20 shadow-xs cursor-pointer"
          >
            <span>💬 WhatsApp</span>
          </a>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:border-black hover:shadow-md cursor-pointer"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Share2 size={14} />
            )}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-full bg-[#151515] px-4 py-2 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:bg-black/80 hover:shadow-xl disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <Download size={14} className={downloading ? "animate-bounce" : ""} />
            <span>{downloading ? "Downloading..." : "Download Certificate"}</span>
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

                  {/* Avatar with Metallic Ring */}
                  <div className="mt-3.5">
                    {certificate.imageUrl ? (
                      <div className="relative mx-auto h-[76px] w-[76px]">
                        <div className={`absolute -inset-2 rounded-full border ${t.borderInner}`} />
                        <div className={`relative h-[76px] w-[76px] rounded-full bg-gradient-to-tr ${t.avatarRing} p-[3.5px] shadow-md`}>
                          <img
                            src={certificate.imageUrl}
                            alt={certificate.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative mx-auto h-[70px] w-[70px]">
                        <div className={`absolute -inset-2 rounded-full border ${t.borderInner}`} />
                        <div className={`relative flex h-[70px] w-[70px] items-center justify-center rounded-full ${t.avatarBg} text-2xl font-black ${t.ownerName} shadow-md border ${t.borderInner}`}>
                          {certificate.initial}
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
    </div>
  );
}

export default DateCertificatePage;
