import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";

type AuthCardProps = {
  mode: "signin" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  success?: string;
};

export function AuthCard({ mode, action, error, success }: AuthCardProps) {
  const isSignUp = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-ink/8 bg-white p-6 shadow-xl shadow-ink/8 sm:p-8">
      <div>
        <p className="text-sm font-bold text-emerald-700">
          {isSignUp ? "Votre boutique commence ici" : "Heureux de vous revoir"}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isSignUp ? "Créez votre compte" : "Connectez-vous"}
        </h1>
        <p className="mt-2 leading-6 text-ink/60">
          {isSignUp
            ? "Commencez gratuitement. Aucune carte bancaire nécessaire."
            : "Retrouvez vos produits et gérez votre boutique."}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {success}
        </div>
      )}

      <form action={action} className="mt-7 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold">Adresse e-mail</span>
          <span className="relative block">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
              aria-hidden="true"
            />
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="vous@exemple.com"
              className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/45 py-3 pl-11 pr-4 outline-none transition placeholder:text-ink/35 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold">Mot de passe</span>
          <span className="relative block">
            <LockKeyhole
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
              aria-hidden="true"
            />
            <input
              type="password"
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder="8 caractères minimum"
              className="min-h-13 w-full rounded-2xl border border-ink/15 bg-cream/45 py-3 pl-11 pr-4 outline-none transition placeholder:text-ink/35 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </span>
        </label>

        <button
          type="submit"
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
        >
          {isSignUp ? "Créer ma boutique" : "Se connecter"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        {isSignUp ? "Vous avez déjà un compte ?" : "Vous n'avez pas encore de compte ?"}{" "}
        <Link
          href={isSignUp ? "/connexion" : "/inscription"}
          className="font-extrabold text-emerald-700 hover:underline"
        >
          {isSignUp ? "Se connecter" : "Créer une boutique"}
        </Link>
      </p>
    </div>
  );
}
