import Button from "../atoms/ButtonAuth";
import Divider from "../atoms/Divider";

export default function LoginButtonGroup() {
  return (
    <div className="flex flex-col gap-3 w-full mt-3">
      <Button label="Register" is_gradient={false} />
      <Divider text="or" />
      <Button variant="google" />
    </div>
  );
}
