import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Family Budget Tracker - PWA",
  description: "Mobile-first Progressive Web App for tracking family monthly budget and expenses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Budget Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
