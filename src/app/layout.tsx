import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Anton, Alex_Brush } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SplashScreen } from "@/components/marketing/splash-screen";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const alexBrush = Alex_Brush({
  variable: "--font-alex-brush",
  weight: "400",
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
  themeColor: "#A11622",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SplashScreen />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
