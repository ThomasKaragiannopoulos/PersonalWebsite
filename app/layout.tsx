import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://karagiannopoulos.dev"),
  title: "Thomas Karagiannopoulos | AI Engineer",
  description:
    "Personal portfolio for Thomas Karagiannopoulos, focused on LLM systems, RAG pipelines, retrieval engineering, and production AI products.",
  keywords: [
    "Thomas Karagiannopoulos",
    "AI Engineer",
    "LLM Systems",
    "RAG",
    "Agents",
    "Netcompany",
    "Oinoway",
  ],
  openGraph: {
    title: "Thomas Karagiannopoulos | AI Engineer",
    description:
      "Building production NLP systems and retrieval pipelines for enterprise clients.",
    url: "https://karagiannopoulos.dev",
    siteName: "karagiannopoulos.dev",
    type: "website",
  },
  alternates: {
    canonical: "https://karagiannopoulos.dev",
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
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full scroll-smooth overflow-x-hidden`}
    >
      <body className="min-h-full overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
