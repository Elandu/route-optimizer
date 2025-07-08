import type { Metadata } from "next";
import "./globals.css";

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
      <body
        className="antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-body"
      >
        {children}
      </body>
    </html>
  );
}
