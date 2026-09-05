import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, PenTool, Database, LayoutList, GitMerge } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Standup Studio",
  description: "AI-driven standup comedy workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${inter.className} bg-neutral-950 text-white flex flex-col md:flex-row min-h-screen`}>
        
        {/* Huvudmeny (Sidomeny på dator, Bottenmeny på mobil) */}
        <nav className="fixed md:relative bottom-0 w-full md:w-64 bg-neutral-900 border-t md:border-t-0 md:border-r border-neutral-800 z-50">
          <div className="flex md:flex-col justify-around md:justify-start p-2 md:p-6 gap-1 md:gap-4 h-full">
            
            {/* Dator-logga (Döljs på mobilskärmar) */}
            <div className="hidden md:block mb-8 px-3">
              <h2 className="font-bold text-xl text-blue-500">🎙️ Studio</h2>
            </div>

            {/* Länkar */}
            <Link href="/" className="flex flex-col md:flex-row items-center gap-2 p-2 md:p-3 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <Home size={24} />
              <span className="text-xs md:text-sm font-medium">Hem</span>
            </Link>
            
            <Link href="/skriv" className="flex flex-col md:flex-row items-center gap-2 p-2 md:p-3 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <PenTool size={24} />
              <span className="text-xs md:text-sm font-medium">Skriv</span>
            </Link>

            <Link href="/vault" className="flex flex-col md:flex-row items-center gap-2 p-2 md:p-3 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <Database size={24} />
              <span className="text-xs md:text-sm font-medium">Bibliotek</span>
            </Link>

         

            {/* SETLISTS / GIG-BYGGAREN */}
            <Link href="/setlists" className="flex flex-col md:flex-row items-center gap-2 p-2 md:p-3 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
              <LayoutList size={24} />
              <span className="text-xs md:text-sm font-medium">Setlists</span>
            </Link>

          </div>
        </nav>

        {/* Här laddas den aktuella sidans innehåll in */}
        <main className="flex-1 pb-20 md:pb-0 h-screen overflow-y-auto">
          {children}
        </main>

      </body>
    </html>
  );
}