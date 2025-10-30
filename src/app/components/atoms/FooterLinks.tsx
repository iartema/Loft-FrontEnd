import { Almarai } from "next/font/google";
import TextLink from "./TextLink";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

export default function FooterLinks() {
  return (
    <div
      className={`${almarai.className} flex justify-center gap-6 mt-6 text-sm`}
    >
      <TextLink href="/help">Help</TextLink>
      <TextLink href="/privacy">Privacy</TextLink>
    </div>
  );
}
