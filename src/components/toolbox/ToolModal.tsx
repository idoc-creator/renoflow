"use client";

import { FiX } from "react-icons/fi";
import ToolEditForm, { type ToolFormData } from "./ToolEditForm";
import type { ToolboxItem } from "./types";

interface ToolModalProps {
  open: boolean;
  initial?: Partial<ToolboxItem>;
  title: string;
  saveLabel?: string;
  onSave: (data: ToolFormData) => void | Promise<void>;
  onClose: () => void;
}

export default function ToolModal({
  open,
  initial,
  title,
  saveLabel = "Save",
  onSave,
  onClose,
}: ToolModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/30 p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-cream border border-border-warm shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-warm-gray hover:text-charcoal"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-8">
          <h2 className="font-serif text-3xl text-charcoal mb-6">{title}</h2>
          <ToolEditForm
            initial={initial}
            onSave={async (data) => {
              await onSave(data);
            }}
            onCancel={onClose}
            saveLabel={saveLabel}
          />
        </div>
      </div>
    </div>
  );
}
