"use client";

import { useState, useRef } from "react";
import { FiX, FiPackage, FiPlus } from "react-icons/fi";

/**
 * A step-level material — a consumable that gets USED UP in the project
 * (lumber, screws, thinset, tile, paint, grout). Distinct from tools,
 * which are reusable equipment from the toolbox catalog.
 *
 * Materials flow into the project Shopping List via the generate-shopping
 * -list endpoint; the aggregation on the project Overview deduplicates by
 * name (lowercased) and sums quantities when units match.
 */
export interface StepMaterial {
  name: string;
  /** e.g. 25 (ft), 4 (bags), 1 (gallon) — optional for things measured
   *  loosely ("some screws"). */
  quantity?: number | null;
  /** Unit string. Lowercase convention: "ft", "sqft", "bags", "gallons",
   *  "each", "lbs", "sheets". */
  unit?: string | null;
  /** Per-unit price in project currency. */
  estimated_price?: number | null;
  /** Free-form note (e.g. "pressure-balanced, 1/2 NPT"). */
  notes?: string | null;
}

interface MaterialPickerProps {
  materials: StepMaterial[];
  onChange: (next: StepMaterial[]) => void;
}

const COMMON_UNITS = [
  "each",
  "ft",
  "sqft",
  "bags",
  "boxes",
  "gallons",
  "quarts",
  "sheets",
  "lbs",
  "rolls",
];

export default function MaterialPicker({ materials, onChange }: MaterialPickerProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function addMaterial() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: StepMaterial = {
      name: trimmed,
      quantity: quantity ? parseFloat(quantity) : null,
      unit: unit.trim() || null,
      estimated_price: price ? parseFloat(price) : null,
    };
    if (editingIndex !== null) {
      onChange(
        materials.map((m, i) => (i === editingIndex ? next : m))
      );
      setEditingIndex(null);
    } else {
      // Avoid exact-name duplicates
      if (
        materials.some(
          (m) => m.name.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        // If exact name exists, just accumulate quantity when units match
        onChange(
          materials.map((m) =>
            m.name.toLowerCase() === trimmed.toLowerCase() &&
            (m.unit ?? "") === (next.unit ?? "")
              ? {
                  ...m,
                  quantity:
                    (m.quantity ?? 0) + (next.quantity ?? 0) || null,
                }
              : m
          )
        );
      } else {
        onChange([...materials, next]);
      }
    }
    resetForm();
    nameRef.current?.focus();
  }

  function resetForm() {
    setName("");
    setQuantity("");
    setUnit("");
    setPrice("");
  }

  function startEdit(i: number) {
    const m = materials[i];
    setName(m.name);
    setQuantity(m.quantity != null ? String(m.quantity) : "");
    setUnit(m.unit ?? "");
    setPrice(m.estimated_price != null ? String(m.estimated_price) : "");
    setEditingIndex(i);
    nameRef.current?.focus();
  }

  function cancelEdit() {
    setEditingIndex(null);
    resetForm();
  }

  function removeMaterial(i: number) {
    onChange(materials.filter((_, idx) => idx !== i));
    if (editingIndex === i) cancelEdit();
  }

  function formatChip(m: StepMaterial): string {
    const parts: string[] = [];
    if (m.quantity != null) {
      parts.push(m.unit ? `${m.quantity} ${m.unit}` : String(m.quantity));
    } else if (m.unit) {
      parts.push(m.unit);
    }
    return parts.length > 0 ? `${m.name} · ${parts.join(" ")}` : m.name;
  }

  return (
    <div className="space-y-2">
      {/* Existing materials as chips */}
      {materials.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {materials.map((m, i) => (
            <span
              key={`${m.name}-${i}`}
              className="group inline-flex items-center gap-1 rounded-full bg-walnut/10 text-walnut-dark px-2.5 py-1 text-xs font-medium max-w-full"
            >
              <FiPackage className="h-3 w-3 shrink-0" />
              <button
                type="button"
                onClick={() => startEdit(i)}
                className="hover:underline truncate"
                title="Edit"
              >
                {formatChip(m)}
              </button>
              {m.estimated_price != null && (
                <span className="text-walnut/70">
                  ${m.estimated_price.toFixed(2)}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeMaterial(i)}
                className="hover:opacity-70"
                aria-label="Remove"
              >
                <FiX className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Inline add/edit form */}
      <div className="rounded-md border border-border-warm bg-white p-2 space-y-2">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addMaterial();
            }
          }}
          placeholder="Material (e.g. 1/2&quot; PEX tubing, Kerdi membrane)"
          className="w-full bg-transparent px-2 py-1 text-sm text-charcoal focus:outline-none placeholder:text-warm-gray"
        />
        <div className="grid grid-cols-[80px_110px_90px_auto] gap-1.5">
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="rounded border border-border-warm bg-white px-2 py-1 text-xs focus:outline-none focus:border-walnut"
          />
          <input
            type="text"
            list="material-units"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit"
            className="rounded border border-border-warm bg-white px-2 py-1 text-xs focus:outline-none focus:border-walnut"
          />
          <datalist id="material-units">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$ each"
            className="rounded border border-border-warm bg-white px-2 py-1 text-xs focus:outline-none focus:border-walnut"
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={addMaterial}
              disabled={!name.trim()}
              className="rounded bg-walnut hover:bg-walnut-dark text-white text-xs font-semibold px-2.5 py-1 transition-colors disabled:opacity-50"
            >
              {editingIndex !== null ? "Save" : <FiPlus className="h-3 w-3" />}
            </button>
            {editingIndex !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs text-warm-gray hover:text-charcoal px-1"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-warm-gray">
        Materials are consumables (lumber, grout, tile). Quantity + unit feed
        the project shopping list.
      </p>
    </div>
  );
}
