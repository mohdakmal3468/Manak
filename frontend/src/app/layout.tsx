import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MANAK",
  description: "A community platform for project evaluation and growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans text-ink">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
