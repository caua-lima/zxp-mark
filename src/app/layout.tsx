import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Sora é a tipografia da marca ZXP (a mesma do logo). Inter carrega o texto
// corrido, onde Sora fica pesada nos tamanhos pequenos.
const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  variable: "--fonte-sora",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fonte-inter",
});

export const metadata: Metadata = {
  title: "ZXP Mark — cada hora conta",
  description:
    "Conte cada hora que você segurou firme, marque as datas que importam e tenha alguém do seu lado quando a vontade bater. Um app ZXP Solutions.",
  applicationName: "ZXP Mark",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ZXP Mark",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/marca/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/marca/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icone-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/marca/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#10100e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
