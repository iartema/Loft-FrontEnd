import "./globals.css";
import { Ysabeau_Infant } from "next/font/google";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { cookies } from "next/headers";

const ysabeau = Ysabeau_Infant({ subsets: ["latin"], weight: ["400", "600"] });

export const metadata = {
  title: "Loft",
  description: "Sell and buy easily and safely!",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "light" ? "light" : "dark";
  const langCookie = cookieStore.get("lang")?.value;
  const lang = langCookie === "en" || langCookie === "uk" ? langCookie : "uk";

  return (
    <html lang={lang} data-theme={theme}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/loft-logo-circle.png" />
        <link rel="shortcut icon" href="/loft-logo-circle.png" />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${ysabeau.className} bg-[var(--bg-body)] text-[var(--fg-primary)] overflow-x-hidden px-3 md:px-6 lg:px-13`}
      >
        <LocaleProvider initialLocale={lang}>
          <Header />
          {children}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
