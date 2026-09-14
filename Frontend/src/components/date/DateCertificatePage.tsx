import { ArrowLeft, Download, Share2, Check, Sparkles, Gift } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import html2canvas from "html2canvas";
import type { DateOwner } from "../../types/calendar";
import { apiUrl } from "../../config/api";
import { formatDate } from "../../utils/calendar";

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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [certificateOwner, setCertificateOwner] = useState<DateOwner | null>(
    owner || null
  );
  const [loading, setLoading] = useState(!owner);
  const [notFound, setNotFound] = useState(false);
  const isJustClaimed =
    new URLSearchParams(window.location.search).get("claimed") === "success";

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
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#faf8f1",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `OwnADate_Certificate_${dateKey}.png`;
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
          backgroundColor: "#faf8f1",
          logging: false,
        });
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `OwnADate_Certificate_${dateKey}.png`;
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

  return (
    <div className="min-h-screen bg-[#ebe8df] px-3 py-4 sm:px-6 sm:py-7 lg:px-8 text-[#171717] print:min-h-0 print:h-screen print:w-screen print:bg-white print:p-0 print:overflow-hidden">

      {/* =========================================================
          SUCCESS MESSAGE
      ========================================================== */}
      {isJustClaimed && (
        <div className="mx-auto mb-5 sm:mb-7 max-w-4xl rounded-2xl border border-emerald-900/10 bg-[#f5faf6] px-4 py-3 sm:px-5 sm:py-4 shadow-sm print:hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
            <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            Your claim has been permanently sealed.
          </div>
        </div>
      )}

      {/* =========================================================
          ACTION BAR
      ========================================================== */}
      <div className="mx-auto flex max-w-4xl items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 sm:gap-2 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white hover:shadow-lg"
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          <span className="hidden xs:inline">Back to Calendar</span>
          <span className="xs:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:shadow-lg"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Share2 size={14} />
            )}
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-full bg-[#151515] px-3.5 py-2 sm:px-4 sm:py-2.5 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/80 hover:shadow-xl disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className={downloading ? "animate-bounce" : ""} />
            <span>{downloading ? "Downloading..." : "Download Certificate"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          CERTIFICATE
      ========================================================== */}
      <div className="mx-auto mt-4 sm:mt-8 max-w-4xl print:mt-0 print:h-full print:w-full print:max-w-none">

        {/* Outer paper shadow */}
        <div className="relative rounded-[24px] sm:rounded-[38px] bg-[#d9d4c8] p-[4px] sm:p-[7px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:shadow-[0_35px_100px_rgba(0,0,0,0.18)] print:h-full print:rounded-none print:bg-white print:p-0 print:shadow-none">

          {/* Outer frame */}
          <div
            ref={certificateRef}
            className="relative overflow-hidden rounded-[20px] sm:rounded-[32px] border border-black/15 bg-[#faf8f1] print:h-full print:rounded-[16px] print:border-black/20"
          >

            {/* =====================================================
                SUBTLE PAPER LIGHTING
            ====================================================== */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9),transparent_42%)]" />

            {/* =====================================================
                DECORATIVE DOUBLE FRAME
            ====================================================== */}
            <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-[16px] sm:rounded-[27px] border border-black/[0.10] print:inset-2.5 print:rounded-[14px]" />
            <div className="pointer-events-none absolute inset-[7px] sm:inset-[13px] rounded-[13px] sm:rounded-[24px] border border-black/[0.045] print:inset-[7px] print:rounded-[11px]" />

            {/* =====================================================
                CORNER ORNAMENTS
            ====================================================== */}
            <div className="pointer-events-none absolute left-3 top-3 sm:left-6 sm:top-6 h-12 w-12 sm:h-20 sm:w-20 print:left-4 print:top-4 print:h-12 print:w-12">
              <div className="absolute left-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute left-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute left-2 top-2 sm:left-3 sm:top-3 h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black/20 rotate-45 print:left-2 print:top-2 print:h-1.5 print:w-1.5" />
            </div>

            <div className="pointer-events-none absolute right-3 top-3 sm:right-6 sm:top-6 h-12 w-12 sm:h-20 sm:w-20 print:right-4 print:top-4 print:h-12 print:w-12">
              <div className="absolute right-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute right-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute right-2 top-2 sm:right-3 sm:top-3 h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black/20 rotate-45 print:right-2 print:top-2 print:h-1.5 print:w-1.5" />
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 sm:bottom-6 sm:left-6 h-12 w-12 sm:h-20 sm:w-20 print:bottom-4 print:left-4 print:h-12 print:w-12">
              <div className="absolute bottom-0 left-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black/20 rotate-45 print:bottom-2 print:left-2 print:h-1.5 print:w-1.5" />
            </div>

            <div className="pointer-events-none absolute bottom-3 right-3 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-20 sm:w-20 print:bottom-4 print:right-4 print:h-12 print:w-12">
              <div className="absolute bottom-0 right-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 right-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black/20 rotate-45 print:bottom-2 print:right-2 print:h-1.5 print:w-1.5" />
            </div>

            {/* =====================================================
                CONTENT - FLEX COLUMN SPACE BETWEEN IN PRINT MODE
            ====================================================== */}
            <div className="relative px-4 py-6 sm:px-12 sm:py-12 lg:px-16 lg:py-16 print:flex print:h-full print:flex-col print:justify-between print:px-10 print:py-8">

              {/* SECTION 1: TOP ORNAMENT & DATE HERO */}
              <div>
                {/* Top Ornament */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 print:gap-3">
                  <div className="h-px w-10 sm:w-24 print:w-16 bg-black/15" />
                  <div className="relative flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center print:h-7 print:w-7">
                    <div className="absolute inset-0 rotate-45 border border-black/15" />
                    <Sparkles
                      size={12}
                      className="relative text-black/55 sm:size-3.5 print:h-3 print:w-3"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="h-px w-10 sm:w-24 print:w-16 bg-black/15" />
                </div>

                {/* Certificate Label */}
                <div className="mt-4 sm:mt-6 text-center print:mt-2">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-[#f4f1e8] px-3.5 py-1.5 sm:px-5 sm:py-2 text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.3em] sm:tracking-[0.38em] text-black/45 print:px-3.5 print:py-1 print:text-[7.5px]">
                    Date Claim Certificate
                  </span>
                </div>

                {/* Date Hero */}
                <div className="mt-5 sm:mt-8 text-center print:mt-3">
                  <h1 className="text-[28px] xs:text-[34px] sm:text-[56px] lg:text-[68px] font-black leading-[0.95] tracking-[-0.05em] sm:tracking-[-0.065em] text-[#111] print:text-[46px]">
                    {formatDate(dateKey)}
                  </h1>

                  <div className="mx-auto mt-4 sm:mt-6 flex max-w-[180px] sm:max-w-sm items-center justify-center gap-3 print:mt-2.5 print:max-w-xs">
                    <div className="h-px flex-1 bg-black/[0.10]" />
                    <span className="text-[8px] sm:text-[9px] text-black/30">✦</span>
                    <div className="h-px flex-1 bg-black/[0.10]" />
                  </div>

                  <p className="mt-3 sm:mt-5 text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.3em] sm:tracking-[0.38em] text-black/30 print:mt-2 print:text-[7.5px]">
                    Active Digital Date Claim
                  </p>

                  <p className="mt-0.5 sm:mt-1 text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.22em] text-black/20 print:text-[7px]">
                    Own a Date Calendar
                  </p>
                </div>
              </div>

              {/* SECTION 2: DEDICATION & AVATAR */}
              <div className="mt-8 sm:mt-14 text-center print:mt-3">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.28em] sm:tracking-[0.34em] text-black/35 print:text-[7.5px]">
                  This date claim is associated with
                </p>

                {/* Avatar */}
                <div className="mt-5 sm:mt-9 print:mt-2.5">
                  {certificate.imageUrl ? (
                    <div className="relative mx-auto h-[80px] w-[80px] sm:h-[112px] sm:w-[112px] print:h-[76px] print:w-[76px]">
                      <div className="absolute -inset-3 sm:-inset-4 rounded-full border border-black/[0.045] print:-inset-2" />
                      <div className="absolute -inset-2 sm:-inset-2.5 rounded-full border border-black/10 print:-inset-1" />

                      <div className="relative h-[80px] w-[80px] sm:h-[112px] sm:w-[112px] rounded-full bg-[#f5f1e7] p-[3px] sm:p-[5px] shadow-[0_8px_20px_rgba(0,0,0,0.1)] sm:shadow-[0_12px_35px_rgba(0,0,0,0.13)] print:h-[76px] print:w-[76px] print:p-[3px] print:shadow-none">
                        <img
                          src={certificate.imageUrl}
                          alt={certificate.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto h-[76px] w-[76px] sm:h-[100px] sm:w-[100px] print:h-[70px] print:w-[70px]">
                      <div className="absolute -inset-3 sm:-inset-4 rounded-full border border-black/[0.045] print:-inset-2" />
                      <div className="absolute -inset-2 sm:-inset-2.5 rounded-full border border-black/10 print:-inset-1" />

                      <div className="relative flex h-[76px] w-[76px] sm:h-[100px] sm:w-[100px] items-center justify-center rounded-full bg-[#171717] text-2xl sm:text-3xl font-black text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] sm:shadow-[0_12px_35px_rgba(0,0,0,0.18)] print:h-[70px] print:w-[70px] print:text-xl print:shadow-none">
                        {certificate.initial}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="mt-4 sm:mt-7 text-[26px] sm:text-[44px] lg:text-[48px] font-black tracking-[-0.045em] text-[#111] print:mt-2 print:text-[34px]">
                  {certificate.name}
                </div>

                {certificate.isGift && certificate.senderName && (
                  <div className="mt-3 sm:mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50/70 px-3 py-1.5 sm:px-4 sm:py-2 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.14em] text-rose-500 print:mt-2 print:px-3 print:py-1 print:text-[8px]">
                    <Gift size={11} className="sm:size-3 print:h-3 print:w-3" />
                    Dedicated with love by {certificate.senderName}
                  </div>
                )}
              </div>

              {/* Central Ornament */}
              <div className="mx-auto mt-6 sm:mt-12 flex max-w-xs sm:max-w-md items-center justify-center gap-4 sm:gap-5 print:mt-3 print:max-w-xs">
                <div className="h-px flex-1 bg-black/[0.08]" />
                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                  <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rotate-45 border border-black/20" />
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                </div>
                <div className="h-px flex-1 bg-black/[0.08]" />
              </div>

              {/* SECTION 3: DEDICATION PLAQUE */}
              <div className="mx-auto mt-6 sm:mt-10 max-w-2xl print:mt-3 print:w-full">
                <div className="relative rounded-[20px] sm:rounded-[28px] border border-black/[0.09] bg-[#f5f2e9] px-5 py-6 sm:px-11 sm:py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(0,0,0,0.035)] print:rounded-[18px] print:px-6 print:py-4 print:shadow-none">
                  {/* plaque inner border */}
                  <div className="pointer-events-none absolute inset-2 sm:inset-2.5 rounded-[16px] sm:rounded-[22px] border border-black/[0.045] print:inset-1.5 print:rounded-[14px]" />

                  <div className="relative text-center">
                    <div className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-[0.3em] sm:tracking-[0.38em] text-black/25 print:text-[7px]">
                      Personal Dedication
                    </div>

                    {/* Decorative quotation */}
                    <div className="mt-3 sm:mt-5 text-3xl sm:text-4xl font-serif leading-none text-black/10 print:mt-1 print:text-2xl">
                      “
                    </div>

                    <div className="mx-auto -mt-1 sm:-mt-2 max-w-xl text-[15px] sm:text-[21px] font-black leading-snug sm:leading-relaxed tracking-[-0.02em] text-black print:mt-0 print:text-[15px] print:leading-snug">
                      {certificate.title}
                    </div>

                    <div className="mx-auto mt-4 sm:mt-6 h-px w-8 sm:w-10 bg-black/15 print:mt-2 print:w-8" />

                    <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-[11px] leading-relaxed sm:text-[13px] sm:leading-7 text-black/55 print:mt-2 print:text-[10px] print:leading-relaxed">
                      {certificate.story}
                    </p>

                    {certificate.link && (
                      <div className="mt-5 sm:mt-7 border-t border-black/[0.06] pt-4 sm:pt-5 print:mt-2 print:pt-2">
                        <a
                          href={certificate.link}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[8px] sm:text-[9px] font-bold text-black/35 underline decoration-black/15 underline-offset-4 transition hover:text-black print:text-[8px]"
                        >
                          {certificate.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: AUTHENTICITY / REGISTRY FOOTER */}
              <div className="mt-8 sm:mt-16 border-t border-black/[0.09] pt-6 sm:pt-9 print:mt-4 print:pt-3">
                <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[1fr_auto_1fr] sm:gap-9 print:grid-cols-[1fr_auto_1fr] print:gap-4 print:items-center">
                  {/* Certificate ID */}
                  <div className="text-center sm:text-left print:text-left">
                    <div className="text-[7px] font-black uppercase tracking-[0.35em] text-black/25 print:text-[6.5px]">
                      Certificate ID
                    </div>
                    <div className="mt-1 sm:mt-2 font-mono text-[9.5px] sm:text-[10px] font-black tracking-[0.16em] text-black/65 print:mt-0.5 print:text-[9px]">
                      {certificate.certificateId}
                    </div>
                  </div>

                  {/* Luxury Seal */}
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-[76px] w-[76px] sm:h-[94px] sm:w-[94px] items-center justify-center rounded-full border border-black/20 bg-[#f8f5ec] shadow-[0_6px_20px_rgba(0,0,0,0.06)] sm:shadow-[0_8px_25px_rgba(0,0,0,0.07)] print:h-[64px] print:w-[64px] print:shadow-none">
                      {/* outer ring */}
                      <div className="absolute -inset-1 sm:-inset-1.5 rounded-full border border-black/[0.06] print:-inset-1" />
                      {/* inner ring */}
                      <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-dashed border-black/20 print:inset-1" />

                      {/* seal content */}
                      <div className="relative text-center">
                        <div className="text-[5.5px] sm:text-[6px] font-black uppercase tracking-[0.22em] text-black/35 print:text-[5px]">
                          Own a Date
                        </div>
                        <div className="mt-0.5 sm:mt-1 text-[9.5px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-black/75 print:mt-0.5 print:text-[8.5px]">
                          Verified
                        </div>
                        <div className="mx-auto my-0.5 sm:my-1 h-1 sm:h-1.5 w-1 sm:w-1.5 rotate-45 bg-black/60 print:my-0.5 print:h-1 print:w-1" />
                        <div className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.22em] text-black/45 print:text-[6.5px]">
                          Claim
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 text-[5.5px] sm:text-[6px] font-bold uppercase tracking-[0.28em] sm:tracking-[0.32em] text-black/20 print:mt-1 print:text-[5.5px]">
                      Digital Record • Verified Claim
                    </div>
                  </div>

                  {/* Registration date */}
                  <div className="text-center sm:text-right print:text-right">
                    <div className="text-[7px] font-black uppercase tracking-[0.35em] text-black/25 print:text-[6.5px]">
                      Date Claimed
                    </div>
                    <div className="mt-1 sm:mt-2 text-[9.5px] sm:text-[10px] font-bold text-black/65 print:mt-0.5 print:text-[9px]">
                      {certificate.claimedAt}
                    </div>
                  </div>
                </div>

                {/* Explicit Legal Disclaimer */}
                <div className="mt-5 sm:mt-8 border-t border-black/[0.06] pt-4 sm:pt-6 text-center text-[8px] sm:text-[9px] font-medium leading-relaxed text-black/40 print:mt-2 print:pt-2 print:text-[7.5px] print:leading-tight">
                  This certificate is a record of your claim on the Own A Date platform. It does not represent legal ownership of the date itself or any property, intellectual property, or other legal right.
                </div>

                {/* Final Brand Mark */}
                <div className="mt-5 sm:mt-8 flex items-center justify-center gap-3 sm:gap-4 print:mt-2">
                  <div className="h-px w-10 sm:w-14 bg-black/[0.07] print:w-10" />
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[7px] sm:text-[8px] text-black/20 print:text-[7px]">✦</span>
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.35em] sm:tracking-[0.4em] text-black/20 print:text-[7px]">
                      Own a Date
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-black/20 print:text-[7px]">✦</span>
                  </div>
                  <div className="h-px w-10 sm:w-14 bg-black/[0.07] print:w-10" />
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
