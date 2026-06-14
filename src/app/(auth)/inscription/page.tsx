import type { Metadata } from "next";

import { signUp } from "@/app/auth-actions";
import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Créer ma boutique",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return <AuthCard mode="signup" action={signUp} error={params.error} />;
}
