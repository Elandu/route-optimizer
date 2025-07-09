import type { Metadata } from "next";
import "../styles/globals.css";

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
        className="antialiased w-full max-w-full min-h-screen md:h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-body overflow-x-hidden touch-manipulation scroll-touch"
      >
        {children}
      </body>
    </html>
  );
}
