import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RootProviders from "./RootProviders";

// 🔹 Usar ruta relativa desde `app/layout.tsx` hasta `public/fonts/...`
const inter = localFont({
  src: [
    { path: "../public/fonts/inter/InterVariable.ttf", weight: "100 900", style: "normal" },
    { path: "../public/fonts/inter/InterItalic.ttf", weight: "100 900", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="antialiased min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] font-inter">
        <RootProviders>
          <Header />
          <main className="flex-1 px-4 md:px-8 lg:px-16 py-6">{children}</main>
          <Footer className="border-t border-gray-200" />
        </RootProviders>
      </body>
    </html>
  );
}
