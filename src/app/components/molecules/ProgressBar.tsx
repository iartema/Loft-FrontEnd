"use client";

interface ProgressBarProps {
  value: number; // 0–100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="w-full bg-[#161616] rounded-lg p-4 mb-8">
      {/* centered title */}
      <div className="text-sm text-gray-300 text-center mb-2">Progress</div>

      {/* bar + percent in one row */}
      <div className="flex items-center w-full gap-2">
        <div className="relative flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#7CFC00] rounded-full transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm text-gray-300 w-10 text-right">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}
