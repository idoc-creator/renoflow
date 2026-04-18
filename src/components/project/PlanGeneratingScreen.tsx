"use client";

import { useEffect, useState } from "react";

const STAGES = [
  "Reading your intake…",
  "Sketching the stages on paper…",
  "Sequencing by dependencies…",
  "Checking permits in your jurisdiction…",
  "Adding lead times for the long-haul materials…",
  "Naming the things that usually go wrong on this kind of build…",
  "Estimating costs and hours per stage…",
  "Writing the \u201Cwhy this order\u201D notes…",
  "Tying tools to your toolbox…",
  "Folding the corners…",
];

/**
 * Engaging loading state for the draft-plan call. Cycles through editorial
 * status messages so the user has something to read and a sense of forward
 * motion. Total time is usually 15-30s; we set the cycle to ~3.5s per
 * message so a typical render covers 4-6 phases.
 */
export function PlanGeneratingScreen({
  projectName,
}: {
  projectName: string;
}) {
  const [index, setIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const cycle = setInterval(
      () => setIndex((i) => (i + 1) % STAGES.length),
      3500
    );
    const tick = setInterval(
      () => setSecondsElapsed((s) => s + 1),
      1000
    );
    return () => {
      clearInterval(cycle);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-hairline bg-paper bg-grid p-8 md:p-12 text-center">
      <p className="text-caption uppercase tracking-[0.22em] text-walnut">
        Drafting your plan
      </p>
      <h2 className="mt-3 font-display-lg text-ink">
        Working on{" "}
        <span className="font-hand-lg text-walnut">
          {projectName.toLowerCase()}
        </span>
      </h2>

      <div className="mx-auto mt-10 max-w-md">
        {/* Cycling status messages — Caveat for warmth */}
        <p
          key={index}
          className="font-hand text-2xl text-walnut animate-fade-in"
        >
          {STAGES[index]}
        </p>
        {/* Three blinking dots underneath */}
        <div className="mt-4 flex justify-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>

      <p className="mt-10 text-sm text-graphite">
        {secondsElapsed < 30
          ? "Usually takes 15-30 seconds."
          : secondsElapsed < 60
            ? "Bigger projects can take a minute. Hang tight."
            : "Almost there — pulling it all together."}
      </p>
      <p className="mt-2 text-xs text-graphite">
        {secondsElapsed}s elapsed
      </p>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-walnut animate-pulse"
      style={{ animationDelay: `${delay}ms`, animationDuration: "1200ms" }}
    />
  );
}
