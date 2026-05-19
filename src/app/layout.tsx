import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#EE6C64",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
