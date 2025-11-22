import Button from "../atoms/Button";

export default function RegisterButtonGroup() {
  return (
    <div className="flex gap-3 items-center">
      <Button label="Register" variant="primary" type="submit" />
    </div>
  );
}
