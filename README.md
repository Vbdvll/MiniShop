# MiniShop

MiniShop est un catalogue web mobile-first pour les vendeurs qui commercialisent
leurs produits sur WhatsApp. Chaque vendeur crée une mini-boutique partageable et
les clients commandent dans une conversation WhatsApp préremplie.

## Stack

- Next.js 16, React 19 et TypeScript
- Tailwind CSS 4
- Supabase Auth, PostgreSQL et Storage
- Déploiement cible : Cloudflare Workers via OpenNext

## Démarrage local

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

L'application fonctionne en mode aperçu sans clés Supabase. Pour activer
l'inscription et les sessions, créez un projet Supabase puis renseignez
`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Appliquez ensuite la migration
`supabase/migrations/202606140001_initial_schema.sql` depuis le SQL Editor
Supabase ou avec la CLI Supabase.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run build:worker
```

## Déploiement Cloudflare Workers

Le projet utilise OpenNext pour exécuter Next.js sur Cloudflare Workers.

Dans Cloudflare, configurez les variables de build et d’exécution suivantes :

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Commandes utilisées par le pipeline :

```text
Build command: npm run build:worker
Deploy command: npx wrangler deploy
```
