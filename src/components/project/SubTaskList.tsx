"use client";

import { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

export interface SubTask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (next: SubTask[]) => void;
  editable?: boolean;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SubTaskList({
  subTasks,
  onChange,
  editable = true,
}: SubTaskListProps) {
  const [draftTitle, setDraftTitle] = useState("");

  function addSubTask() {
    if (!draftTitle.trim()) return;
    onChange([
      ...subTasks,
      { id: generateId(), title: draftTitle.trim(), is_completed: false },
    ]);
    setDraftTitle("");
  }

  function updateSubTask(id: string, patch: Partial<SubTask>) {
    onChange(subTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeSubTask(id: string) {
    onChange(subTasks.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-2">
      {subTasks.length === 0 && editable && (
        <p className="text-xs text-warm-gray italic">
          Break this step into a checklist — add sub-tasks below.
        </p>
      )}
      {subTasks.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-md bg-white border border-border-warm px-3 py-2"
        >
          <input
            type="checkbox"
            checked={t.is_completed}
            onChange={(e) =>
              updateSubTask(t.id, { is_completed: e.target.checked })
            }
            className="accent-sage shrink-0"
          />
          {editable ? (
            <input
              type="text"
              value={t.title}
              onChange={(e) => updateSubTask(t.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-sm text-charcoal focus:outline-none"
            />
          ) : (
            <span
              className={`flex-1 text-sm ${
                t.is_completed ? "text-warm-gray line-through" : "text-charcoal"
              }`}
            >
              {t.title}
            </span>
          )}
          {editable && (
            <button
              type="button"
              onClick={() => removeSubTask(t.id)}
              className="shrink-0 text-warm-gray hover:text-terracotta"
              aria-label="Remove sub-task"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
      {editable && (
        <div className="flex gap-2">
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubTask();
              }
            }}
            placeholder="Add a sub-task and press Enter"
            className="flex-1 px-3 py-2 bg-cream rounded-md border border-border-warm text-sm focus:outline-none focus:border-terracotta"
          />
          <button
            type="button"
            onClick={addSubTask}
            disabled={!draftTitle.trim()}
            className="flex items-center gap-1 rounded-md bg-sage/20 px-3 py-2 text-xs font-semibold text-sage-dark hover:bg-sage/30 disabled:opacity-50"
          >
            <FiPlus className="h-3 w-3" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}
