import { apiUrl } from "../config/api";

let cachedCurrency: "INR" | "USD" | null = null;

export async function getDetectedCurrency(): Promise<"INR" | "USD"> {
  // 0. Check URL query params (?currency=USD or ?currency=INR)
  if (typeof window !== "undefined") {
    const urlParam = new URLSearchParams(window.location.search).get("currency")?.toUpperCase();
    if (urlParam === "USD" || urlParam === "INR") {
      localStorage.setItem("app_currency", urlParam);
      cachedCurrency = urlParam as "INR" | "USD";
      return cachedCurrency;
    }

    // 1. Check localStorage override
    const storedCurrency = localStorage.getItem("app_currency")?.toUpperCase();
    if (storedCurrency === "USD" || storedCurrency === "INR") {
      cachedCurrency = storedCurrency as "INR" | "USD";
      return cachedCurrency;
    }
  }

  if (cachedCurrency) return cachedCurrency;

  try {
    // 2. Check browser-side GeoIP first (catches browser VPN extensions like VeePN)
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

    // 3. Fallback to Backend /api/geo
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

export function setManualCurrency(currency: "INR" | "USD") {
  if (typeof window !== "undefined") {
    localStorage.setItem("app_currency", currency);
  }
  cachedCurrency = currency;
}
