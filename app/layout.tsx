import type { Metadata } from "next";
import { Geist, Inter, Source_Serif_4 } from "next/font/google";

import { GooeyFilter } from "@/components/ui/toggle";

import "./globals.css";

// next/font picks up the CSS variables referenced by --font-sans / --font-display /
// --font-editorial in app/globals.css. Keep the variable names in sync with that file.

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "2Linkr | 博主发现与建联工作台",
  description:
    "在 TikTok、YouTube、Instagram 中快速判断博主，并在工作台完成找相似、建联与数据追踪。",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`h-full antialiased ${inter.variable} ${geist.variable} ${sourceSerif.variable}`}
    >
      <body suppressHydrationWarning className="m-0 min-h-full font-sans">
        <GooeyFilter />
        {children}
      </body>
    </html>
  );
}
