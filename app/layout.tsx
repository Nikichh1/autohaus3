import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Playfair_Display, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Playfair is used for a single italic serif line on service pages only.
// preload:false keeps it off every OTHER page's critical font payload — it
// downloads on demand where it's actually rendered (display:swap covers FOUT).
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400"],
  preload: false,
});

// Condensed bold display — the "Brier-like" poster headline face for product
// pages. Cyrillic subset is required for the Bulgarian section titles. Only
// product/service pages use it, so it is not preloaded on the homepage/listing.
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["500", "600", "700"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://autohaus.bg"),
  title: {
    default: "AutoHaus — Премиум автомобили",
    template: "%s · AutoHaus",
  },
  description:
    "Премиум автосалон в Пловдив. Продажба, лизинг, застраховки и сервиз на луксозни автомобили.",
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "AutoHaus",
    url: "https://autohaus.bg",
  },
  applicationName: "AutoHaus",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root layout — owns only <html>/<body>, fonts and global styles.
 * Public-site chrome (Nav, Footer, smooth scroll, page transitions, grain) lives
 * in app/(site)/layout.tsx; the admin has its own chrome in app/(admin)/admin/layout.tsx.
 * Keeping the root minimal lets the public site stay statically rendered while the
 * admin renders dynamically — neither inherits the other's shell.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bg"
      className={`${inter.variable} ${manrope.variable} ${playfair.variable} ${oswald.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-base text-fg font-sans">{children}</body>
    </html>
  );
}
