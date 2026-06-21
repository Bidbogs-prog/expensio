// src/app/layout.tsx
import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/authProvider";

// Editorial display face for headings + big numerals.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Refined, characterful body face.
const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Ledger numerals.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expensio — Money clarity, on autopilot",
  description:
    "A categorical expense tracker with AI recommendations, overspend warnings, and analytics. Know exactly where your money goes.",
};

// Runs before paint to set the theme class, avoiding a flash. Defaults to dark (Midnight Ledger).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var l=t==='light';document.documentElement.classList.toggle('light',l);document.documentElement.classList.toggle('dark',!l);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full dark ${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased h-full">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
