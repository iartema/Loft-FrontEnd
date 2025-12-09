import Link from "next/link";
import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface CheckboxProps {
  showForgotPassword?: boolean;
}

export default function Checkbox({ showForgotPassword = false }: CheckboxProps) {
  return (
    <div className="flex items-center mb-6 w-full">

      {showForgotPassword && (
        <Link
          href="/forgot-password"
          className={`${almarai.className} text-sm text-[var(--fg-muted)] hover:text-white transition`}
        >
          Forgot password?
        </Link>
      )}
    </div>
  );
}
