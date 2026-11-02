import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "./globals.css";
import { ShelfProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Capy Shelf: is this product right for your skin?",
  description:
    "Scan your skin once with YouCam AI Skin Analysis, snap any ingredient label in the aisle, and get a calm, explained verdict based on your own skin scores.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf6f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ShelfProvider>
          <Header />
          <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            {children}
          </main>
          <Footer />
        </ShelfProvider>
      </body>
    </html>
  );
}
