

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import "./application.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProvider } from "@/components/NavigationProvider";
import { createMetadata } from "@/lib/metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});


export const metadata: Metadata = createMetadata({
  title: {
    template: "%s | KNOVEST",
    default: "KNOVEST",
  },
  description:
    "A social and learning platform for traders, investors, and financial creators.",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NavigationProvider>{children}</NavigationProvider>
            <Toaster richColors closeButton />
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}
