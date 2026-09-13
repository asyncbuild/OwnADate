import { ArrowLeft, Download, Share2, Check, Sparkles, Gift } from "lucide-react";
import { useEffect, useState } from "react";
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
    const maxAttempts = isJustClaimed ? 6 : 1;

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
    if (navigator.share) {
      navigator.share({
        title: `${certificate.name}'s Date - ${formatDate(dateKey)}`,
        text: `Check out ${certificate.name}'s owned date: "${certificate.title}" on Own a Date!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#ebe8df] px-4 py-7 text-[#171717] sm:px-6 lg:px-8">

      {/* =========================================================
          SUCCESS MESSAGE
      ========================================================== */}
      {isJustClaimed && (
        <div className="mx-auto mb-7 max-w-4xl rounded-2xl border border-emerald-900/10 bg-[#f5faf6] px-5 py-4 shadow-sm print:hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Check size={13} strokeWidth={3} />
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
          className="group flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2.5 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white hover:shadow-lg"
        >
          <ArrowLeft
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          Back to Calendar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-4 py-2.5 text-[11px] font-bold shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-black hover:shadow-lg"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Share2 size={14} />
            )}
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full bg-[#151515] px-4 py-2.5 text-[11px] font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/80 hover:shadow-xl"
          >
            <Download size={14} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* =========================================================
          CERTIFICATE
      ========================================================== */}
      <div className="mx-auto mt-8 max-w-4xl">

        {/* Outer paper shadow */}
        <div className="relative rounded-[38px] bg-[#d9d4c8] p-[7px] shadow-[0_35px_100px_rgba(0,0,0,0.18)] print:rounded-none print:bg-white print:p-0 print:shadow-none">

          {/* Outer frame */}
          <div className="relative overflow-hidden rounded-[32px] border border-black/15 bg-[#faf8f1]">

            {/* =====================================================
                SUBTLE PAPER LIGHTING
            ====================================================== */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9),transparent_42%)]" />

            {/* =====================================================
                DECORATIVE DOUBLE FRAME
            ====================================================== */}
            <div className="pointer-events-none absolute inset-3 rounded-[27px] border border-black/[0.10]" />
            <div className="pointer-events-none absolute inset-[13px] rounded-[24px] border border-black/[0.045]" />

            {/* =====================================================
                CORNER ORNAMENTS
            ====================================================== */}
            <div className="pointer-events-none absolute left-6 top-6 h-20 w-20">
              <div className="absolute left-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute left-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute left-3 top-3 h-2 w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute right-6 top-6 h-20 w-20">
              <div className="absolute right-0 top-0 h-full w-px bg-black/15" />
              <div className="absolute right-0 top-0 h-px w-full bg-black/15" />
              <div className="absolute right-3 top-3 h-2 w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute bottom-6 left-6 h-20 w-20">
              <div className="absolute bottom-0 left-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-3 left-3 h-2 w-2 border border-black/20 rotate-45" />
            </div>

            <div className="pointer-events-none absolute bottom-6 right-6 h-20 w-20">
              <div className="absolute bottom-0 right-0 h-full w-px bg-black/15" />
              <div className="absolute bottom-0 right-0 h-px w-full bg-black/15" />
              <div className="absolute bottom-3 right-3 h-2 w-2 border border-black/20 rotate-45" />
            </div>

            {/* =====================================================
                CONTENT
            ====================================================== */}
            <div className="relative px-8 py-12 sm:px-16 sm:py-16 lg:px-20">

              {/* =================================================
                  TOP ORNAMENT
              ================================================== */}
              <div className="flex items-center justify-center gap-4">
                <div className="h-px w-16 bg-black/15 sm:w-24" />

                <div className="relative flex h-9 w-9 items-center justify-center">
                  <div className="absolute inset-0 rotate-45 border border-black/15" />
                  <Sparkles
                    size={13}
                    className="relative text-black/55"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="h-px w-16 bg-black/15 sm:w-24" />
              </div>

              {/* =================================================
                  CERTIFICATE LABEL
              ================================================== */}
              <div className="mt-6 text-center">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-[#f4f1e8] px-5 py-2 text-[8px] font-black uppercase tracking-[0.38em] text-black/45">
                  Date Claim Certificate
                </span>
              </div>

              {/* =================================================
                  DATE HERO
              ================================================== */}
              <div className="mt-8 text-center">

                <h1 className="text-[42px] font-black leading-[0.95] tracking-[-0.065em] text-[#111] sm:text-[68px]">
                  {formatDate(dateKey)}
                </h1>

                <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-black/[0.10]" />
                  <span className="text-[9px] text-black/30">✦</span>
                  <div className="h-px flex-1 bg-black/[0.10]" />
                </div>

                <p className="mt-5 text-[8px] font-black uppercase tracking-[0.38em] text-black/30">
                  Active Digital Date Claim
                </p>

                <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-black/20">
                  Own a Date Calendar
                </p>
              </div>

              {/* =================================================
                  DEDICATION
              ================================================== */}
              <div className="mt-14 text-center sm:mt-16">

                <p className="text-[9px] font-bold uppercase tracking-[0.34em] text-black/35">
                  This date claim is associated with
                </p>

                {/* Avatar */}
                <div className="mt-9">
                  {certificate.imageUrl ? (
                    <div className="relative mx-auto h-[112px] w-[112px]">

                      <div className="absolute -inset-4 rounded-full border border-black/[0.045]" />
                      <div className="absolute -inset-2.5 rounded-full border border-black/10" />

                      <div className="relative h-[112px] w-[112px] rounded-full bg-[#f5f1e7] p-[5px] shadow-[0_12px_35px_rgba(0,0,0,0.13)]">
                        <img
                          src={certificate.imageUrl}
                          alt={certificate.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto h-[100px] w-[100px]">

                      <div className="absolute -inset-4 rounded-full border border-black/[0.045]" />
                      <div className="absolute -inset-2.5 rounded-full border border-black/10" />

                      <div className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#171717] text-3xl font-black text-white shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
                        {certificate.initial}
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="mt-7 text-[34px] font-black tracking-[-0.045em] text-[#111] sm:text-[48px]">
                  {certificate.name}
                </div>

                {certificate.isGift && certificate.senderName && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-rose-50/70 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-rose-500">
                    <Gift size={12} />
                    Dedicated with love by {certificate.senderName}
                  </div>
                )}
              </div>

              {/* =================================================
                  CENTRAL ORNAMENT
              ================================================== */}
              <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-5">
                <div className="h-px flex-1 bg-black/[0.08]" />

                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                  <span className="h-2 w-2 rotate-45 border border-black/20" />
                  <span className="h-1 w-1 rounded-full bg-black/25" />
                </div>

                <div className="h-px flex-1 bg-black/[0.08]" />
              </div>

              {/* =================================================
                  DEDICATION PLAQUE
              ================================================== */}
              <div className="mx-auto mt-10 max-w-2xl">

                <div className="relative rounded-[28px] border border-black/[0.09] bg-[#f5f2e9] px-7 py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(0,0,0,0.035)] sm:px-11 sm:py-10">

                  {/* plaque inner border */}
                  <div className="pointer-events-none absolute inset-2.5 rounded-[22px] border border-black/[0.045]" />

                  <div className="relative text-center">

                    <div className="text-[8px] font-black uppercase tracking-[0.38em] text-black/25">
                      Personal Dedication
                    </div>

                    {/* Decorative quotation */}
                    <div className="mt-5 text-4xl font-serif leading-none text-black/10">
                      “
                    </div>

                    <div className="mx-auto -mt-2 max-w-xl text-[18px] font-black leading-relaxed tracking-[-0.02em] text-black sm:text-[21px]">
                      {certificate.title}
                    </div>

                    <div className="mx-auto mt-6 h-px w-10 bg-black/15" />

                    <p className="mx-auto mt-6 max-w-xl text-[12px] leading-7 text-black/55 sm:text-[13px] sm:leading-7">
                      {certificate.story}
                    </p>

                    {certificate.link && (
                      <div className="mt-7 border-t border-black/[0.06] pt-5">
                        <a
                          href={certificate.link}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-[9px] font-bold text-black/35 underline decoration-black/15 underline-offset-4 transition hover:text-black"
                        >
                          {certificate.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* =================================================
                  AUTHENTICITY / REGISTRY FOOTER
              ================================================== */}
              <div className="mt-14 border-t border-black/[0.09] pt-9 sm:mt-16">

                <div className="grid grid-cols-1 items-center gap-9 sm:grid-cols-[1fr_auto_1fr]">

                  {/* Certificate ID */}
                  <div className="text-center sm:text-left">
                    <div className="text-[7px] font-black uppercase tracking-[0.35em] text-black/25">
                      Certificate ID
                    </div>

                    <div className="mt-2 font-mono text-[10px] font-black tracking-[0.16em] text-black/65">
                      {certificate.certificateId}
                    </div>
                  </div>

                  {/* =================================================
                      LUXURY SEAL
                  ================================================== */}
                  <div className="flex flex-col items-center">

                    <div className="relative flex h-[94px] w-[94px] items-center justify-center rounded-full border border-black/20 bg-[#f8f5ec] shadow-[0_8px_25px_rgba(0,0,0,0.07)]">

                      {/* outer ring */}
                      <div className="absolute -inset-1.5 rounded-full border border-black/[0.06]" />

                      {/* inner ring */}
                      <div className="absolute inset-2 rounded-full border border-dashed border-black/20" />

                      {/* seal content */}
                      <div className="relative text-center">

                        <div className="text-[6px] font-black uppercase tracking-[0.22em] text-black/35">
                          Own a Date
                        </div>

                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-black/75">
                          Verified
                        </div>

                        <div className="mx-auto my-1 h-1.5 w-1.5 rotate-45 bg-black/60" />

                        <div className="text-[8px] font-black uppercase tracking-[0.22em] text-black/45">
                          Claim
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[6px] font-bold uppercase tracking-[0.32em] text-black/20">
                      Digital Record • Verified Claim
                    </div>
                  </div>

                  {/* Registration date */}
                  <div className="text-center sm:text-right">
                    <div className="text-[7px] font-black uppercase tracking-[0.35em] text-black/25">
                      Date Claimed
                    </div>

                    <div className="mt-2 text-[10px] font-bold text-black/65">
                      {certificate.claimedAt}
                    </div>
                  </div>
                </div>

                {/* Explicit Legal Disclaimer */}
                <div className="mt-8 border-t border-black/[0.06] pt-6 text-center text-[9px] font-medium leading-relaxed text-black/40">
                  This certificate is a record of your claim on the Own A Date platform. It does not represent legal ownership of the date itself or any property, intellectual property, or other legal right.
                </div>

                {/* =================================================
                    FINAL BRAND MARK
                ================================================== */}
                <div className="mt-8 flex items-center justify-center gap-4">

                  <div className="h-px w-14 bg-black/[0.07]" />

                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-black/20">✦</span>

                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-black/20">
                      Own a Date
                    </span>

                    <span className="text-[8px] text-black/20">✦</span>
                  </div>

                  <div className="h-px w-14 bg-black/[0.07]" />
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
