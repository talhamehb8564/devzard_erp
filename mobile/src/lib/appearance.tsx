import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { applyTenantColors, dark, light, type Palette } from "./theme";
import { useSession } from "./session";
import { bakedBrand } from "./config";
import { safeHex } from "./media";
import { ensureFontLoaded, isPortalFont, persistFont, readStoredFont, systemFontFamily, type PortalFont } from "./fonts";

interface Appearance {
  scheme: "light" | "dark";
  colors: Palette;
  fontFamily?: string;
  uiFont: PortalFont | "Outfit";
  applyFont: (name: PortalFont) => void;
  toggle: () => void;
}

const Ctx = createContext<Appearance | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { tenant, brand } = useSession();
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const [stored, setStored] = useState<PortalFont | null>(null);
  const [nativeFamily, setNativeFamily] = useState<string | undefined>(undefined);
  const scheme: "light" | "dark" = override || (system === "dark" ? "dark" : "light");
  const chosen: PortalFont | "Outfit" = stored
    || (isPortalFont(tenant?.uiFont) ? tenant.uiFont : null)
    || (isPortalFont(brand?.uiFont) ? brand.uiFont : null)
    || "Outfit";

  useEffect(() => {
    void readStoredFont().then((v) => { if (v) setStored(v); });
  }, []);

  useEffect(() => {
    if (isPortalFont(tenant?.uiFont)) {
      setStored(tenant.uiFont);
      void persistFont(tenant.uiFont);
    }
  }, [tenant?.uiFont]);

  useEffect(() => {
    let live = true;
    if (isPortalFont(chosen)) void persistFont(chosen);
    void ensureFontLoaded(chosen).then((family) => {
      if (live) setNativeFamily(family || systemFontFamily(chosen));
    });
    return () => { live = false; };
  }, [chosen]);

  const colors = useMemo(
    () =>
      applyTenantColors(
        scheme === "dark" ? dark : light,
        safeHex(tenant?.primaryColor || brand?.primaryColor || bakedBrand()?.primaryColor),
        safeHex(tenant?.accentColor || brand?.accentColor || bakedBrand()?.accentColor),
        safeHex(tenant?.secondaryColor || brand?.secondaryColor || bakedBrand()?.secondaryColor),
      ),
    [scheme, tenant?.primaryColor, tenant?.accentColor, tenant?.secondaryColor, brand?.primaryColor, brand?.accentColor, brand?.secondaryColor],
  );
  const value = useMemo<Appearance>(
    () => ({
      scheme,
      colors,
      fontFamily: nativeFamily,
      uiFont: chosen,
      applyFont: (name: PortalFont) => {
        setStored(name);
        void persistFont(name);
      },
      toggle: () => setOverride(scheme === "dark" ? "light" : "dark"),
    }),
    [scheme, colors, nativeFamily, chosen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppearance");
  return ctx;
}
