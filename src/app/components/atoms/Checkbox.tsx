import Link from "next/link";
import { Almarai } from "next/font/google";

const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface CheckboxProps {
  showForgotPassword?: boolean;
}

export default function Checkbox({ showForgotPassword = false }: CheckboxProps) {
  return (
    <div className="flex items-center justify-between mb-6 w-full">
      <div className="flex items-center gap-3">
        <label className="relative flex items-center cursor-pointer">
          <input
            id="remember"
            type="checkbox"
            className="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-md
                       bg-transparent transition-all duration-200
                       checked:bg-green-500 checked:border-green-500
                       hover:border-green-400 hover:shadow-[0_0_8px_rgba(34,197,94,0.5)]"
          />
          <svg
            className="absolute left-[4px] top-[3px] w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity"
            fill="none"
            stroke="white"
            strokeWidth="3"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </label>

        <label
          htmlFor="remember"
          className={`${almarai.className} text-sm text-gray-200 select-none cursor-pointer hover:text-white transition`}
        >
          Remember me
        </label>
      </div>

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
