import React, { useRef, useState } from 'react';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  X,
} from 'lucide-react';
import { MediaAttachment } from '../types/planner';
import { formatBytes } from '../utils/scheduler';
import { readFileAsDataUrl } from '../utils/storage';

interface MediaAttachmentsProps {
  attachments: MediaAttachment[];
  onAdd: (attachment: MediaAttachment) => void;
  onRemove: (attachmentId: string) => void;
  compact?: boolean;
  label?: string;
}

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB limit for LocalStorage safety

export const MediaAttachments: React.FC<MediaAttachmentsProps> = ({
  attachments,
  onAdd,
  onRemove,
  compact = false,
  label = 'Attachments',
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAttachment | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        setErrorMsg(`"${file.name}" exceeds the 2 MB browser storage limit.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const newAttachment: MediaAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        onAdd(newAttachment);
      } catch {
        setErrorMsg(`Could not attach "${file.name}".`);
      }
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const images = attachments.filter((a) => a.type.startsWith('image/'));
  const files = attachments.filter((a) => !a.type.startsWith('image/'));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {label}
          {attachments.length > 0 ? ` (${attachments.length})` : ''}
        </span>
        <div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            aria-label={`Upload ${label}`}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Attach Media / File</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
          {errorMsg}
        </p>
      )}

      {attachments.length === 0 && !compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Attach photos, reference sheets, or documents directly to this entry.
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => setPreviewItem(img)}
                className="w-full h-full block cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                aria-label={`Preview image ${img.name}`}
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                aria-label={`Remove ${img.name}`}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-950/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <ul className="divide-y divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText
                  className="w-4 h-4 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={file.dataUrl}
                  download={file.name}
                  aria-label={`Download ${file.name}`}
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  aria-label={`Remove ${file.name}`}
                  className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Image preview: ${previewItem.name}`}
        >
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {previewItem.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                aria-label="Close image preview"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewItem.dataUrl}
                alt={previewItem.name}
                referrerPolicy="no-referrer"
                className="max-h-[68vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
