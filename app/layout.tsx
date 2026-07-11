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
  themeColor: "#08090c",
  width: "device-width",
  initialScale: 1,
  // Extend the page under the notch / home indicator on phones — the dark
  // canvas paints edge-to-edge and every `env(safe-area-inset-*)` padding in
  // the mobile menu, filter drawer and sticky bars becomes live (they are all
  // written with max() fallbacks, so nothing changes on devices without insets).
  viewportFit: "cover",
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
      <body className="min-h-screen bg-base text-fg font-sans">
        {/* Device-tier gate — runs synchronously BEFORE anything below paints.
            Touch devices with genuinely weak hardware (≤4 GB RAM where exposed,
            or ≤4 cores — old/low-end phones) get `html.lowend`, which lets CSS
            trade the few effects that physically can't run smoothly there
            (per-frame backdrop blur, animated image deblur) for fluid scrolling.
            Every other phone keeps 100% of the design — no compromises. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var n=navigator;if(matchMedia("(pointer: coarse)").matches&&((n.deviceMemory&&n.deviceMemory<=4)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4)))document.documentElement.classList.add("lowend")}catch(e){}',
          }}
        />
        {/* Vehicle photography is still served from the legacy WordPress host —
            warm up DNS + TLS before the first card image is requested. React
            hoists this into <head>. */}
        <link rel="preconnect" href="https://autohaus.bg" />
        {children}
      </body>
    </html>
  );
}
