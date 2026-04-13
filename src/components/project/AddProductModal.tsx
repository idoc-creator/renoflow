"use client";

import { useState, useRef, type FormEvent, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { FiX, FiLink, FiUpload, FiLoader } from "react-icons/fi";

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

interface AddProductModalProps {
  projectId: string;
  onClose: () => void;
  onAdded: (item: MoodBoardItem) => void;
}

export function AddProductModal({
  projectId,
  onClose,
  onAdded,
}: AddProductModalProps) {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [saving, setSaving] = useState(false);

  // Shared fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // URL tab
  const [retailerUrl, setRetailerUrl] = useState("");
  const [retailerName, setRetailerName] = useState("");

  // Upload tab
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    let imageUrl: string | null = null;
    let storagePath: string | null = null;

    // Upload image if on upload tab
    if (tab === "upload" && file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        imageUrl = data.url;
        storagePath = data.storagePath;
      } else {
        setSaving(false);
        return;
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("mood_board_items")
      .insert({
        project_id: projectId,
        name: name || "Untitled product",
        image_url: imageUrl,
        storage_path: storagePath,
        price: price ? parseFloat(price) : null,
        retailer_name: tab === "url" ? retailerName || null : null,
        retailer_url: tab === "url" ? retailerUrl || null : null,
        notes: notes || null,
      })
      .select("*")
      .single();

    setSaving(false);

    if (!error && data) {
      onAdded(data as MoodBoardItem);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setTab("url")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "url"
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FiLink className="mr-1.5 inline h-4 w-4" />
            Paste URL
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              tab === "upload"
                ? "border-b-2 border-teal-600 text-teal-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FiUpload className="mr-1.5 inline h-4 w-4" />
            Upload Photo
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {tab === "url" ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Product URL
                </label>
                <input
                  type="url"
                  value={retailerUrl}
                  onChange={(e) => setRetailerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Retailer Name
                </label>
                <input
                  type="text"
                  value={retailerName}
                  onChange={(e) => setRetailerName(e.target.value)}
                  placeholder="e.g. Home Depot"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragging
                  ? "border-teal-400 bg-teal-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <>
                  <FiUpload className="mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    Drag a photo or click to browse
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    JPEG, PNG, WebP, GIF up to 5MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {/* Shared fields */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brass cabinet pulls"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Color options, dimensions, etc."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Add to Mood Board"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
