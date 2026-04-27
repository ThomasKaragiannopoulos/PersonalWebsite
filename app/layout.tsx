import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
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
      className={`${bodyFont.variable} ${displayFont.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
