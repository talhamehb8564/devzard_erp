export type Theme = "light" | "dark";
const KEY = "atrium.theme";

export const PORTAL_FONTS = [
  "Outfit",
  "Fraunces",
  "Source Sans 3",
  "Literata",
  "Atkinson Hyperlegible",
  "Merriweather",
] as const;

export function readTheme(): Theme {
  const v = localStorage.getItem(KEY);
  if (v === "dark" || v === "light") return v;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Push school primary/accent/secondary into CSS variables used by sidebar, surfaces, and highlights. */
export function applyBrand(primary?: string | null, accent?: string | null, secondary?: string | null) {
  const root = document.documentElement.style;
  const dark = document.documentElement.dataset.theme === "dark";
  if (primary) {
    root.setProperty("--brand", primary);
    root.setProperty("--navy", primary);
    root.setProperty("--forest", primary);
    root.setProperty("--btn", `color-mix(in srgb, ${primary} 72%, #1a0204)`);
    root.setProperty("--btn-hover", `color-mix(in srgb, ${primary} 52%, #120103)`);
    root.setProperty("--sidebar-bg", `color-mix(in srgb, ${primary} 88%, #05070c)`);
  }
  if (accent) {
    root.setProperty("--brand-2", accent);
    root.setProperty("--brass", accent);
    root.setProperty("--brass-2", accent);
    root.setProperty("--accent", accent);
    root.setProperty("--accent-2", `color-mix(in srgb, ${accent} 18%, transparent)`);
  }
  if (secondary) {
    root.setProperty("--brand-3", secondary);
    const lum = luminance(secondary);
    if (dark) {
      root.setProperty("--bg", `color-mix(in srgb, ${secondary} 28%, #10131a)`);
      root.setProperty("--bg-2", `color-mix(in srgb, ${secondary} 18%, #171c26)`);
    } else if (lum > 0.72) {
      root.setProperty("--bg", secondary);
      root.setProperty("--bg-2", "#ffffff");
      root.setProperty("--ink", "#1a1012");
      root.setProperty("--muted", "#5c4548");
    } else {
      root.setProperty("--bg", `color-mix(in srgb, ${secondary} 16%, #ffffff)`);
      root.setProperty("--bg-2", "#ffffff");
      root.setProperty("--ink", lum < 0.18 ? "#f6f1ea" : "#1a1012");
      root.setProperty("--muted", lum < 0.18 ? "#d9cfc4" : "#5c4548");
    }
  }
}

export function applyFont(family?: string | null) {
  const root = document.documentElement.style;
  const name = family && PORTAL_FONTS.includes(family as (typeof PORTAL_FONTS)[number]) ? family : "Outfit";
  const stack = `"${name}", Outfit, system-ui, sans-serif`;
  const serif = name === "Outfit" || name === "Source Sans 3" || name === "Atkinson Hyperlegible"
    ? `"Fraunces", Georgia, serif`
    : `"${name}", Georgia, serif`;
  root.setProperty("--font-ui", stack);
  root.setProperty("--font-serif", serif);
}
