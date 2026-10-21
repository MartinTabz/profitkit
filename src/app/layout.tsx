import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfitKid | by Martin Šíl",
  description: "Open-source nástroj pro sledování zisku e-shopu: tržby, náklady na reklamu i nákupní ceny zboží na jednom místě.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
