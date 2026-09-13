import { apiUrl } from "../config/api";

let cachedCurrency: "INR" | "USD" | null = null;

export async function getDetectedCurrency(): Promise<"INR" | "USD"> {
  if (cachedCurrency) return cachedCurrency;

  try {
    // 1. Check browser-side GeoIP first (catches browser VPN extensions like VeePN)
    try {
      const browserGeoRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
      if (browserGeoRes.ok) {
        const data = await browserGeoRes.json();
        if (data.country_code) {
          const detected = data.country_code.toUpperCase() === "IN" ? "INR" : "USD";
          cachedCurrency = detected;
          return detected;
        }
      }
    } catch {
      // Fall through if ipapi times out or fails
    }

    // 2. Fallback to Backend /api/geo
    const res = await fetch(apiUrl("/api/geo"));
    if (res.ok) {
      const data = await res.json();
      if (data.currency) {
        const detected = data.currency as "INR" | "USD";
        cachedCurrency = detected;
        return detected;
      }
    }
  } catch (err) {
    console.error("Currency detection error:", err);
  }

  cachedCurrency = "INR";
  return "INR";
}
