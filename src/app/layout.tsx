import type { Metadata } from "next";
import { Inter_Tight, Fraunces } from "next/font/google";
import "./globals.css";

/*
  Fonts per docs/design-system.md:
  - Display: Fraunces (variable serif) — editorial bold headlines
  - Body: Inter Tight — tighter humanist sans, reads bolder than plain Inter

  Old vars --font-inter and --font-instrument-serif are aliased in globals.css
  so lingering references keep working until fully migrated.
*/
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  // Variable font — pulls 100-900 range. Axes unlock SOFT + WONK for subtle
  // editorial tuning in specific components later (e.g., display headlines).
  axes: ["SOFT", "WONK", "opsz"],
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
      className={`${interTight.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
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
