import Label from "../atoms/Label";
import Input from "../atoms/Input";

interface InputFieldProps {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  shape?: "rounded" | "office";
  className?: string; // à?'? add this line
}


export default function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  required = false,
  shape = "rounded",
}: InputFieldProps) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        shape={shape}
      />
    </div>
  );
}