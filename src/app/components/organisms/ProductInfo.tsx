"use client";
import { useState } from "react";
import Divider from "../atoms/Divider";
import Button from "../atoms/Button";

export default function ProductInfo({
  longDescription,
  specs,
}: {
  description: string;
  longDescription: string;
  specs: { label: string; value: string }[];
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="bg-[#222222] rounded-2xl border border-[#222222] w-[70%] mx-auto">
      <div className="px-6 py-4 text-center font-semibold">Information</div>

      <div className="p-6 space-y-6">
        <section>
          <div className="text-md opacity-80 ps-6 mb-2">Description</div>
          <p className="text-sm opacity-90 ps-6">{longDescription}</p>
        </section>

        <Divider text="" />

        <section>
          <div className="text-md opacity-80 mb-4 ps-6">Specifications</div>

          {/* show only when "More" is pressed */}
          {showAll && (
            <div className="grid grid-cols-2 gap-x-20 gap-y-4 ps-6">
              {specs.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="opacity-70 text-sm">{s.label}:</div>
                  <div className="text-sm">{s.value || "—"}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              variant="card"
              className="bg-white text-black hover:bg-gray-300 !w-[15%]"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Less" : "More"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
