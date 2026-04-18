"use client";

interface SavingsDashboardProps {
  contractorEstimate: number;
  diyEstimate: number;
  budgetTotal: number;
  budgetSpent: number;
  actualCostTotal: number;
  /** Percentage buffer for surprises (default 15). */
  contingencyPct?: number;
}

export function SavingsDashboard({
  contractorEstimate,
  diyEstimate,
  budgetTotal,
  budgetSpent,
  actualCostTotal,
  contingencyPct = 15,
}: SavingsDashboardProps) {
  const contingencyAmount = Math.round(diyEstimate * (contingencyPct / 100));
  const diyWithContingency = diyEstimate + contingencyAmount;
  const savedByDiy = contractorEstimate - diyWithContingency;
  const spent = actualCostTotal;
  const budgetRemaining = budgetTotal - budgetSpent;
  const earned = 0; // placeholder
  const netAdvantage = savedByDiy - spent + earned;

  return (
    <div className="space-y-4">
      {diyEstimate > 0 && (
        <p className="text-[11px] text-graphite">
          Includes {contingencyPct}% contingency (
          <span className="font-semibold text-ink">
            ${contingencyAmount.toLocaleString()}
          </span>
          )
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Saved by DIYing */}
        <div className="rounded-xl bg-sage/10 border border-sage/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sage">
            Saved by DIYing
          </p>
          <p className="mt-1 text-2xl font-bold text-sage-dark">
            ${savedByDiy.toLocaleString()}
          </p>
        </div>

        {/* Spent so far */}
        <div className="rounded-xl bg-white border border-border-warm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
            Spent so far
          </p>
          <p className="mt-1 text-2xl font-bold text-charcoal">
            ${spent.toLocaleString()}
          </p>
        </div>

        {/* Budget remaining */}
        <div className="rounded-xl bg-white border border-border-warm p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
            Budget remaining
          </p>
          <p className="mt-1 text-2xl font-bold text-charcoal">
            ${budgetRemaining.toLocaleString()}
          </p>
        </div>

        {/* Earned from shares */}
        <div className="rounded-xl bg-terracotta/10 border border-terracotta/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-terracotta">
            Earned from shares
          </p>
          <p className="mt-1 text-2xl font-bold text-terracotta-dark">
            ${earned.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Net advantage */}
      <div className="rounded-xl bg-charcoal p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-gray">
          Net Advantage
        </p>
        <p
          className={`mt-1 text-3xl font-black ${netAdvantage >= 0 ? "text-sage" : "text-red-400"}`}
        >
          {netAdvantage >= 0 ? "+" : ""}${netAdvantage.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
