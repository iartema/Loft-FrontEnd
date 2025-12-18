"use client";

import React, { useRef, useState } from "react";
import { useLocale } from "../../i18n/LocaleProvider";

export type DigitalUploadItem = {
  id: string;
  name: string;
  size?: number;
  type?: string;
  mediaId?: string;
};

interface Props {
  files: DigitalUploadItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export default function DigitalFileUploader({ files, onAdd, onRemove }: Props) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    onAdd(Array.from(incoming));
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer?.files ?? null);
  };

  const commonDropHandlers = {
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!dragActive) setDragActive(true);
    },
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return;
      setDragActive(false);
    },
    onDrop: handleDrop,
  };

  return (
    <div className="w-full">
      <div
        className={`rounded-2xl border border-dashed ${
          dragActive ? "border-[var(--brand,#9ef1c7)]" : "border-[var(--border)]"
        } bg-[var(--bg-elev-1)] p-6 text-center text-[var(--fg-muted)] cursor-pointer`}
        onClick={() => inputRef.current?.click()}
        {...commonDropHandlers}
      >
        <p className="text-lg mb-1 text-white">{t("product.form.secureFiles")}</p>
        <p className="text-sm opacity-70">{t("product.form.dropSecure")}</p>
        <p className="text-xs mt-3 opacity-60">{t("product.form.secureTypes")}</p>
        {dragActive && (
          <div className="mt-4 text-[var(--brand,#9ef1c7)] font-semibold">
            {t("product.form.releaseToUpload")}
          </div>
        )}
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-xl bg-[var(--bg-elev-1)] border border-[var(--border)] px-4 py-2 text-sm"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-white truncate">{file.name}</p>
                <p className="text-xs text-white/60 sort-label">
                  {formatSize(file.size)} •{" "}
                  {file.mediaId ? t("product.form.uploaded") : t("product.form.pendingUpload")}
                </p>
              </div>
              <button
                type="button"
                className="text-white/70 hover:text-white text-base sort-label"
                onClick={() => onRemove(file.id)}
                aria-label={`${t("product.form.removeFile")}: ${file.name}`}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function formatSize(size?: number) {
  if (!size && size !== 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
