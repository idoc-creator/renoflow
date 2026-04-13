export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
};
