import { Almarai } from "next/font/google";
const almarai = Almarai({ subsets: ["latin"], weight: ["400", "700"] });

interface AccountPromptProps {
  message?: string;
  linkText: string;
  linkHref: string;
}

export default function AccountPrompt({
  message = "Do you have an account?",
  linkText,
  linkHref,
}: AccountPromptProps) {
  return (
    <p
      className={`${almarai.className} text-center mt-6 text-gray-300 text-sm`}
    >
      {message}{" "}
      <a
        href={linkHref}
        className="text-white hover:underline font-medium"
      >
        {linkText}
      </a>
    </p>
  );
}
