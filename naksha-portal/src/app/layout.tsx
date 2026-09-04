import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import CopilotChat from "@/components/CopilotChat";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ["latin"], variable: '--font-serif' });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL('http://naksha-6bytes.koreacentral.cloudapp.azure.com:3000'),
  title: "N.A.K.S.H.A. | Neural Archival Knowledge & Script Heuristic Analyzer",
  description: "An AI-powered Government Land Record Digitization and Cryptographic Verification System.",
  keywords: "N.A.K.S.H.A., Land Records, AI, OCR, Government, Blockchain Hash, Verification",
  openGraph: {
    title: "N.A.K.S.H.A. | AI Land Record Digitization",
    description: "An AI-powered Government Land Record Digitization and Cryptographic Verification System.",
    url: "http://naksha-6bytes.koreacentral.cloudapp.azure.com:3000",
    siteName: "N.A.K.S.H.A.",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "N.A.K.S.H.A. | AI Land Record Digitization",
    description: "An AI-powered Government Land Record Digitization and Cryptographic Verification System.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merriweather.variable} ${jetbrains.variable} font-sans antialiased h-screen flex overflow-hidden bg-[#FAF7F2] text-[#1C1917]`}>
        
        <Sidebar />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 flex flex-col overflow-y-auto relative z-0">
            {/* Ambient Diagonal Tricolor Gradient (Lime -> Cream/Orange -> Blue) */}
            <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#bef264]/20 via-[#FEF3C7]/60 to-[#bae6fd]/40 -z-10 pointer-events-none"></div>
            {children}
        </main>

        <CopilotChat />
      </body>
    </html>
  );
}
