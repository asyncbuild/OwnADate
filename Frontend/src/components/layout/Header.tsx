import { useState } from "react";
import { DateSearchInput } from "./DateSearchInput";
import type { DateOwner } from "../../types/calendar";
import { Menu, X, Info, FileText } from "lucide-react";

interface HeaderProps {
  currency?: "INR" | "USD";
  onCurrencyChange?: (currency: "INR" | "USD") => void;
  ownedDates?: Record<string, DateOwner>;
  onSelectDateKey?: (dateKey: string) => void;
  onOpenAbout?: () => void;
  onOpenRules?: () => void;
}

export function Header({
  ownedDates,
  onSelectDateKey,
  onOpenAbout,
  onOpenRules,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-[#f7f7f5]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] sm:h-[72px] max-w-[1500px] items-center justify-between px-3.5 sm:px-5 lg:px-8 gap-2">
        {/* Logo */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/OwnADate.png"
            alt="Own a Date"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover shadow-sm shrink-0"
          />

          <div className="shrink-0">
            <div className="text-[15px] font-extrabold tracking-tight whitespace-nowrap text-black">
              Own a Date
            </div>

            <div className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-black/40 sm:block whitespace-nowrap">
              Every day has a story
            </div>
          </div>
        </div>

        {/* Navigation & Search */}
        <nav className="flex items-center gap-2 sm:gap-6">
          {/* Quick Date Search */}
          {onSelectDateKey && <DateSearchInput ownedDates={ownedDates} onSelectDateKey={onSelectDateKey} />}

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex sm:items-center sm:gap-5">
            <button
              onClick={onOpenAbout}
              className="text-sm font-medium text-black/55 hover:text-black transition cursor-pointer whitespace-nowrap"
            >
              About
            </button>

            <button
              onClick={onOpenRules}
              className="text-sm font-medium text-black/55 hover:text-black transition cursor-pointer whitespace-nowrap"
            >
              Rules & FAQ
            </button>
          </div>

          {/* Mobile Menu Trigger Button (< sm) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/70 shadow-2xs hover:bg-black/5 transition cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </nav>
      </div>

      {/* Mobile Dropdown Sheet (< sm) */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-black/[0.06] bg-white p-2.5 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAbout?.();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-black/80 hover:bg-[#fafaf7] transition cursor-pointer"
          >
            <Info size={16} className="text-black/50" />
            About Own a Date
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenRules?.();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-black/80 hover:bg-[#fafaf7] transition cursor-pointer"
          >
            <FileText size={16} className="text-black/50" />
            Terms, Rules & FAQ
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
