"use client";

import { useState } from "react";
import { FiTool, FiX, FiSend } from "react-icons/fi";

interface AskBenchDrawerProps {
  projectId?: string;
  projectCategory?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "What tools do I need?",
  "How do I do this safely?",
  "Can I DIY this part?",
];

export default function AskBenchDrawer({
  projectId,
  projectCategory,
}: AskBenchDrawerProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(question: string) {
    if (!question.trim() || loading) return;

    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: { projectId, projectCategory },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.answer },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "Sorry, I couldn't get an answer. Try again.",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAsk(input);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-20 bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transition-colors"
        >
          <FiTool className="h-5 w-5" />
          Ask Bench
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div
            className="absolute inset-0 bg-charcoal/20"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md bg-cream border-l border-border-warm flex flex-col shadow-2xl">
            <header className="flex items-center justify-between p-4 border-b border-border-warm">
              <div className="flex items-center gap-2">
                <FiTool className="h-5 w-5 text-terracotta" />
                <h2 className="font-serif text-xl text-charcoal">Ask Bench</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-warm-gray hover:text-charcoal p-1"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div>
                  <p className="text-warm-gray text-sm mb-4">
                    Stuck on a step? Need a product recommendation? Ask anything
                    about your project.
                  </p>
                  <div className="space-y-2">
                    {STARTER_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleAsk(q)}
                        className="block w-full text-left px-3 py-2 text-sm bg-white border border-border-warm rounded-lg hover:border-terracotta transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 text-sm ${
                    msg.role === "user"
                      ? "bg-terracotta/10 text-charcoal ml-6"
                      : "bg-white border border-border-warm text-charcoal mr-6"
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {loading && (
                <div className="bg-white border border-border-warm rounded-xl p-3 text-sm text-warm-gray mr-6">
                  Thinking...
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-border-warm bg-white flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your project..."
                disabled={loading}
                className="flex-1 px-3 py-2 bg-cream border border-border-warm rounded-lg text-sm focus:outline-none focus:border-terracotta disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-terracotta hover:bg-terracotta-dark text-white px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
