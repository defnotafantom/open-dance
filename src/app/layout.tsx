import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/marketing/splash-screen";
import { GuardiaSessione } from "@/components/guardia-sessione";
import { MINUTI_INATTIVITA, manutenzioneAttiva } from "@/lib/manutenzione";
import "./globals.css";

// Un'unica famiglia, ricavata dalla scritta "OPEN DANCE" del logo:
// Barlow per i testi, Barlow Condensed per titoli/numeri (solo 700) e per
// la scritta del marchio (300, anche corsivo per lo slogan).
const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: "700",
  subsets: ["latin"],
});

const barlowCondensedLight = Barlow_Condensed({
  variable: "--font-barlow-condensed-light",
  weight: "300",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Open Dance",
  description:
    "Gestione corsi, iscrizioni, pagamenti e comunicazioni della scuola di danza.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Dance",
  },
};

export const viewport: Viewport = {
  themeColor: "#e3121f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${barlowCondensedLight.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SplashScreen />
          {manutenzioneAttiva() && <GuardiaSessione minuti={MINUTI_INATTIVITA} />}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
