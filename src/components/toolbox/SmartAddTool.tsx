"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FiCamera, FiMaximize, FiEdit3, FiX } from "react-icons/fi";
import ToolEditForm, { type ToolFormData } from "./ToolEditForm";
import CatalogSearch from "./CatalogSearch";
import type { ToolCategory, ToolboxItem } from "./types";

type Tab = "manual" | "scan" | "photo";

interface SmartAddToolProps {
  onSave: (data: ToolFormData) => void | Promise<void>;
  onClose: () => void;
}

export default function SmartAddTool({ onSave, onClose }: SmartAddToolProps) {
  const [tab, setTab] = useState<Tab>("manual");
  const [prefill, setPrefill] = useState<Partial<ToolboxItem> | undefined>(
    undefined
  );

  function handlePrefillAndSwitch(data: Partial<ToolboxItem>) {
    setPrefill(data);
    setTab("manual");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/30 p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl bg-cream border border-border-warm shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-warm-gray hover:text-charcoal z-10"
          aria-label="Close"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="p-8">
          <h2 className="font-serif text-3xl text-charcoal mb-4">Add a tool</h2>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-white border border-border-warm p-1 mb-6">
            <TabButton
              active={tab === "manual"}
              onClick={() => setTab("manual")}
              icon={<FiEdit3 className="h-4 w-4" />}
              label="Manual"
            />
            <TabButton
              active={tab === "scan"}
              onClick={() => setTab("scan")}
              icon={<FiMaximize className="h-4 w-4" />}
              label="Scan"
            />
            <TabButton
              active={tab === "photo"}
              onClick={() => setTab("photo")}
              icon={<FiCamera className="h-4 w-4" />}
              label="Photo"
            />
          </div>

          {tab === "manual" && (
            <>
              <CatalogSearch
                onSelect={(data) => {
                  setPrefill(data);
                }}
              />
              <ToolEditForm
                key={prefill?.name ?? "empty"}
                initial={prefill}
                onSave={onSave}
                onCancel={onClose}
                saveLabel="Add tool"
              />
            </>
          )}

          {tab === "scan" && (
            <ScanTab onResult={handlePrefillAndSwitch} />
          )}

          {tab === "photo" && (
            <PhotoTab onResult={handlePrefillAndSwitch} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-terracotta text-white"
          : "text-warm-gray hover:text-charcoal"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Scan Tab ────────────────────────────────────────────────

function ScanTab({
  onResult,
}: {
  onResult: (data: Partial<ToolboxItem>) => void;
}) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // Ignore — already stopped
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  async function startScanner() {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("bench-scanner");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          await stopScanner();
          await lookupUPC(decodedText);
        },
        () => {
          // QR scan failure — expected while scanning, ignore
        }
      );
      setScanning(true);
    } catch (err) {
      setError(
        "Camera access denied or unavailable. Try the Photo tab instead."
      );
      console.error("Scanner error:", err);
    }
  }

  async function lookupUPC(upc: string) {
    setLookingUp(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/tools/upc-lookup?upc=${encodeURIComponent(upc)}`
      );
      const data = await res.json();

      if (data.found) {
        onResult({
          name: data.name || `UPC: ${upc}`,
          make: data.brand || null,
        });
      } else {
        setError(`No product found for barcode ${upc}. Add manually.`);
      }
    } catch {
      setError("Lookup failed. Try again or add manually.");
    } finally {
      setLookingUp(false);
    }
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="space-y-4 text-center">
      <p className="text-warm-gray text-sm">
        Point your camera at the barcode on the tool&apos;s box or label.
      </p>

      <div
        id="bench-scanner"
        ref={scannerRef}
        className="mx-auto w-full max-w-sm aspect-[4/3] rounded-xl overflow-hidden bg-charcoal/5"
      />

      {!scanning && !lookingUp && (
        <button
          onClick={startScanner}
          className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Start scanning
        </button>
      )}

      {lookingUp && (
        <p className="text-warm-gray text-sm">Looking up barcode...</p>
      )}

      {error && (
        <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Photo Tab ───────────────────────────────────────────────

function PhotoTab({
  onResult,
}: {
  onResult: (data: Partial<ToolboxItem>) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);

      // Extract base64 data
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type || "image/jpeg";

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ai/identify-tool", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || "Couldn't identify the tool."
          );
        }

        const data = await res.json();
        onResult({
          name: data.name || "Unknown tool",
          make: data.make || null,
          model: data.model || null,
          category: (data.category as ToolCategory) || "other",
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to identify. Try a clearer photo or add manually."
        );
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-warm-gray text-sm">
        Take a photo of the tool or its nameplate. Bench will identify it.
      </p>

      {preview ? (
        <div className="mx-auto max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Tool photo"
            className="w-full rounded-xl object-cover max-h-64"
          />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mx-auto w-full max-w-sm aspect-[4/3] rounded-xl border-2 border-dashed border-border-warm bg-white flex flex-col items-center justify-center cursor-pointer hover:border-terracotta transition-colors"
        >
          <FiCamera className="h-8 w-8 text-warm-gray mb-2" />
          <span className="text-sm text-warm-gray">
            Tap to take a photo or upload
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!preview && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Choose photo
        </button>
      )}

      {loading && (
        <p className="text-warm-gray text-sm">Identifying your tool...</p>
      )}

      {error && (
        <p className="text-terracotta text-sm bg-terracotta/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {preview && !loading && !error && (
        <button
          onClick={() => {
            setPreview(null);
            setError(null);
          }}
          className="text-warm-gray hover:text-charcoal text-sm"
        >
          Try a different photo
        </button>
      )}
    </div>
  );
}
