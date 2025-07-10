import type { Metadata } from "next";
import "../styles/globals.css";
import { HeroUIProvider, createHeroUI } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import heroUITheme from "../heroui.theme";

const heroui = createHeroUI(heroUITheme);

export const metadata: Metadata = {
  title: "Inspection Run Optimiser",
  description: "Optimise inspection runs with Google Maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className="antialiased w-full min-h-screen md:h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-body touch-manipulation"
        style={{ scrollbarGutter: "stable both-edges" }}
      >
        <HeroUIProvider heroui={heroui}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <div className="max-w-screen-xl mx-auto px-4">{children}</div>
          </ThemeProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
