// src/app/metadata.ts
import type { Metadata } from "next";

export const APP_NAME = "CONSENSUS";
export const APP_TAGLINE =
  "A social and learning platform for traders, investors, and financial creators.";
export const APP_DESCRIPTION =
  "CONSENSUS helps traders, investors and creators share insights, learn, connect, and grow together. Courses, premium groups, analytics, and a powerful social feed - all in one platform.";

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export function createMetadata(override: Metadata): Metadata {
  const title =
    typeof override.title === "string"
      ? `${override.title} | ${APP_NAME}`
      : override.title;

  const description =
    override.description ?? APP_DESCRIPTION;

  const ogImage = override.openGraph?.images ?? [
    `${BASE_URL}/og-default.png`,
  ];

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    keywords: [
      "trading",
      "investing",
      "stock market",
      "crypto",
      "analysis",
      "courses",
      "financial education",
      "CONSENSUS",
      "Consensus"
    ],
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },


    openGraph: {
      title: title ?? undefined,
      description,
      type: "website",
      locale: "en_US",
      siteName: APP_NAME,
      url: override.openGraph?.url ?? BASE_URL,
      images: ogImage,
      ...override.openGraph,
    },

    // Twitter Cards
    twitter: {
      card: "summary_large_image",
      creator: "@consensus", // change if needed
      title: title ?? undefined,
      description,
      images: ogImage,
      ...override.twitter,
    },

    // Optional extensions
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },

    category: "finance",

    ...override,
  };
}
