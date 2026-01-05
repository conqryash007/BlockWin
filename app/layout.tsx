import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BetslipProvider } from "@/hooks/useBetslip";
import { BetslipDrawer } from "@/components/betslip/BetslipDrawer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Casino Royale - Crypto Betting",
  description: "Premium Crypto Casino & Sportsbook",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "any" },
    ],
    apple: [
      { url: "/favicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.variable, "min-h-screen bg-background font-sans antialiased overflow-hidden")}>
         <Providers>
          <BetslipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
                        <div className="mx-auto max-w-[1440px]">
                            {children}
                        </div>
                    </main>
                    <BetslipDrawer />
                </div>
            </div>
          </BetslipProvider>
        </Providers>
      </body>
    </html>
  );
}
