import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="zh-CN" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="m-0 min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
