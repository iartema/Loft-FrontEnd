import { Almarai } from "next/font/google";
const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
}

export default function Label({ children, htmlFor }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className={`${almarai.className} block mb-2`}>
      {children}
    </label>
  );
}
