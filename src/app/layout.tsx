import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bench — Stop Pinning. Start Building.",
  description:
    "The platform where DIYers browse inspo, grab templates, plan projects, and build the thing. From bathroom remodels to handmade jewelry.",
  keywords: [
    "DIY",
    "maker",
    "home improvement",
    "craft projects",
    "project planner",
    "build templates",
  ],
  openGraph: {
    title: "Bench — Stop Pinning. Start Building.",
    description:
      "Browse, plan, build, and share DIY projects of every kind.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-cream text-charcoal">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
