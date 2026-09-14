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
      // Export at 150 DPI A4 portrait dimensions: 1240px x 1754px
      const dataUrl = await toPng(element, {
        quality: 1.0,
        canvasWidth: 1240,
        canvasHeight: 1754,
        backgroundColor: "#faf8f1",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `OwnADate_Certificate_${dateKey}_A4.png`;
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
        link.download = `OwnADate_Certificate_${dateKey}_A4.png`;
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
          ACTION BAR
      ========================================================== */}
      <div className="mx-auto flex max-w-[794px] items-center justify-between print:hidden">
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
          CERTIFICATE - STRICT A4 PROPORTIONS (1:1.414)
      ========================================================== */}
      <div className="mx-auto mt-4 sm:mt-6 w-full max-w-[794px] print:mt-0 print:h-full print:w-full print:max-w-none">

        {/* Outer paper shadow */}
        <div className="relative rounded-[20px] sm:rounded-[32px] bg-[#d9d4c8] p-[3px] sm:p-[6px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:shadow-[0_35px_100px_rgba(0,0,0,0.18)] print:h-full print:rounded-none print:bg-white print:p-0 print:shadow-none">

          {/* Outer frame - Enforces exact A4 aspect ratio (1 : 1.414) */}
          <div
            ref={certificateRef}
            className="relative overflow-hidden rounded-[16px] sm:rounded-[26px] border border-black/15 bg-[#faf8f1] aspect-[1/1.414] flex flex-col justify-between print:h-full print:rounded-[16px] print:border-black/20"
          >

            {/* =====================================================
                SUBTLE PAPER LIGHTING
            ====================================================== */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9),transparent_42%)]" />

            {/* =====================================================
                DECORATIVE DOUBLE FRAME
            ====================================================== */}
            <div className="pointer-events-none absolute inset-2 sm:inset-3 rounded-[13px] sm:rounded-[22px] border border-black/[0.10] print:inset-2.5 print:rounded-[14px]" />
            <div className="pointer-events-none absolute inset-[6px] sm:inset-[10px] rounded-[10px] sm:rounded-[18px] border border-black/[0.045] print:inset-[7px] print:rounded-[11px]" />

            {/* =====================================================
                CORNER ORNAMENTS
            ====================================================== */}
            <div className="pointer-events-none absolute left-2.5 top-2.5 sm:left-5 sm:top-5 h-8 w-8 sm:h-16 sm:w-16 print:left-4 print:top-4 print:h-12 print:w-12">
              <div className="absolute left-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute left-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5 h-1 w-1 sm:h-2 sm:w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute right-2.5 top-2.5 sm:right-5 sm:top-5 h-8 w-8 sm:h-16 sm:w-16 print:right-4 print:top-4 print:h-12 print:w-12">
              <div className="absolute right-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute right-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 h-1 w-1 sm:h-2 sm:w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute bottom-2.5 left-2.5 sm:bottom-5 sm:left-5 h-8 w-8 sm:h-16 sm:w-16 print:bottom-4 print:left-4 print:h-12 print:w-12">
              <div className="absolute bottom-0 left-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 h-1 w-1 sm:h-2 sm:w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute bottom-2.5 right-2.5 sm:bottom-5 sm:right-5 h-8 w-8 sm:h-16 sm:w-16 print:bottom-4 print:right-4 print:h-12 print:w-12">
              <div className="absolute bottom-0 right-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 right-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 h-1 w-1 sm:h-2 sm:w-2 border border-black/20 rotate-45" />
            </div>

            {/* =====================================================
                A4 FLEX CONTENT - PERFECT PROPORTIONAL SPACING
            ====================================================== */}
            <div className="relative flex h-full flex-col justify-between px-3 py-4 sm:px-10 sm:py-8 lg:px-12 lg:py-10 print:px-10 print:py-8">

              {/* SECTION 1: TOP ORNAMENT & DATE HERO */}
              <div>
                {/* Top Ornament */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 print:gap-3">
                  <div className="h-px w-8 sm:w-20 print:w-16 bg-black/15" />
                  <div className="relative flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center print:h-7 print:w-7">
                    <div className="absolute inset-0 rotate-45 border border-black/15" />
                    <Sparkles
                      size={10}
                      className="relative text-black/55 sm:size-3 print:h-3 print:w-3"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="h-px w-8 sm:w-20 print:w-16 bg-black/15" />
                </div>

                {/* Certificate Label */}
                <div className="mt-2.5 sm:mt-4 text-center print:mt-2">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-[#f4f1e8] px-3 py-1 sm:px-4 sm:py-1.5 text-[7px] sm:text-[8px] font-black uppercase tracking-[0.28em] sm:tracking-[0.38em] text-black/45">
                    Date Claim Certificate
                  </span>
                </div>

                {/* Date Hero */}
                <div className="mt-3 sm:mt-6 text-center print:mt-3">
                  <h1 className="text-[22px] xs:text-[28px] sm:text-[46px] lg:text-[56px] font-black leading-[0.95] tracking-[-0.05em] sm:tracking-[-0.065em] text-[#111]">
                    {formatDate(dateKey)}
                  </h1>

                  <div className="mx-auto mt-2.5 sm:mt-4 flex max-w-[140px] sm:max-w-xs items-center justify-center gap-2 sm:gap-3">
                    <div className="h-px flex-1 bg-black/[0.10]" />
                    <span className="text-[7px] sm:text-[8px] text-black/30">✦</span>
                    <div className="h-px flex-1 bg-black/[0.10]" />
                  </div>

                  <p className="mt-2 sm:mt-3 text-[7px] sm:text-[8px] font-black uppercase tracking-[0.25em] sm:tracking-[0.38em] text-black/30">
                    Active Digital Date Claim
                  </p>

                  <p className="mt-0.5 text-[6.5px] sm:text-[7.5px] font-bold uppercase tracking-[0.18em] sm:tracking-[0.22em] text-black/20">
                    Own a Date Calendar
                  </p>
                </div>
              </div>

              {/* SECTION 2: DEDICATION & AVATAR */}
              <div className="mt-3 sm:mt-6 text-center">
                <p className="text-[7px] sm:text-[8.5px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.34em] text-black/35">
                  This date claim is associated with
                </p>

                {/* Avatar */}
                <div className="mt-2.5 sm:mt-6 print:mt-2.5">
                  {certificate.imageUrl ? (
                    <div className="relative mx-auto h-[54px] w-[54px] sm:h-[90px] sm:w-[90px]">
                      <div className="absolute -inset-2 sm:-inset-3 rounded-full border border-black/[0.045]" />
                      <div className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-black/10" />

                      <div className="relative h-[54px] w-[54px] sm:h-[90px] sm:w-[90px] rounded-full bg-[#f5f1e7] p-[2px] sm:p-[4px] shadow-[0_6px_16px_rgba(0,0,0,0.08)] sm:shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
                        <img
                          src={certificate.imageUrl}
                          alt={certificate.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto h-[52px] w-[52px] sm:h-[82px] sm:w-[82px]">
                      <div className="absolute -inset-2 sm:-inset-3 rounded-full border border-black/[0.045]" />
                      <div className="absolute -inset-1.5 sm:-inset-2 rounded-full border border-black/10" />

                      <div className="relative flex h-[52px] w-[52px] sm:h-[82px] sm:w-[82px] items-center justify-center rounded-full bg-[#171717] text-xl sm:text-2xl font-black text-white shadow-[0_6px_16px_rgba(0,0,0,0.12)] sm:shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
                        {certificate.initial}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="mt-2 sm:mt-5 text-[20px] sm:text-[34px] lg:text-[40px] font-black tracking-[-0.045em] text-[#111]">
                  {certificate.name}
                </div>

                {certificate.isGift && certificate.senderName && (
                  <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50/70 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[7px] sm:text-[8.5px] font-bold uppercase tracking-[0.14em] text-rose-500">
                    <Gift size={10} className="sm:size-3" />
                    Dedicated with love by {certificate.senderName}
                  </div>
                )}
              </div>

              {/* Central Ornament */}
              <div className="mx-auto mt-3 sm:mt-6 flex max-w-xs sm:max-w-md items-center justify-center gap-3 sm:gap-4">
                <div className="h-px flex-1 bg-black/[0.08]" />
                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                  <span className="h-1.5 w-1.5 rotate-45 border border-black/20" />
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                </div>
                <div className="h-px flex-1 bg-black/[0.08]" />
              </div>

              {/* SECTION 3: DEDICATION PLAQUE */}
              <div className="mx-auto mt-3 sm:mt-6 w-full max-w-2xl">
                <div className="relative rounded-[16px] sm:rounded-[24px] border border-black/[0.09] bg-[#f5f2e9] px-4 py-4 sm:px-8 sm:py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_20px_rgba(0,0,0,0.03)]">
                  {/* plaque inner border */}
                  <div className="pointer-events-none absolute inset-1.5 sm:inset-2 rounded-[12px] sm:rounded-[18px] border border-black/[0.045]" />

                  <div className="relative text-center">
                    <div className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.28em] sm:tracking-[0.36em] text-black/25">
                      Personal Dedication
                    </div>

                    {/* Decorative quotation */}
                    <div className="mt-1 sm:mt-2 text-xl sm:text-3xl font-serif leading-none text-black/10">
                      “
                    </div>

                    <div className="mx-auto -mt-1 max-w-xl text-[13px] sm:text-[18px] lg:text-[20px] font-black leading-snug tracking-[-0.02em] text-black">
                      {certificate.title}
                    </div>

                    <div className="mx-auto mt-2 sm:mt-4 h-px w-6 sm:w-10 bg-black/15" />

                    <p className="mx-auto mt-2 sm:mt-4 max-w-xl text-[9.5px] leading-relaxed sm:text-[12px] sm:leading-6 text-black/55">
                      {certificate.story}
                    </p>

                    {certificate.link && (
                      <div className="mt-3 sm:mt-5 border-t border-black/[0.06] pt-2 sm:pt-3">
                        <a
                          href={certificate.link}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[7.5px] sm:text-[8.5px] font-bold text-black/35 underline decoration-black/15 underline-offset-4 transition hover:text-black"
                        >
                          {certificate.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: AUTHENTICITY / REGISTRY FOOTER */}
              <div className="mt-4 sm:mt-8 border-t border-black/[0.09] pt-3 sm:pt-6">
                <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
                  {/* Certificate ID */}
                  <div className="text-center sm:text-left">
                    <div className="text-[6.5px] sm:text-[7px] font-black uppercase tracking-[0.32em] text-black/25">
                      Certificate ID
                    </div>
                    <div className="mt-0.5 sm:mt-1 font-mono text-[8.5px] sm:text-[9.5px] font-black tracking-[0.14em] text-black/65">
                      {certificate.certificateId}
                    </div>
                  </div>

                  {/* Luxury Seal */}
                  <div className="flex flex-col items-center">
                    <div className="relative flex h-[58px] w-[58px] sm:h-[76px] sm:w-[76px] items-center justify-center rounded-full border border-black/20 bg-[#f8f5ec] shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                      {/* outer ring */}
                      <div className="absolute -inset-1 rounded-full border border-black/[0.06]" />
                      {/* inner ring */}
                      <div className="absolute inset-1 sm:inset-1.5 rounded-full border border-dashed border-black/20" />

                      {/* seal content */}
                      <div className="relative text-center">
                        <div className="text-[5px] sm:text-[5.5px] font-black uppercase tracking-[0.2em] text-black/35">
                          Own a Date
                        </div>
                        <div className="mt-0.5 text-[8px] sm:text-[9.5px] font-black uppercase tracking-[0.14em] text-black/75">
                          Verified
                        </div>
                        <div className="mx-auto my-0.5 h-1 w-1 rotate-45 bg-black/60" />
                        <div className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] text-black/45">
                          Claim
                        </div>
                      </div>
                    </div>

                    <div className="mt-1 sm:mt-2 text-[5px] sm:text-[5.5px] font-bold uppercase tracking-[0.26em] text-black/20">
                      Digital Record • Verified Claim
                    </div>
                  </div>

                  {/* Registration date */}
                  <div className="text-center sm:text-right">
                    <div className="text-[6.5px] sm:text-[7px] font-black uppercase tracking-[0.32em] text-black/25">
                      Date Claimed
                    </div>
                    <div className="mt-0.5 sm:mt-1 text-[8.5px] sm:text-[9.5px] font-bold text-black/65">
                      {certificate.claimedAt}
                    </div>
                  </div>
                </div>

                {/* Explicit Legal Disclaimer */}
                <div className="mt-3 sm:mt-5 border-t border-black/[0.06] pt-2 sm:pt-4 text-center text-[7px] sm:text-[8px] font-medium leading-relaxed text-black/40">
                  This certificate is a record of your claim on the Own A Date platform. It does not represent legal ownership of the date itself or any property, intellectual property, or other legal right.
                </div>

                {/* Final Brand Mark */}
                <div className="mt-3 sm:mt-5 flex items-center justify-center gap-3">
                  <div className="h-px w-8 sm:w-12 bg-black/[0.07]" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[6.5px] sm:text-[7px] text-black/20">✦</span>
                    <span className="text-[6.5px] sm:text-[7px] font-black uppercase tracking-[0.35em] text-black/20">
                      Own a Date
                    </span>
                    <span className="text-[6.5px] sm:text-[7px] text-black/20">✦</span>
                  </div>
                  <div className="h-px w-8 sm:w-12 bg-black/[0.07]" />
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
