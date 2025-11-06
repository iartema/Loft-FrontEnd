"use client";

import { useEffect, useState } from "react";
import { fetchCommentsByProduct, fetchUserById, type Comment } from "../lib/mockProduct";
import Button from "../atoms/Button";

interface Row extends Comment {
  username?: string;
}

export default function ProductComments({ productId }: { productId: number }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const run = async () => {
      const res = await fetchCommentsByProduct(productId, page, 5);
      const enriched = await Promise.all(
        res.items.map(async (c) => {
          const u = await fetchUserById(c.UserId);
          return { ...c, username: u?.Username ?? "User" };
        })
      );
      setRows(enriched);
      setTotalPages(res.totalPages);
    };
    run();
  }, [productId, page]);

  return (
    <div className="space-y-4 mt-7">
      {rows.map((c) => (
        <div key={c.ID} className="bg-[#222222] border border-[#222222] rounded-xl p-4">
          <div className="flex items-center text-xs mb-2 gap-x-5">
            <div>{new Date(c.DatePosted).toLocaleString()}</div>
            <div>{c.username}</div>
          </div>
          <div className="flex items-center text-xs mb-2 gap-x-20">
            <div className="flex items-center gap-4 text-xs opacity-75">
              <span>👍 {c.Likes ?? 0}</span>
              <span>👎 {c.Dislikes ?? 0}</span>
            </div>
            <p className="text-sm opacity-90">{c.Content}</p>
          </div>
        </div>
      ))}

      {/* pagination */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Button className="max-w-[80px] bg-[#1b1b1b] hover:bg-[#232323]" onClick={() => setPage(p => Math.max(1, p-1))}>
          Prev
        </Button>
        <div className="text-sm opacity-80">Page {page} / {totalPages}</div>
        <Button className="max-w-[80px] bg-[#1b1b1b] hover:bg-[#232323]" onClick={() => setPage(p => Math.min(totalPages, p+1))}>
          Next
        </Button>
      </div>
    </div>
  );
}
