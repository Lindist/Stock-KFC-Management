import type { Metadata } from "next";
import { Noto_Sans_Thai, Geist } from 'next/font/google'
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const notoSansThai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'StockFlow - ระบบจัดการคลังวัตถุดิบ',
  description: 'ระบบจัดการคลังวัตถุดิบสำหรับธุรกิจร้านอาหาร',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={cn("font-sans", geist.variable)}>
      <body
        className={`${notoSansThai.className} antialiased`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
