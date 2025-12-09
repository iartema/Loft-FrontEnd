import "./globals.css";
import { Ysabeau_Infant } from "next/font/google";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ysabeau = Ysabeau_Infant({ subsets: ["latin"], weight: ["400", "600"] });

export const metadata = {
  title: "Loft",
  description: "Sell and buy easily and safely!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/loft-logo-circle.png" />
        <link rel="shortcut icon" href="/loft-logo-circle.png" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch {}
            `,
          }}
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${ysabeau.className} bg-[var(--bg-body)] text-[var(--fg-primary)] overflow-x-hidden px-3 md:px-6 lg:px-13`}
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
