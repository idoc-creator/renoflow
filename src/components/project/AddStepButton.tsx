"use client";

import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import StepEditForm, { type StepFormData } from "./StepEditForm";

interface AddStepButtonProps {
  onCreate: (data: StepFormData) => void | Promise<void>;
  stageTitle?: string;
  projectId?: string;
}

export default function AddStepButton({
  onCreate,
  stageTitle,
  projectId,
}: AddStepButtonProps) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <StepEditForm
        stageTitle={stageTitle}
        projectId={projectId}
        onSave={async (data) => {
          await onCreate(data);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
        saveLabel="Add step"
      />
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-warm py-3 text-xs font-semibold text-warm-gray transition-colors hover:border-terracotta hover:text-terracotta"
    >
      <FiPlus className="h-3 w-3" />
      Add step
    </button>
  );
}
