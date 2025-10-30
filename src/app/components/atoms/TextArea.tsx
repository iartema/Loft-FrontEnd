import { Akatab } from "next/font/google";
import React from "react";
const akatab = Akatab({ subsets: ["latin"], weight: ["400", "500"] });

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className = "", ...props }: Props) {
  return (
    <textarea
      {...props}
      rows={6}
      className={`${akatab.className} w-full bg-[#2d2d30] rounded-[15px] px-4 py-3 outline-none text-[20px] text-white placeholder-[#666666] ${className}`}
      style={{
        WebkitAppearance: "none",
        WebkitBoxShadow: "0 0 0px 1000px transparent inset",
        backgroundClip: "padding-box",
      }}
    />
  );
}
