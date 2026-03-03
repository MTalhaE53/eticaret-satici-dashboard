import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "E-Ticaret Satıcı Dashboard",
  description: "Trendyol ve Hepsiburada siparişlerinizi, yorumlarınızı ve stok durumunuzu tek ekrandan takip edin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-800`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
