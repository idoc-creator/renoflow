import Link from "next/link";
import {
  FiMessageSquare,
  FiCpu,
  FiTrendingUp,
  FiImage,
  FiList,
  FiShoppingCart,
  FiWifi,
  FiDollarSign,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const steps = [
  {
    num: "01",
    title: "Describe Your Project",
    desc: "Tell us what you want to renovate, your budget, and any constraints. Bathroom, kitchen, deck -- we handle it all.",
    icon: FiMessageSquare,
  },
  {
    num: "02",
    title: "Get Your AI Plan",
    desc: "Our AI creates a staged renovation plan with step-by-step instructions, materials lists, and cost estimates.",
    icon: FiCpu,
  },
  {
    num: "03",
    title: "Build & Earn",
    desc: "Track your progress, share your mood board, and earn money when others copy your build through affiliate links.",
    icon: FiTrendingUp,
  },
];

const features = [
  {
    title: "Mood Boards with Real Products",
    desc: "Curate your vision with shoppable products from real retailers. See exactly how your renovation will look.",
    icon: FiImage,
  },
  {
    title: "AI Step-by-Step Plans",
    desc: "Get detailed instructions for every phase of your project, tailored to your skill level and timeline.",
    icon: FiList,
  },
  {
    title: "Savings Dashboard",
    desc: "See exactly how much you are saving compared to hiring a contractor. Real numbers, updated in real time.",
    icon: FiDollarSign,
  },
  {
    title: "Offline Shopping List",
    desc: "Take your materials list to the hardware store -- it works offline. Check items off as you go.",
    icon: FiShoppingCart,
  },
  {
    title: "Works Offline",
    desc: "Install RenoFlow on your phone. Access plans, checklists, and guides even without an internet connection.",
    icon: FiWifi,
  },
  {
    title: "Earn from Your Build",
    desc: "Share your completed mood board publicly. When someone buys through your links, you earn a commission.",
    icon: FiTrendingUp,
  },
];

const tiers = [
  {
    name: "Scope It",
    price: "Free",
    period: "",
    description: "Define your renovation scope and get a rough cost estimate.",
    features: [
      "1 active project",
      "AI scope analysis",
      "Basic cost estimate",
      "Community access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Plan It",
    price: "$9",
    period: "/mo",
    description:
      "Full project plan with materials list, timeline, and permit guidance.",
    features: [
      "3 active projects",
      "Detailed AI plans",
      "Materials list with prices",
      "Timeline & milestones",
      "Permit guidance",
    ],
    cta: "Start Planning",
    highlighted: true,
  },
  {
    name: "Build It",
    price: "$19",
    period: "/mo",
    description:
      "Step-by-step build guide, shopping list with price tracking, and earn by sharing.",
    features: [
      "Unlimited projects",
      "Step-by-step build guides",
      "Offline shopping list",
      "Price tracking & alerts",
      "Mood board marketplace",
      "Affiliate earnings",
    ],
    cta: "Start Building",
    highlighted: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      {/* ---- Nav ---- */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-teal-700">RenoFlow</span>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="hover:text-teal-700 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-teal-700 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-teal-700 transition-colors">
              Pricing
            </a>
          </nav>
          <Link
            href="/auth/login"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-amber-50/30" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center md:py-32">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Plan Your DIY Renovation.{" "}
            <span className="text-teal-600">Save Thousands.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            The AI-powered platform that breaks your renovation into manageable
            stages, tracks your savings, and lets you earn money sharing your
            build.
          </p>
          <Link
            href="/auth/login"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-700/25"
          >
            Start Planning — Free
            <FiArrowRight className="h-5 w-5" />
          </Link>

          {/* Mock savings dashboard */}
          <div className="mt-14 w-full max-w-lg">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Your Renovation Dashboard
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-teal-50 px-3 py-4">
                  <p className="text-2xl font-bold text-teal-700 md:text-3xl">
                    $4,247
                  </p>
                  <p className="mt-1 text-xs font-medium text-teal-600">
                    Saved
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-4">
                  <p className="text-2xl font-bold text-amber-600 md:text-3xl">
                    $312
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-500">
                    Earned
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-4">
                  <p className="text-2xl font-bold text-emerald-700 md:text-3xl">
                    +$1,668
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    Net Advantage
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section id="how-it-works" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
            Three simple steps from idea to finished renovation.
          </p>
          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25">
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="mt-6 text-sm font-bold text-teal-600">
                  Step {step.num}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Everything You Need to Renovate Smarter
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
            Built for real DIYers who want professional results without
            professional prices.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-100 bg-white p-8 transition-all hover:border-teal-100 hover:shadow-lg hover:shadow-teal-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section id="pricing" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
            Start free. Upgrade when you are ready to build.
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-shadow hover:shadow-lg ${
                  tier.highlighted
                    ? "border-2 border-teal-600 bg-white shadow-xl shadow-teal-100"
                    : "border border-slate-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-slate-900">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="ml-1 text-slate-500">{tier.period}</span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-500">
                  {tier.description}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {tier.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <FiCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Social Proof ---- */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto flex max-w-xs items-center justify-center -space-x-3">
            {[
              "bg-teal-400",
              "bg-amber-400",
              "bg-emerald-400",
              "bg-sky-400",
              "bg-rose-400",
            ].map((bg, i) => (
              <div
                key={i}
                className={`h-10 w-10 rounded-full border-2 border-white ${bg}`}
              />
            ))}
          </div>
          <p className="mt-6 text-xl font-semibold text-slate-900 md:text-2xl">
            Join 100+ DIY homeowners saving thousands on their renovations
          </p>
          <p className="mt-3 text-slate-500">
            From bathroom remodels to full kitchen renovations, RenoFlow helps
            real people plan, build, and save.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl"
          >
            Start Your Project
            <FiArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row">
          <span>&copy; {new Date().getFullYear()} RenoFlow. All rights reserved.</span>
          <nav className="flex gap-6">
            <a href="#pricing" className="hover:text-slate-600 transition-colors">
              Pricing
            </a>
            <Link href="/auth/login" className="hover:text-slate-600 transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
