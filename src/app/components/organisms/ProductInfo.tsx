"use client";

export default function ProductInfo({
  longDescription,
  specs,
}: {
  description: string;
  longDescription: string;
  specs: { label: string; value: string }[];
}) {
  return (
    <div className="bg-[#161616] rounded-2xl border border-[#2a2a2a]">
      <div className="px-6 py-4 border-b border-[#2a2a2a] text-center font-semibold">
        Information
      </div>

      <div className="p-6 space-y-6">
        <section>
          <div className="text-sm opacity-80 mb-2">Description</div>
          <p className="text-sm opacity-90">
            {longDescription}
          </p>
        </section>

        <section>
          <div className="text-sm opacity-80 mb-2">Specifications</div>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-40 opacity-70 text-sm">{s.label}</div>
                <div className="flex-1 text-sm">{s.value || "—"}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
