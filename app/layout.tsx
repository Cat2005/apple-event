import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { Providers } from "./providers";

const DESCRIPTION = "Live predictions for the Apple event.";

export const metadata: Metadata = {
  metadataBase: new URL("https://apple-event.vercel.app"),
  title: "Apple Watch Party",
  description: DESCRIPTION,
  // Shared links always read "Apple Watch Party", whatever the tab title says.
  openGraph: {
    title: "Apple Watch Party",
    description: DESCRIPTION,
    siteName: "Apple Watch Party",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apple Watch Party",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
