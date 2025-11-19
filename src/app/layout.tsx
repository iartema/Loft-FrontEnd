import "./globals.css";
import { Ysabeau_Infant } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ysabeau = Ysabeau_Infant({ subsets: ["latin"], weight: ["400", "600"] });

export const metadata = {
  title: "Loft | Register",
  description: "Create your account on Loft",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${ysabeau.className} bg-[var(--bg-body)] text-[var(--fg-primary)] overflow-x-hidden`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
