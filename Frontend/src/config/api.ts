const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://ownadate.onrender.com" : "http://localhost:5000");

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
