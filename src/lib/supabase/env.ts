const requiredPublicKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type PublicSupabaseKey = (typeof requiredPublicKeys)[number];

export function hasSupabaseEnvironment() {
  return requiredPublicKeys.every((key) => Boolean(process.env[key]));
}

function getPublicValue(key: PublicSupabaseKey) {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Missing ${key}. Copy .env.example to .env.local and configure Supabase.`,
    );
  }

  return value;
}

export function getSupabaseEnvironment() {
  return {
    url: getPublicValue("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: getPublicValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}
