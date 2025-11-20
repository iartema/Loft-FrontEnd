import Button from "../atoms/ButtonAuth";
import { useRouter } from "next/navigation";
import Divider from "../atoms/Divider";

export default function LoginButtonGroup() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-3 w-full mt-3">
      <Button label="Register" is_gradient={false} onClick={() => router.push("/register")} />
      <Divider text="or" />
      <Button variant="google" label="Sign in with Google" />
    </div>
  );
}
