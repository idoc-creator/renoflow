"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import StageEditForm, { type StageFormData } from "./StageEditForm";

interface AddStageButtonProps {
  onCreate: (data: StageFormData) => void | Promise<void>;
}

export default function AddStageButton({ onCreate }: AddStageButtonProps) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="rounded-xl bg-white border border-border-warm shadow-sm">
        <StageEditForm
          onSave={async (data) => {
            await onCreate(data);
            setOpen(false);
          }}
          onCancel={() => setOpen(false)}
          saveLabel="Add stage"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-warm bg-white/50 py-4 text-sm font-semibold text-warm-gray transition-colors hover:border-terracotta hover:text-terracotta"
    >
      <FiPlus className="h-4 w-4" />
      Add stage
    </button>
  );
}
