"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type UploadPreview = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  previewUrl?: string;
  remoteUrl?: string;
};

interface Props {
  files: UploadPreview[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export default function ImageUploader({ files, onAdd, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!files.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex > files.length - 1) {
      setActiveIndex(files.length - 1);
    }
  }, [files, activeIndex]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming || !incoming.length) return;
    const images = Array.from(incoming).filter(
      (file) => !file.type || file.type.toLowerCase().startsWith("image/")
    );
    if (!images.length) return;
    onAdd(images);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer?.files ?? null);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragActive(false);
  };

  const active = files[activeIndex];

  return (
    <div className="w-[100%]">
      <div className="flex items-start gap-4">
        <div
          className={`relative flex-1 min-h-[420px] max-w-[640px] rounded-[30px] border ${
            dragActive ? "border-[var(--brand,#9ef1c7)]" : "border-[var(--border)]"
          } bg-[var(--bg-elev-1)] cursor-pointer overflow-hidden`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          {active ? (
            <>
              <Image
                src={active.previewUrl ?? active.remoteUrl ?? "/default-product.jpg"}
                alt={active.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <button
                type="button"
                className="absolute top-4 right-4 bg-black/70 text-[#ffffff] rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/80"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(active.id);
                }}
                aria-label="Remove photo"
              >
                &times;
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8 text-[var(--fg-muted)]">
              <p className="text-lg">Drop files here or click to upload</p>
              <p className="text-sm opacity-80">Supported file types: png, jpg, jpeg...</p>
            </div>
          )}
          {dragActive && (
            <div className="absolute inset-0 border-4 border-dashed border-[var(--brand,#9ef1c7)] rounded-[30px] pointer-events-none" />
          )}
        </div>

        <div className="w-[80px] flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {files.map((file, index) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`group relative w-full aspect-square rounded-[8px] overflow-hidden border transition ${
                activeIndex === index
                  ? "border-[var(--brand,#9ef1c7)]"
                  : "border-[var(--border)] hover:border-[var(--fg-muted)]"
              }`}
            >
              <Image
                src={file.previewUrl ?? file.remoteUrl ?? "/default-product.jpg"}
                alt={file.name}
                fill
                className="object-cover"
                sizes="100px"
              />
              <button
                type="button"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-[#ffffff] text-xs opacity-0 group-hover:opacity-100 transition"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(file.id);
                }}
                aria-label={`Remove ${file.name}`}
              >
                &times;
              </button>
            </button>
          ))}

          {files.length < 5 && (
            <button
              type="button"
              className="w-full aspect-square rounded-2xl border border-dashed border-[var(--border)] text-white/70 hover:text-white hover:border-[var(--fg-muted)] flex items-center justify-center text-3xl  sort-label"
              onClick={() => fileRef.current?.click()}
              aria-label="Add photo"
            >
              +
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function FilePreview({ file }: { file: UploadPreview }) {
  if (file.previewUrl || file.remoteUrl) {
    return (
      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={file.previewUrl ?? file.remoteUrl ?? "/default-product.jpg"}
          alt={file.name}
          fill
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-input)] grid place-items-center text-xs text-[var(--fg-muted)] flex-shrink-0 uppercase">
      {file.type ? file.type.split("/").pop() : "FILE"}
    </div>
  );
}

function formatSize(size?: number) {
  if (size === undefined || size === null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
