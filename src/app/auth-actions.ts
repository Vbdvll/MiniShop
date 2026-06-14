"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email("Saisissez une adresse e-mail valide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(72, "Le mot de passe est trop long."),
});

function redirectWithMessage(
  path: "/connexion" | "/inscription",
  type: "error" | "success",
  message: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/connexion", "error", parsed.error.issues[0].message);
  }

  if (!hasSupabaseEnv()) {
    redirectWithMessage(
      "/connexion",
      "error",
      "Supabase n'est pas encore configuré. Consultez le fichier .env.example.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithMessage(
      "/connexion",
      "error",
      "E-mail ou mot de passe incorrect.",
    );
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/inscription", "error", parsed.error.issues[0].message);
  }

  if (!hasSupabaseEnv()) {
    redirectWithMessage(
      "/inscription",
      "error",
      "Supabase n'est pas encore configuré. Consultez le fichier .env.example.",
    );
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirectWithMessage(
      "/inscription",
      "error",
      error.message.includes("already registered")
        ? "Un compte existe déjà avec cette adresse e-mail."
        : "Impossible de créer le compte pour le moment.",
    );
  }

  redirectWithMessage(
    "/connexion",
    "success",
    "Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.",
  );
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}
