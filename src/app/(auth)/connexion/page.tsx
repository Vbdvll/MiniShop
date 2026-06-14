import type { Metadata } from "next";

import { signIn } from "@/app/auth-actions";
import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Connexion",
};

type PageProps = {
  searchParams: Promise<{ error?: string; success?: string; message?: string }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      mode="signin"
      action={signIn}
      error={params.error}
      success={params.success ?? params.message}
    />
  );
}
