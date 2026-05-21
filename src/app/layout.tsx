import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "上班吃什麼",
  description: "午休煩惱終結者 — 員工特約店家一覽",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "上班吃什麼",
  },
};

export const viewport: Viewport = {
  themeColor: "#FDEEDD",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full antialiased pb-24">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
