"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiSend,
  FiLoader,
  FiCheck,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import PlanReview, { type PlanPreview } from "./PlanReview";

interface QuickPick {
  label: string;
  value: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  recap?: string | null;
  options?: QuickPick[] | null;
}

interface SubProject {
  title: string;
  reason_it_came_up: string;
}

interface ParentLink {
  parent_project_id: string;
  parent_project_name: string;
  reason: string;
}

interface Progress {
  captured_count: number;
  estimated_total: number;
  recap: string | null;
}

interface IntakeChatProps {
  projectId: string;
  projectName: string;
  initialIntake: Record<string, unknown>;
  alreadyComplete: boolean;
}

export function IntakeChat({
  projectId,
  projectName,
  initialIntake,
  alreadyComplete,
}: IntakeChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [intake, setIntake] = useState<Record<string, unknown>>(initialIntake);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [complete, setComplete] = useState(alreadyComplete);
  const [error, setError] = useState<string | null>(null);
  const [detectedSubs, setDetectedSubs] = useState<SubProject[]>([]);
  const [generating, setGenerating] = useState(false);
  const [creatingSub, setCreatingSub] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [parentLink, setParentLink] = useState<ParentLink | null>(null);
  const [linkingParent, setLinkingParent] = useState(false);
  const [parentLinkApplied, setParentLinkApplied] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<QuickPick[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Kick off the first assistant message once on mount.
  useEffect(() => {
    if (messages.length === 0 && !alreadyComplete) {
      void sendTurn([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, progress]);

  async function sendTurn(history: Message[]) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          intakeSoFar: intake,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.mock) setIsMock(true);
      setIntake(data.intake ?? {});
      setProgress(data.progress ?? null);
      setCurrentOptions(data.options ?? null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          recap: data.progress?.recap ?? null,
          options: data.options ?? null,
        },
      ]);
      if (data.detected_sub_projects?.length > 0) {
        setDetectedSubs((prev) => {
          const seen = new Set(prev.map((s) => s.title.toLowerCase()));
          const fresh = data.detected_sub_projects.filter(
            (s: SubProject) => !seen.has(s.title.toLowerCase())
          );
          return [...prev, ...fresh];
        });
      }
      if (data.suggested_parent_link && !parentLinkApplied) {
        setParentLink(data.suggested_parent_link as ParentLink);
      }
      if (data.is_complete) {
        setComplete(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setCurrentOptions(null); // clear picks once user submits text
    await sendTurn(next);
  }

  async function handleQuickPick(label: string, value: string) {
    if (sending) return;
    // Display the human label, send the machine value so capture matches cleanly
    const next: Message[] = [...messages, { role: "user", content: label }];
    setMessages(next);
    setCurrentOptions(null);
    // Send the value (not label) to the API for more reliable parsing
    await sendTurn([
      ...messages,
      { role: "user", content: value },
    ]);
  }

  async function handleLinkParent() {
    if (!parentLink) return;
    setLinkingParent(true);
    try {
      const supabase = createClient();
      // Find an existing "catch-all" stage on the parent or create one
      const { data: stages } = await supabase
        .from("stages")
        .select("id, title, sort_order")
        .eq("project_id", parentLink.parent_project_id)
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextSort = stages?.[0]?.sort_order != null ? stages[0].sort_order + 1 : 0;
      await supabase.from("stages").insert({
        project_id: parentLink.parent_project_id,
        title: projectName,
        description: `Sub-project linked from intake.`,
        reason:
          "You said this project is part of your parent project — linking the two so progress and budget roll up.",
        sort_order: nextSort,
        status: "pending",
        linked_project_id: projectId,
      });
      setParentLinkApplied(true);
      setParentLink(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't link parent.");
    } finally {
      setLinkingParent(false);
    }
  }

  async function handleGeneratePlan() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/draft-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          useIntake: true,
          preview: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Plan draft failed.");
      }
      const data = await res.json();
      if (data.mock) setIsMock(true);
      setPreview(data.plan as PlanPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't draft a plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateSubProject(title: string) {
    setCreatingSub(title);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");
      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: title,
          status: "planning",
        })
        .select("id")
        .single();
      if (insertError || !data) throw insertError ?? new Error("insert failed");
      // Remove from list
      setDetectedSubs((prev) => prev.filter((s) => s.title !== title));
      // Optionally deep-link
      router.push(`/projects/project/${data.id}/intake`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create sub-project.");
    } finally {
      setCreatingSub(null);
    }
  }

  async function handleRestart() {
    if (
      !confirm(
        "Restart the intake? Your answers will be cleared (your stages/steps are untouched)."
      )
    )
      return;
    const supabase = createClient();
    await supabase
      .from("projects")
      .update({ intake_data: null, intake_complete: false })
      .eq("id", projectId);
    setMessages([]);
    setIntake({});
    setProgress(null);
    setComplete(false);
    setDetectedSubs([]);
    await sendTurn([]);
  }

  const progressPct = progress
    ? Math.min(
        100,
        Math.round(
          (progress.captured_count / Math.max(1, progress.estimated_total)) *
            100
        )
      )
    : 0;

  // When a preview is ready, show the review in place of the chat.
  if (preview) {
    return (
      <div className="flex flex-col gap-4">
        {isMock && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
            <strong>Mock mode:</strong> this plan was drafted by a scripted
            template, not a live model. Add <code>ANTHROPIC_API_KEY</code> in
            <code> .env.local</code> for real AI output.
          </div>
        )}
        <PlanReview
          projectId={projectId}
          preview={preview}
          onCancel={() => setPreview(null)}
          onReplacePreview={(next) => setPreview(next)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isMock && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
          <strong>Mock mode:</strong> ANTHROPIC_API_KEY isn&apos;t set, so I&apos;m
          running a scripted conversation. The flow, recaps, sub-project
          detection, and plan draft all work — you just won&apos;t get
          open-ended AI answers. Add the key in <code>.env.local</code> to
          switch to real AI.
        </div>
      )}
      {/* Progress strip */}
      <div className="rounded-xl bg-white border border-border-warm p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-warm-gray">
            {projectName} intake
          </p>
          <div className="flex items-center gap-2">
            {progress && !complete && (
              <span className="text-[11px] text-warm-gray">
                {progress.captured_count} of ~{progress.estimated_total}
              </span>
            )}
            {complete && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-dark">
                <FiCheck className="h-3 w-3" />
                Complete
              </span>
            )}
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-1 text-[11px] text-warm-gray hover:text-charcoal"
              title="Restart intake"
            >
              <FiRefreshCw className="h-3 w-3" />
              Restart
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-sage transition-all duration-300"
            style={{ width: `${complete ? 100 : progressPct}%` }}
          />
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="rounded-2xl bg-white border border-border-warm p-4 h-[60vh] overflow-y-auto space-y-4"
      >
        {messages.length === 0 && sending && (
          <div className="flex items-center gap-2 text-sm text-warm-gray">
            <FiLoader className="h-4 w-4 animate-spin" />
            Warming up…
          </div>
        )}
        {messages.map((m, i) => {
          const isLatestAssistant =
            m.role === "assistant" &&
            i === messages.length - 1 &&
            currentOptions &&
            currentOptions.length > 0 &&
            !sending;
          return (
            <div key={i} className="space-y-1">
              {m.recap && m.role === "assistant" && (
                <div className="rounded-lg bg-sage/10 border border-sage/30 px-3 py-2 text-xs text-sage-dark">
                  <span className="font-semibold">Recap: </span>
                  {m.recap}
                </div>
              )}
              <div
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-terracotta text-white rounded-br-sm"
                      : "bg-cream text-charcoal rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
              {isLatestAssistant && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentOptions!.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleQuickPick(opt.label, opt.value)}
                      disabled={sending}
                      className="rounded-full border border-border-warm bg-white px-3 py-1.5 text-xs font-medium text-charcoal hover:border-terracotta hover:bg-terracotta/5 transition-colors disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-[11px] text-warm-gray self-center">
                    or type your answer
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {sending && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-cream px-4 py-2.5 text-sm text-warm-gray inline-flex items-center gap-2">
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
              thinking…
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 inline-flex items-start gap-2">
            <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Parent-project link suggestion */}
      {parentLink && !parentLinkApplied && (
        <div className="rounded-2xl border border-sage/40 bg-sage/5 p-4 space-y-2">
          <p className="text-sm font-semibold text-sage-dark">
            Link as a sub-project?
          </p>
          <p className="text-xs text-warm-gray">{parentLink.reason}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLinkParent}
              disabled={linkingParent}
              className="rounded-lg bg-sage hover:bg-sage-dark text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
            >
              {linkingParent
                ? "Linking…"
                : `Yes — link to "${parentLink.parent_project_name}"`}
            </button>
            <button
              onClick={() => setParentLink(null)}
              className="text-xs text-warm-gray hover:text-charcoal px-2 py-1.5"
            >
              Not now
            </button>
          </div>
        </div>
      )}
      {parentLinkApplied && (
        <div className="rounded-lg bg-sage/10 border border-sage/30 px-3 py-2 text-xs text-sage-dark">
          Linked as a sub-project. You&apos;ll see it as a stage on the parent.
        </div>
      )}

      {/* Side-build detection strip */}
      {detectedSubs.length > 0 && (
        <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-terracotta-dark">
            Side builds I heard
          </p>
          <ul className="space-y-2">
            {detectedSubs.map((s) => (
              <li
                key={s.title}
                className="flex items-center justify-between gap-3 rounded-lg bg-white p-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">
                    {s.title}
                  </p>
                  <p className="text-[11px] text-warm-gray truncate">
                    {s.reason_it_came_up}
                  </p>
                </div>
                <button
                  onClick={() => handleCreateSubProject(s.title)}
                  disabled={creatingSub === s.title}
                  className="shrink-0 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
                >
                  {creatingSub === s.title
                    ? "Creating…"
                    : "Create sub-project"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Input / actions */}
      {!complete ? (
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 rounded-2xl bg-white border border-border-warm p-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Type your answer…"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-charcoal focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-50"
          >
            <FiSend className="h-4 w-4" />
            Send
          </button>
        </form>
      ) : (
        <div className="rounded-2xl bg-sage/10 border border-sage/30 p-4 space-y-3">
          <p className="text-sm text-charcoal">
            Got everything I need. Want me to draft the plan now?
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-sage hover:bg-sage-dark text-white font-semibold text-sm px-4 py-2 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin" />
                  Drafting…
                </>
              ) : (
                <>Draft my plan →</>
              )}
            </button>
            <Link
              href={`/projects/project/${projectId}`}
              className="text-sm text-warm-gray hover:text-charcoal px-3 py-2"
            >
              Skip for now
            </Link>
            <button
              onClick={handleRestart}
              className="text-sm text-warm-gray hover:text-charcoal px-3 py-2 inline-flex items-center gap-1"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Redo intake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
