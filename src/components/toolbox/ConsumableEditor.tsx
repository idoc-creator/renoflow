"use client";

import { FiPlus, FiX } from "react-icons/fi";
import { type Consumable, generateId } from "./types";

interface ConsumableEditorProps {
  consumables: Consumable[];
  onChange: (next: Consumable[]) => void;
}

export default function ConsumableEditor({
  consumables,
  onChange,
}: ConsumableEditorProps) {
  function addRow() {
    onChange([
      ...consumables,
      {
        id: generateId(),
        name: "",
        quantity_on_hand: 0,
        reorder_date: null,
        notes: null,
      },
    ]);
  }

  function updateRow(id: string, patch: Partial<Consumable>) {
    onChange(consumables.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeRow(id: string) {
    onChange(consumables.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-2">
      {consumables.length === 0 && (
        <p className="text-xs text-warm-gray italic">
          Add blades, filters, oil, anything that expires or needs restocking.
        </p>
      )}
      {consumables.map((c) => (
        <div
          key={c.id}
          className="rounded-md bg-white border border-border-warm p-2 space-y-2"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateRow(c.id, { name: e.target.value })}
              placeholder="e.g., P100 respirator cartridge"
              className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(c.id)}
              className="shrink-0 text-warm-gray hover:text-terracotta"
              aria-label="Remove consumable"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-warm-gray shrink-0">Qty:</span>
              <input
                type="number"
                min={0}
                value={c.quantity_on_hand}
                onChange={(e) =>
                  updateRow(c.id, {
                    quantity_on_hand: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-2 py-1 bg-cream rounded border border-border-warm focus:outline-none focus:border-terracotta"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-warm-gray shrink-0">Reorder:</span>
              <input
                type="date"
                value={c.reorder_date ?? ""}
                onChange={(e) =>
                  updateRow(c.id, {
                    reorder_date: e.target.value || null,
                  })
                }
                className="w-full px-2 py-1 bg-cream rounded border border-border-warm focus:outline-none focus:border-terracotta"
              />
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1 rounded-md bg-sage/20 px-3 py-2 text-xs font-semibold text-sage-dark hover:bg-sage/30"
      >
        <FiPlus className="h-3 w-3" />
        Add consumable
      </button>
    </div>
  );
}
