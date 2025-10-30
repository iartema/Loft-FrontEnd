"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function OverlayPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const portalRoot = document.body;
  return createPortal(children, portalRoot);
}
