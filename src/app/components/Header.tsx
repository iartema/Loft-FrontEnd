import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full flex items-center justify-between px-8 py-2 bg-[#111111]">
      <div className="flex items-center gap-1 mt-8">
        <Image
          src="/loft-logo.svg"
          alt="Loft Logo"
          width={200}
          height={80}
          className="h-12 w-auto"
        />
      </div>
    </header>
  );
}
