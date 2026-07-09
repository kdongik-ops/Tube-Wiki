import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubeWiki",
  description: "YouTube 영상을 정보 밀도 높은 요약 위키 문서로 변환합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
