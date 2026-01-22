import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { BetslipProvider } from "@/hooks/useBetslip";
import { BetslipDrawer } from "@/components/betslip/BetslipDrawer";
import { Providers } from "./providers";
import { AgeDisclaimer } from "@/components/AgeDisclaimer";
import { headers } from 'next/headers';
import { cookieToInitialState } from 'wagmi';
import { config } from '@/lib/config';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get wagmi state from cookies for proper SSR hydration
  const headersList = await headers();
  const cookie = headersList.get('cookie');
  const initialState = cookieToInitialState(config, cookie);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen bg-background font-sans antialiased overflow-hidden")}>
         <Providers initialState={initialState}>
          <BetslipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto bg-background p-4 pb-20 md:p-6 lg:p-8 lg:pb-8">
                        <div className="mx-auto max-w-[1440px]">
                            {children}
                        </div>
                    </main>
                    <MobileBottomNav />
                    <BetslipDrawer />
                    <AgeDisclaimer />
                </div>
            </div>
          </BetslipProvider>
        </Providers>
      </body>
    </html>
  );
}

