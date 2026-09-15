interface FooterProps {
  onOpenAbout: () => void;
  onOpenRules: () => void;
}

export function Footer({ onOpenAbout, onOpenRules }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-black/[0.08] bg-[#f7f7f5] py-10 text-[#151515]">
      <div className="mx-auto max-w-[1500px] px-4 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-3">
            <img
              src="/OwnADate.png"
              alt="Own a Date Logo"
              className="h-8 w-8 rounded-lg object-cover shadow-xs"
            />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-black tracking-tight text-black">
                Own A Date
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">
                Every day has a story
              </p>
            </div>
          </div>

          {/* Streamlined Nav Links */}
          <div className="flex items-center gap-6 text-xs font-bold text-black/60">
            <button
              type="button"
              onClick={onOpenAbout}
              className="transition hover:text-black hover:underline cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={onOpenRules}
              className="transition hover:text-black hover:underline cursor-pointer"
            >
              Terms & Guidelines
            </button>
            <a
              href="mailto:ownadatestore@gmail.com"
              className="transition hover:text-black hover:underline cursor-pointer"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-8 flex flex-col gap-2 border-t border-black/[0.05] pt-6 text-center text-[10px] font-semibold text-black/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Own A Date. All rights reserved.</p>
          <p className="max-w-md sm:text-right">
            A digital claim on Own A Date — not legal ownership of a date or property.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
