import { ArrowLeft, Download, Share2, Check, Sparkles, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateOwner } from "../../types/calendar";
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
  const [certificateOwner, setCertificateOwner] = useState<DateOwner | null>(owner || null);
  const [loading, setLoading] = useState(!owner);
  const [notFound, setNotFound] = useState(false);
  const isJustClaimed = new URLSearchParams(window.location.search).get("claimed") === "success";

  useEffect(() => {
    if (owner) return;

    fetch(`http://localhost:5000/api/dates/${dateKey}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not claimed");
        return res.json();
      })
      .then((data: { owner: DateOwner }) => setCertificateOwner(data.owner))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [dateKey, owner]);

  if (loading) {
    return <div className="min-h-screen bg-[#f5f5f2] p-10 text-center">Verifying ownership...</div>;
  }

  if (notFound || !certificateOwner) {
    return <div className="min-h-screen bg-[#f5f5f2] p-10 text-center">This date has not been claimed yet.</div>;
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
    <div className="min-h-screen bg-[#f5f5f2] px-4 py-8 text-[#151515] sm:px-6 lg:px-8">
      {isJustClaimed && (
        <div className="mx-auto mb-6 max-w-3xl rounded-xl bg-emerald-500/10 p-4 text-center text-sm font-semibold text-emerald-700 print:hidden">
          Congratulations! Your claim has been permanently sealed.
        </div>
      )}

      {/* Navigation & Action Bar */}
      <div className="mx-auto flex max-w-3xl items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold transition hover:bg-black hover:text-white"
        >
          <ArrowLeft size={14} /> Back to Calendar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold transition hover:border-black"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>{copied ? "Link Copied!" : "Share"}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-black/80"
          >
            <Download size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* The Printable Certificate Asset */}
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="relative overflow-hidden rounded-[32px] border border-black/15 bg-[#ffffff] p-8 shadow-2xl sm:p-14">
          {/* Subtle Aesthetic Frame */}
          <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-black/[0.08]" />

          {/* Certificate Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f4f0] px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-black/60">
              <Sparkles size={11} /> Certificate of Ownership
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              {formatDate(dateKey)}
            </h1>

            <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
              Permanent Register • Own a Date Registry
            </div>
          </div>

          {/* Recipient / Owner Details */}
          <div className="mt-12 text-center">
            <p className="text-xs uppercase tracking-widest text-black/40">
              This date is officially and permanently dedicated to
            </p>
            <div className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {certificate.imageUrl ? (
                <img
                  src={certificate.imageUrl}
                  alt={certificate.name}
                  className="mx-auto mb-5 h-28 w-28 rounded-full border-4 border-black/5 object-cover shadow-sm"
                />
              ) : (
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-black text-2xl font-bold text-white">
                  {certificate.initial}
                </div>
              )}
              {certificate.name}
            </div>

            {certificate.isGift && certificate.senderName && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-500">
                <Gift size={13} /> Dedicated with love by {certificate.senderName}
              </div>
            )}
          </div>

          {/* Story / Engraving Plaque */}
          <div className="relative mx-auto mt-10 max-w-xl rounded-2xl border border-black/[0.08] bg-[#fafaf8] p-6 text-center shadow-inner">
            <div className="text-sm font-black text-black sm:text-base">
              "{certificate.title}"
            </div>
            <p className="mt-3 text-xs leading-relaxed text-black/70 sm:text-sm">
              {certificate.story}
            </p>

            {certificate.link && (
              <div className="mt-4 pt-4 border-t border-black/[0.05]">
                <a
                  href={certificate.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-black/50 underline hover:text-black"
                >
                  {certificate.link}
                </a>
              </div>
            )}
          </div>

          {/* Certificate Footer / Authenticity Seal */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/[0.08] pt-8 text-center sm:flex-row sm:text-left">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-black/35">
                Certificate ID
              </div>
              <div className="font-mono text-xs font-black tracking-wider text-black">
                {certificate.certificateId}
              </div>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-[#fbfbf9] text-[9px] font-black uppercase tracking-tighter text-black/60 shadow-sm">
              Official
              <br />
              Seal
            </div>

            <div className="sm:text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest text-black/35">
                Date Registered
              </div>
              <div className="text-xs font-bold text-black">
                {certificate.claimedAt}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DateCertificatePage;
