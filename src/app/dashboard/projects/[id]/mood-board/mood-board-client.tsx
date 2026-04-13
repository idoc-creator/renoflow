"use client";

import { useState } from "react";
import { FiPlus, FiImage, FiExternalLink } from "react-icons/fi";
import { AddProductModal } from "@/components/project/AddProductModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { canAddMoodBoardItem, type Tier } from "@/lib/tier";

interface MoodBoardItem {
  id: string;
  name: string;
  image_url: string | null;
  storage_path: string | null;
  price: number | null;
  retailer_name: string | null;
  retailer_url: string | null;
  notes: string | null;
}

interface MoodBoardClientProps {
  projectId: string;
  initialItems: MoodBoardItem[];
  tier?: Tier;
}

export function MoodBoardClient({
  projectId,
  initialItems,
  tier = "free",
}: MoodBoardClientProps) {
  const [items, setItems] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleAdded(item: MoodBoardItem) {
    setItems((prev) => [...prev, item]);
  }

  function handleAddClick() {
    if (!canAddMoodBoardItem(tier, items.length)) {
      setShowUpgrade(true);
    } else {
      setShowModal(true);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Mood Board</h2>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          <FiPlus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Image */}
              <div className="aspect-square bg-slate-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name || "Product"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FiImage className="h-8 w-8 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="font-medium text-sm text-slate-800 line-clamp-1">
                  {item.name || "Untitled"}
                </p>
                {item.price != null && (
                  <p className="mt-0.5 text-sm font-semibold text-teal-700">
                    ${Number(item.price).toFixed(2)}
                  </p>
                )}
                {item.retailer_name && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-xs text-slate-400">
                      {item.retailer_name}
                    </span>
                    {item.retailer_url && (
                      <a
                        href={item.retailer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-teal-600"
                      >
                        <FiExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                {item.notes && (
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
          <FiImage className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">
            No products yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Add products to visualize your renovation
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            <FiPlus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddProductModal
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}

      {/* Upgrade modal */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        title="Mood board limit reached"
        message="Free accounts are limited to 20 mood board items. Upgrade to Plan It for unlimited items."
        suggestedTier="plan_it"
      />
    </div>
  );
}
