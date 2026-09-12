import { useEffect, useMemo, useState } from "react";
import type { DateCell, DateOwner } from "./types/calendar";
import { INITIAL_OWNED_DATES, INITIAL_ACTIVITIES } from "./constants/calendar";
import { Header } from "./components/layout/Header";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { CalendarGrid } from "./components/calendar/CalendarGrid";
import { DateModal } from "./components/modals/DateModal";
import { DateCertificatePage } from "./components/date/DateCertificatePage";
import { AboutRulesPage } from "./components/pages/AboutRulesPage";
import { apiUrl } from "./config/api";

export default function App() {
  const [ownedDates, setOwnedDates] = useState<Record<string, DateOwner>>(INITIAL_OWNED_DATES);
  const [activities] = useState(INITIAL_ACTIVITIES);
  const [selectedDate, setSelectedDate] = useState<DateCell | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Active page view: "calendar" | "certificate" | "about" | "rules"
  const [activePage, setActivePage] = useState<"calendar" | "certificate" | "about" | "rules">("calendar");
  const [viewingCertificateKey, setViewingCertificateKey] = useState<string | null>(null);
  const publicDateKey = window.location.pathname.match(/^\/date\/(\d{4}-\d{2}-\d{2})$/)?.[1];

  useEffect(() => {
    fetch(apiUrl("/api/dates"))
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load dates");
        return res.json();
      })
      .then((data: { ownedDates?: Record<string, DateOwner> }) => {
        if (data.ownedDates) setOwnedDates(data.ownedDates);
      })
      .catch(() => {
        // Keep the local calendar data available if the backend is offline.
      });
  }, []);

  const claimedCount = useMemo(() => {
    return Object.keys(ownedDates).length;
  }, [ownedDates]);

  // Public certificate URLs are loaded directly from the backend.
  if (publicDateKey) {
    return (
      <DateCertificatePage
        dateKey={publicDateKey}
        onBack={() => {
          window.history.pushState({}, "", "/");
          window.location.reload();
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
        onBack={() => setActivePage("calendar")}
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
            hoveredDate={hoveredDate}
            setHoveredDate={setHoveredDate}
            onSelect={setSelectedDate}
          />

          <RightSidebar activities={activities} />
        </div>
      </main>

      {selectedDate && (
        <DateModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onViewCertificate={(key) => {
            setSelectedDate(null);
            setViewingCertificateKey(key);
            setActivePage("certificate");
          }}
        />
      )}
    </div>
  );
}