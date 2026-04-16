"use client";

import { useState, useMemo } from "react";
import { FiPlus } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import ToolCard from "./ToolCard";
import ToolModal from "./ToolModal";
import SmartAddTool from "./SmartAddTool";
import ConfirmDelete from "@/components/project/ConfirmDelete";
import type { ToolFormData } from "./ToolEditForm";
import {
  CATEGORIES,
  type ToolCategory,
  type ToolboxItem,
} from "./types";

interface ToolboxClientProps {
  initialItems: ToolboxItem[];
}

export default function ToolboxClient({ initialItems }: ToolboxClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ToolboxItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(
    "all"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ToolboxItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  async function handleCreate(data: ToolFormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: inserted, error } = await supabase
      .from("toolbox_items")
      .insert({
        user_id: user.id,
        name: data.name,
        category: data.category,
        make: data.make,
        model: data.model,
        status: data.status,
        location: data.location,
        notes: data.notes,
        purchase_price: data.purchase_price,
        manual_url: data.manual_url,
        consumables: data.consumables,
        catalog_entry_id: data.catalog_entry_id,
      })
      .select("*")
      .single();

    if (error || !inserted) {
      console.error("Failed to create tool:", error);
      alert(`Failed to create tool: ${error?.message ?? "unknown error"}`);
      return;
    }

    setItems((prev) => [...prev, inserted as ToolboxItem]);
    setAddOpen(false);
  }

  async function handleUpdate(data: ToolFormData) {
    if (!editingItem) return;

    const { error } = await supabase
      .from("toolbox_items")
      .update({
        name: data.name,
        category: data.category,
        make: data.make,
        model: data.model,
        status: data.status,
        location: data.location,
        notes: data.notes,
        purchase_price: data.purchase_price,
        manual_url: data.manual_url,
        consumables: data.consumables,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingItem.id);

    if (error) {
      console.error("Failed to update tool:", error);
      alert(`Failed to update tool: ${error.message}`);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              ...data,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );
    setEditingItem(null);
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    const { error } = await supabase
      .from("toolbox_items")
      .delete()
      .eq("id", id);
    setDeleteLoading(false);

    if (error) {
      alert(`Failed to delete tool: ${error.message}`);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">My Toolbox</h1>
          <p className="text-warm-gray text-sm mt-1">
            Tools and PPE you own. Pick from here when planning projects.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta hover:bg-terracotta-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Add tool
        </button>
      </div>

      {/* Category tabs */}
      <nav className="mb-6 flex gap-6 overflow-x-auto border-b border-border-warm">
        {CATEGORIES.map((cat) => {
          const isActive = cat.value === activeCategory;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={
                isActive
                  ? "text-charcoal border-b-2 border-terracotta font-semibold pb-2 whitespace-nowrap"
                  : "text-warm-gray hover:text-charcoal pb-2 whitespace-nowrap"
              }
            >
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Items grid or empty state */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-warm bg-white py-16 px-6 text-center">
          <h3 className="font-serif text-2xl text-charcoal">
            {items.length === 0
              ? "Your toolbox is empty"
              : `No ${activeCategory === "all" ? "" : CATEGORIES.find((c) => c.value === activeCategory)?.label.toLowerCase() + " "}tools yet`}
          </h3>
          <p className="mt-2 text-sm text-warm-gray max-w-sm">
            Add tools you already own — you&apos;ll pick from here when planning
            projects.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-terracotta hover:bg-terracotta-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <FiPlus className="h-4 w-4" />
            Add your first tool
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <ToolCard
              key={item.id}
              item={item}
              onEdit={() => setEditingItem(item)}
              onDelete={() => setDeletingId(item.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {addOpen && (
        <SmartAddTool
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
        />
      )}
      <ToolModal
        open={editingItem !== null}
        initial={editingItem ?? undefined}
        title="Edit tool"
        saveLabel="Save changes"
        onSave={handleUpdate}
        onClose={() => setEditingItem(null)}
      />
      <ConfirmDelete
        open={deletingId !== null}
        title="Delete this tool?"
        message="This will remove the tool and all its consumables. This can't be undone."
        onConfirm={() => deletingId && handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
