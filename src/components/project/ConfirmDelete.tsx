"use client";

interface ConfirmDeleteProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDelete({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDeleteProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-cream border border-border-warm p-6 shadow-xl">
        <h3 className="font-serif text-2xl text-charcoal mb-2">{title}</h3>
        <p className="text-warm-gray text-sm mb-6">{message}</p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-warm-gray hover:text-charcoal text-sm px-4 py-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
