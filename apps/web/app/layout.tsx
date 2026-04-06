import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinPilot",
  description: "Tu copiloto de inversiones",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${geist.className} bg-gray-50 text-gray-900 min-h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
