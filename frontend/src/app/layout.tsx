import { ThemeProvider } from "@/components/provider/themeProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StarBackground from "@/components/star-background";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GhostWire",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} min-h-full flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <StarBackground />
          {children}
        </ThemeProvider></body>
    </html>



  );
}
