"use client";

interface SavingsDashboardProps {
  contractorEstimate: number;
  diyEstimate: number;
  budgetTotal: number;
  budgetSpent: number;
  actualCostTotal: number;
}

export function SavingsDashboard({
  contractorEstimate,
  diyEstimate,
  budgetTotal,
  budgetSpent,
  actualCostTotal,
}: SavingsDashboardProps) {
  const savedByDiy = contractorEstimate - diyEstimate;
  const spent = actualCostTotal;
  const budgetRemaining = budgetTotal - budgetSpent;
  const earned = 0; // placeholder
  const netAdvantage = savedByDiy - spent + earned;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Savings Dashboard
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Saved by DIYing */}
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">
            Saved by DIYing
          </p>
          <p className="mt-1 text-2xl font-bold text-teal-700">
            ${savedByDiy.toLocaleString()}
          </p>
        </div>

        {/* Spent so far */}
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Spent so far
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-700">
            ${spent.toLocaleString()}
          </p>
        </div>

        {/* Budget remaining */}
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Budget remaining
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-700">
            ${budgetRemaining.toLocaleString()}
          </p>
        </div>

        {/* Earned from shares */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
            Earned from shares
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            ${earned.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Net advantage */}
      <div className="rounded-xl bg-slate-900 p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Net Advantage
        </p>
        <p
          className={`mt-1 text-3xl font-black ${netAdvantage >= 0 ? "text-teal-400" : "text-red-400"}`}
        >
          {netAdvantage >= 0 ? "+" : ""}${netAdvantage.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
