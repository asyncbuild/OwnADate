import { useEffect, useMemo, useState } from "react";
import type { DateCell, DateOwner } from "./types/calendar";
import { INITIAL_OWNED_DATES, INITIAL_ACTIVITIES, PREMIUM_DATE_KEYS } from "./constants/calendar";
import { Header } from "./components/layout/Header";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { Footer } from "./components/layout/Footer";
import { CalendarGrid } from "./components/calendar/CalendarGrid";
import { DateModal } from "./components/modals/DateModal";
import { DateCertificatePage } from "./components/date/DateCertificatePage";
import { AboutRulesPage } from "./components/pages/AboutRulesPage";
import { apiUrl } from "./config/api";
import { getDetectedCurrency } from "./utils/currency";

export default function App() {
  const [ownedDates, setOwnedDates] = useState<Record<string, DateOwner>>(INITIAL_OWNED_DATES);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [selectedDate, setSelectedDate] = useState<DateCell | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [initialLoading, setInitialLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Active page view: "calendar" | "certificate" | "about" | "rules"
  const [activePage, setActivePage] = useState<"calendar" | "certificate" | "about" | "rules">("calendar");
  const [viewingCertificateKey, setViewingCertificateKey] = useState<string | null>(null);
  const publicDateKey = window.location.pathname.match(/^\/date\/(\d{4}-\d{2}-\d{2})$/)?.[1];

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10;

    getDetectedCurrency().then((curr) => {
      if (isMounted) setCurrency(curr);
    });

    const timer = setTimeout(() => {
      if (isMounted) setIsWakingUp(true);
    }, 1800);

    const loadDates = async () => {
      try {
        const res = await fetch(apiUrl("/api/dates"));
        if (!res.ok) throw new Error("Unable to load dates");
        const data: { ownedDates?: Record<string, DateOwner> } = await res.json();
        if (data.ownedDates && isMounted) {
          setOwnedDates(data.ownedDates);
        }
        if (isMounted) {
          setInitialLoading(false);
          clearTimeout(timer);
        }
      } catch (err) {
        attempts++;
        if (attempts < maxAttempts && isMounted) {
          setTimeout(loadDates, 2000);
        } else if (isMounted) {
          setInitialLoading(false);
          clearTimeout(timer);
        }
      }
    };

    loadDates();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const claimedCount = useMemo(() => {
    return Object.keys(ownedDates).length;
  }, [ownedDates]);

  useEffect(() => {
    const handlePopState = () => {
      const matchKey = window.location.pathname.match(/^\/date\/(\d{4}-\d{2}-\d{2})$/)?.[1];
      if (matchKey) {
        setViewingCertificateKey(matchKey);
        setActivePage("certificate");
      } else {
        setViewingCertificateKey(null);
        setActivePage("calendar");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleBackToCalendar = () => {
    window.history.pushState({}, "", "/");
    setViewingCertificateKey(null);
    setActivePage("calendar");
  };

  // Initial Server Warmup / Loading Screen
  if (initialLoading && !publicDateKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6 text-center">
        <div className="w-full max-w-sm rounded-[32px] border border-black/10 bg-white p-8 shadow-2xl">
          {/* Stationary Square Frame with Traveling Border Line Animation */}
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
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

          <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
            Own a Date
          </h1>
          <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.28em] text-black/35">
            Every day has a story
          </p>

          <div className="mt-7 border-t border-black/[0.08] pt-6">
            <p className="text-xs font-semibold leading-relaxed text-black/60">
              {isWakingUp
                ? "Opening the vault of 365 unique dates... Every moment is being prepared."
                : "Opening the 365-day calendar registry..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Public certificate URLs are loaded directly from the backend.
  if (publicDateKey) {
    return (
      <DateCertificatePage
        dateKey={publicDateKey}
        onBack={() => {
          window.location.href = "/";
        }}
      />
    );
  }

  // 1. IF VIEWING DEDICATED CERTIFICATE PAGE
  if (activePage === "certificate" && viewingCertificateKey && ownedDates[viewingCertificateKey]) {
    return (
      <DateCertificatePage
        dateKey={viewingCertificateKey}
        owner={ownedDates[viewingCertificateKey]}
        onBack={handleBackToCalendar}
      />
    );
  }

  // 2. IF VIEWING DEDICATED ABOUT OR RULES PAGE
  if (activePage === "about" || activePage === "rules") {
    return (
      <AboutRulesPage
        initialTab={activePage}
        onBack={() => setActivePage("calendar")}
      />
    );
  }

  // 3. STANDARD MASTER CALENDAR LANDING PAGE
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#151515]">
      <Header
        onOpenAbout={() => setActivePage("about")}
        onOpenRules={() => setActivePage("rules")}
      />

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-8 lg:py-7">
        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_270px]">
          <LeftSidebar claimedCount={claimedCount} />

          <CalendarGrid
            ownedDates={ownedDates}
            currency={currency}
            hoveredDate={hoveredDate}
            setHoveredDate={setHoveredDate}
            onSelect={setSelectedDate}
          />

          <RightSidebar
            activities={activities}
            currency={currency}
            onSelectDateKey={(dateKey) => {
              const parts = dateKey.split("-");
              if (parts.length === 3) {
                const day = parseInt(parts[2], 10);
                setSelectedDate({
                  day,
                  dateKey,
                  isPremium: PREMIUM_DATE_KEYS.has(dateKey),
                  owner: ownedDates[dateKey],
                });
              }
            }}
          />
        </div>
      </main>

      <Footer
        onOpenAbout={() => setActivePage("about")}
        onOpenRules={() => setActivePage("rules")}
      />

      {selectedDate && (
        <DateModal
          date={selectedDate}
          currency={currency}
          onClose={() => setSelectedDate(null)}
          onViewCertificate={(key) => {
            setSelectedDate(null);
            window.open(`/date/${key}`, "_blank");
          }}
        />
      )}
    </div>
  );
}