interface DividerProps {
  text?: string;
  className?: string;
}

export default function Divider({ text = "or", className = "" }: DividerProps) {
  return (
    <div className={`flex items-center w-full ${className}`}>
      <div className="flex-grow h-[1px] bg-[var(--divider)]" />
      { text ? <span className="px-3 text-sm text-white font-semibold text-[20px]">{text}</span> : null }
      <div className="flex-grow h-[1px] bg-[var(--divider)]" />
    </div>
  );
}
