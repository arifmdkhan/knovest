import type { Metadata } from "next";

const APP_NAME = "KNOVEST";
const APP_DESCRIPTION =
  "Knovest is a financial learning community for traders, investors, and creators. Explore educational content, courses, and shared perspectives.";

const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "http://localhost:3000";
const BASE_URL = new URL(
  /^https?:\/\//.test(configuredUrl) ? configuredUrl : `https://${configuredUrl}`
).origin;

export function createMetadata(override: Metadata): Metadata {
  // The root title template adds the brand once.
  const title = override.title;

  const description =
    override.description ?? APP_DESCRIPTION;

  const ogImage = override.openGraph?.images ?? [{ url: "/images/landing/hero-laptop.webp", width: 1280, height: 853, alt: "Knovest financial learning community" }];

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
      "KNOVEST",
      "Knovest"
    ],
    // Root app icon files provide the shared browser and Apple icons.


    openGraph: {
      title: title ?? undefined,
      description,
      type: "website",
      locale: "en_US",
      siteName: APP_NAME,
      url: override.openGraph?.url ?? (typeof override.alternates?.canonical === "string" ? new URL(override.alternates.canonical, BASE_URL).href : BASE_URL),
      images: ogImage,
      ...override.openGraph,
    },

    // Twitter Cards
    twitter: {
      card: "summary_large_image",
      title: title ?? undefined,
      description,
      images: ogImage,
      ...override.twitter,
    },

    category: "finance",

    ...override,
  };
}
