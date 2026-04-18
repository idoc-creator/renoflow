"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

type Mode = "password" | "magic-link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [mode, setMode] = useState<Mode>("password");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        // For dev, auto-confirm is usually on so we can redirect straight to projects
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          router.push("/projects");
          router.refresh();
        } else {
          setMessage("Account created! Check your email to confirm, then log in.");
          setLoading(false);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/projects");
        router.refresh();
      }
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a magic link!");
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-4xl text-charcoal">Bench</h1>
          <p className="mt-2 text-warm-gray">Stop pinning. Start building.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-border-warm">
          <h2 className="mb-6 text-center font-serif text-2xl text-charcoal">
            {isSignup ? "Create your account" : "Welcome back"}
          </h2>

          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-border-warm bg-white px-4 py-3 text-sm font-medium text-charcoal transition-colors hover:bg-cream"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-warm" />
            <span className="text-xs text-warm-gray">or</span>
            <div className="h-px flex-1 bg-border-warm" />
          </div>

          {mode === "password" ? (
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-charcoal"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-border-warm px-4 py-3 text-sm text-charcoal placeholder:text-warm-gray focus:border-terracotta focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-charcoal"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-border-warm px-4 py-3 text-sm text-charcoal placeholder:text-warm-gray focus:border-terracotta focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                <FiLock className="h-4 w-4" />
                {loading
                  ? "Working..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label
                  htmlFor="email-magic"
                  className="mb-1 block text-sm font-medium text-charcoal"
                >
                  Email
                </label>
                <input
                  id="email-magic"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-border-warm px-4 py-3 text-sm text-charcoal placeholder:text-warm-gray focus:border-terracotta focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
              >
                <FiMail className="h-4 w-4" />
                {loading ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() =>
                setMode(mode === "password" ? "magic-link" : "password")
              }
              className="text-xs text-warm-gray hover:text-charcoal"
            >
              {mode === "password"
                ? "Use magic link instead"
                : "Use password instead"}
            </button>
          </div>

          {message && (
            <p className="mt-4 text-center text-sm text-sage-dark">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-center text-sm text-terracotta">{error}</p>
          )}

          <p className="mt-6 text-center text-sm text-warm-gray">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
                setMessage("");
              }}
              className="font-medium text-terracotta hover:text-terracotta-dark"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
