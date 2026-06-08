import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/premium.css";
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuSphere — Modern Collaborative Documents",
  description:
    "A premium collaborative document editor. Write, organize, and share ideas with your team in real time.",
  keywords: ["documents", "collaboration", "editor", "notes", "word", "docs"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
