import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DividendFlow - 배당 투자 관리",
  description: "계좌별 배당 투자 현황 및 포트폴리오 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
