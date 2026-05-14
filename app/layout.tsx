import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Poppins } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { derivaColors } from "../src/brand";
import "../src/design/tokens.css";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-tracked",
  display: "swap"
});

const siteUrl = "https://derivastudio.cl";
const siteName = "Deriva Coffee Studio";
const description =
  "Deriva Coffee Studio: café de especialidad, mate y cocina en Magnere 1570 Local 105, Providencia, Santiago. Únete a nuestra lista para conocer la fecha de apertura.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Café de especialidad en Providencia`,
    template: `%s · ${siteName}`
  },
  description,
  applicationName: siteName,
  generator: "Next.js",
  keywords: [
    "café de especialidad",
    "specialty coffee",
    "Providencia",
    "Santiago",
    "Magnere",
    "mate",
    "cafetería",
    "Deriva",
    "Deriva Studio",
    "coffee studio"
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "food",
  alternates: {
    canonical: "/",
    languages: {
      "es-CL": "/"
    }
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: siteUrl,
    siteName,
    title: `${siteName} | Café de especialidad en Providencia`,
    description
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Café de especialidad en Providencia`,
    description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: derivaColors.green,
  colorScheme: "light"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es-CL" className={`${cormorant.variable} ${plexMono.variable} ${poppins.variable}`}>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
