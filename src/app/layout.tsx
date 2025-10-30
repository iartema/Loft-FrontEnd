import "./globals.css";
import { Ysabeau_Infant } from "next/font/google";
import Header from "./components/Header";

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
      <body className={`${ysabeau.className} bg-[#111111] text-white overflow-hidden`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
