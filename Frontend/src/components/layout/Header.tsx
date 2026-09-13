interface HeaderProps {
  onOpenAbout?: () => void;
  onOpenRules?: () => void;
}

export function Header({ onOpenAbout, onOpenRules }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.07] bg-[#f7f7f5]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 lg:px-8">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/OwnADate.png"
            alt="Own a Date"
            className="h-9 w-9 rounded-xl object-cover shadow-sm"
          />

          <div>
            <div className="text-[15px] font-bold tracking-tight">
              Own a Date
            </div>

            <div className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-black/40 sm:block">
              Every day has a story
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-6 sm:gap-9">
          <button
            onClick={onOpenAbout}
            className="text-sm font-medium text-black/55 transition hover:text-black"
          >
            About
          </button>

          <button
            onClick={onOpenRules}
            className="text-sm font-medium text-black/55 transition hover:text-black"
          >
            Rules & FAQ
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
