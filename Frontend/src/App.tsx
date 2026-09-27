import { useEffect, useMemo, useState } from "react";
import type { DateCell, DateOwner } from "./types/calendar";
import { INITIAL_ACTIVITIES, PREMIUM_DATE_KEYS } from "./constants/calendar";
import { Header } from "./components/layout/Header";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { Footer } from "./components/layout/Footer";
import { CalendarGrid } from "./components/calendar/CalendarGrid";
import { DateModal } from "./components/modals/DateModal";
import { DateCertificatePage } from "./components/date/DateCertificatePage";
import { AboutRulesPage } from "./components/pages/AboutRulesPage";
import { apiUrl } from "./config/api";
import { getDetectedCurrency, setManualCurrency } from "./utils/currency";

export default function App() {
  const [ownedDates, setOwnedDates] = useState<Record<string, DateOwner>>({});
  const [premiumDateKeys, setPremiumDateKeys] = useState<Set<string>>(PREMIUM_DATE_KEYS);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [selectedDate, setSelectedDate] = useState<DateCell | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [isLoadingDates, setIsLoadingDates] = useState(true);

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

    const loadDates = async () => {
      try {
        const res = await fetch(apiUrl("/api/dates"));
        if (!res.ok) throw new Error("Unable to load dates");
        const data: { ownedDates?: Record<string, DateOwner>; premiumDates?: string[] } = await res.json();
        if (data.ownedDates && isMounted) {
          setOwnedDates(data.ownedDates);
        }
        if (data.premiumDates && Array.isArray(data.premiumDates) && isMounted) {
          setPremiumDateKeys(new Set(data.premiumDates));
        }
        if (isMounted) {
          setIsLoadingDates(false);
        }
      } catch (err) {
        attempts++;
        if (attempts < maxAttempts && isMounted) {
          setTimeout(loadDates, 2000);
        } else if (isMounted) {
          setIsLoadingDates(false);
        }
      }
    };

    loadDates();

    return () => {
      isMounted = false;
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
        ownedDates={ownedDates}
        currency={currency}
        onCurrencyChange={(newCurr) => {
          setCurrency(newCurr);
          setManualCurrency(newCurr);
        }}
        onSelectDateKey={(dateKey) => {
          const parts = dateKey.split("-");
          if (parts.length === 3) {
            const day = parseInt(parts[2], 10);
            setSelectedDate({
              day,
              dateKey,
              isPremium: premiumDateKeys.has(dateKey),
              owner: ownedDates[dateKey],
            });
            document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
        onOpenAbout={() => setActivePage("about")}
        onOpenRules={() => setActivePage("rules")}
      />

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-8 lg:py-7">
        <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)_270px]">
          <LeftSidebar
            claimedCount={claimedCount}
            onOpenAbout={() => setActivePage("about")}
            onOpenRules={() => setActivePage("rules")}
          />

          <CalendarGrid
            ownedDates={ownedDates}
            premiumDateKeys={premiumDateKeys}
            currency={currency}
            hoveredDate={hoveredDate}
            setHoveredDate={setHoveredDate}
            onSelect={setSelectedDate}
            isLoading={isLoadingDates}
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
                  isPremium: premiumDateKeys.has(dateKey),
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