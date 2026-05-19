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
    "ai-engineered",
    "AI-engineered",
    "LLM Systems",
    "RAG",
    "Agents",
    "Web Design",
    "Automations",
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
    images: [
      {
        url: "/opengraph-image.png",
        width: 1536,
        height: 1024,
        alt: "Thomas Karagiannopoulos portfolio preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thomas Karagiannopoulos | AI Engineer",
    description:
      "Building production NLP systems and retrieval pipelines for enterprise clients.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Thomas Karagiannopoulos",
              url: "https://karagiannopoulos.dev",
              jobTitle: "AI Engineer",
              description:
                "AI engineer specialising in LLM systems, RAG pipelines, web design, and automations.",
              sameAs: [
                "https://www.linkedin.com/in/thomas-karagiannopoulos",
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
