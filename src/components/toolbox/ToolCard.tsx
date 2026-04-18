"use client";

import { useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiMapPin,
} from "react-icons/fi";
import {
  STATUS_COLORS,
  type ToolboxItem,
  isOverdue,
  countOverdueConsumables,
} from "./types";

interface ToolCardProps {
  item: ToolboxItem;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ToolCard({ item, onEdit, onDelete }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const overdueCount = countOverdueConsumables(item.consumables ?? []);

  return (
    <div className="rounded-xl bg-white border border-border-warm shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-lg text-charcoal leading-tight">
                {item.name}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[item.status]}`}
              >
                {item.status.replace("_", " ")}
              </span>
              {overdueCount > 0 && (
                <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-semibold">
                  {overdueCount} needs reorder
                </span>
              )}
            </div>

            {(item.make || item.model) && (
              <p className="mt-0.5 text-sm text-warm-gray">
                {[item.make, item.model].filter(Boolean).join(" ")}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-warm-gray">
              {item.location && (
                <span className="flex items-center gap-1">
                  <FiMapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}
              {item.consumables?.length > 0 && (
                <span>
                  {item.consumables.length} consumable
                  {item.consumables.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </button>

          <div className="flex items-start gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="p-1.5 text-warm-gray hover:text-charcoal hover:bg-cream rounded transition-colors"
              aria-label="Edit tool"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-warm-gray hover:text-terracotta hover:bg-terracotta/10 rounded transition-colors"
              aria-label="Delete tool"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-warm-gray hover:text-charcoal"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <FiChevronDown className="h-4 w-4" />
              ) : (
                <FiChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border-warm px-4 py-3 space-y-3 bg-cream/50">
          {item.notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray mb-1">
                Notes
              </p>
              <p className="text-sm text-charcoal whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {item.manual_url && (
            <a
              href={item.manual_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-terracotta hover:text-terracotta-dark font-semibold"
            >
              <FiExternalLink className="h-3 w-3" />
              Open manual
            </a>
          )}

          {item.consumables?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray mb-1">
                Consumables
              </p>
              <div className="space-y-1">
                {item.consumables.map((c) => {
                  const overdue = isOverdue(c.reorder_date);
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                        overdue
                          ? "bg-red-50 border border-red-200"
                          : "bg-white border border-border-warm"
                      }`}
                    >
                      <span className="text-charcoal">{c.name}</span>
                      <div className="flex items-center gap-2 text-warm-gray">
                        <span>Qty {c.quantity_on_hand}</span>
                        {c.reorder_date && (
                          <span className={overdue ? "text-red-700" : ""}>
                            {overdue ? "Overdue" : "By"}{" "}
                            {new Date(c.reorder_date).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {item.purchase_price !== null && (
            <p className="text-[10px] text-warm-gray">
              Purchase price: ${item.purchase_price}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
