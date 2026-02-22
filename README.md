This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Connexion TMDB en local

TMDB bloque les redirections vers `localhost` (erreur 403 CloudFront). Pour tester la connexion en développement :

1. **Installer ngrok** : [ngrok.com](https://ngrok.com) (ou `brew install ngrok`)
2. **Lancer le tunnel** dans un terminal :
   ```bash
   ngrok http 3000
   ```
3. **Copier l’URL générée** (ex. `https://abc123.ngrok-free.app`)
4. **Définir la variable d’environnement** dans `.env.local` :
   ```
   NEXT_PUBLIC_APP_URL=https://votre-url-ngrok.ngrok-free.app
   ```
5. **Accéder à l’app via l’URL ngrok** (pas localhost) et tester la connexion TMDB

### Lancer le projet

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
