import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";
import FirstVisitIntro from "@/components/FirstVisitIntro";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SportIQ - Sports Trivia That Never Repeats",
  description:
    "AI-generated sports trivia across nine sports, five quiz formats and three difficulty levels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        <div className="field-texture" aria-hidden="true">
          <span className="blob-c" />
        </div>
        <AuthProvider>
          <FirstVisitIntro />
          <SiteNav />
          {children}
          <BrandLogo />
        </AuthProvider>
      </body>
    </html>
  );
}
