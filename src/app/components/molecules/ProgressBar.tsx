"use client";

interface ProgressBarProps {
  value: number; // 0–100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="w-full bg-[var(--bg-elev-3)] rounded-lg p-4 mb-8"
    style={{boxShadow: "0 3px 3px 0px rgba(0, 0, 0, 0.25)"}}>
      {/* centered title */}
      <div className="text-sm text-gray-300 text-center mb-2 sort-label">Progress</div>

      {/* bar + percent in one row */}
      <div className="flex items-center w-full gap-2">
        <div className="relative flex-1 h-2 bg-[var(--muted-1)] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#78FF7E] rounded-full transition-all duration-300"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm text-gray-300 w-10 text-right sort-label">
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}
