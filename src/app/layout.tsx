import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "NewsPlus — AI News Assistant",
  description:
    "AI-powered news monitoring, summarisation, translation & report writing",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/logo-icon.png",
    apple: "/icons/logo-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C2340",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${notoArabic.variable}`}>
      <body className="min-h-screen antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
