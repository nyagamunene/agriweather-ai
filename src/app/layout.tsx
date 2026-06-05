import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriWeather AI — Weather Intelligence for Smarter Farming",
  description: "AI-powered agricultural weather intelligence. Transform real-time weather data into actionable farming insights for crops, irrigation, and risk management.",
  keywords: ["agriculture", "weather", "farming", "AI", "crop intelligence"],
  openGraph: {
    title: "AgriWeather AI",
    description: "Weather intelligence for smarter farming",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="bg-[#060d1a] text-white">{children}</body>
    </html>
  );
}
