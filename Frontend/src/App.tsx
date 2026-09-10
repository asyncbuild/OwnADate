import { useMemo, useState } from "react";
import type { DateCell, DateOwner } from "./types/calendar";
import { INITIAL_OWNED_DATES, INITIAL_ACTIVITIES } from "./constants/calendar";
import { Header } from "./components/layout/Header";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { CalendarGrid } from "./components/calendar/CalendarGrid";
import { DateModal } from "./components/modals/DateModal";
import { DateCertificatePage } from "./components/date/DateCertificatePage";
import { AboutRulesPage } from "./components/pages/AboutRulesPage";
import { Gift } from "lucide-react";

export default function App() {
  const [ownedDates, setOwnedDates] = useState<Record<string, DateOwner>>(INITIAL_OWNED_DATES);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [selectedDate, setSelectedDate] = useState<DateCell | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Active page view: "calendar" | "certificate" | "about" | "rules"
  const [activePage, setActivePage] = useState<"calendar" | "certificate" | "about" | "rules">("calendar");
  const [viewingCertificateKey, setViewingCertificateKey] = useState<string | null>(null);

  const claimedCount = useMemo(() => {
    return Object.keys(ownedDates).length;
  }, [ownedDates]);

  // Handle successful claim (simulated client-side for now)
  const handleClaimDate = (newOwner: DateOwner) => {
    if (!selectedDate) return;

    const dateKey = selectedDate.dateKey;
    setOwnedDates((prev) => ({
      ...prev,
      [dateKey]: newOwner,
    }));

    // Add to activity feed
    setActivities((prev) => [
      {
        id: Date.now(),
        name: newOwner.senderName || newOwner.name,
        initial: newOwner.initial,
        action: newOwner.isGift ? "gifted" : "claimed",
        date: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        }),
        title: newOwner.title,
        price: newOwner.price,
        time: "Just now",
        icon: Gift,
      },
      ...prev.slice(0, 8),
    ]);

    setSelectedDate(null);
    // Direct buyer straight to their newly created certificate page!
    setViewingCertificateKey(dateKey);
    setActivePage("certificate");
  };

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
          onClaimDate={handleClaimDate}
        />
      )}
    </div>
  );
}