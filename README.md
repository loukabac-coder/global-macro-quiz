# Global Macro Quiz

Next.js, TypeScript et Supabase. Le parcours compte 22 modules sur quatre niveaux. Les activités connectées sont corrigées par PostgreSQL, qui enregistre la partie et la progression dans la même transaction.

## Lancer en local

Utilise Node.js 24.

```powershell
npm ci
npm run dev
```

Le quiz invité et le module de démonstration sont accessibles sur [localhost:3000](http://localhost:3000). Pour les comptes, ajoute les variables suivantes dans `.env.local`.

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de ton projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique publishable ou ancienne clé anon |
| `SUPABASE_SECRET_KEY` | Clé secrète Supabase, réservée au serveur Next.js |

Si ton projet utilise encore les anciennes clés, `SUPABASE_SERVICE_ROLE_KEY` peut remplacer `SUPABASE_SECRET_KEY`. La clé secrète ne doit jamais porter le préfixe `NEXT_PUBLIC_`.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Les tests Node exécutent les migrations dans PostgreSQL en mémoire avec un schéma de test. Le workflow **Qualité** exécute aussi les tests Python des collecteurs.

## Publier sur Vercel

1. Dans Supabase, vérifie que le projet cible contient déjà les tables `profiles`, `questions`, `quiz_sessions` et `attempts` utilisées par le site. Si le Lot 1 n’a jamais été appliqué, exécute [lot-1-progression.sql](sql/lot-1-progression.sql) dans **SQL Editor**. Sur une base de test, applique ensuite [lot-4-modules.sql](sql/lot-4-modules.sql) et vérifie un quiz connecté jusqu’à l’apparition du score dans le profil.
2. Dans Vercel, ouvre **Settings → Environment Variables**. Conserve les variables publiques et ajoute `SUPABASE_SECRET_KEY` à **Production**. Pour une Preview testée sur une autre base, renseigne les trois variables de cette base pour la Preview.
3. Au moment de publier, exécute [lot-4-modules.sql](sql/lot-4-modules.sql) dans le **SQL Editor** du projet de production. La migration conserve les historiques. Elle désactive les anciennes écritures de progression au profit des nouvelles RPC. Enchaîne avec le déploiement pour éviter que l’ancien site reste servi pendant cette transition.
4. Publie le commit sur la branche Production de Vercel, habituellement `main`. Les commandes suivantes supposent que cette branche est bien `main` et que tu travailles dessus.

```powershell
git status --short
git add .github README.md package.json package-lock.json public/data/guest-questions.json scripts sql src test vercel.json
git diff --cached --stat
git commit -m "Fiabilise les quiz, le parcours et les données"
git pull --rebase origin main
git push origin main
```

5. Dans **Deployments**, attends que le nouveau commit soit marqué **Ready** pour **Production**. Ouvre [le site](https://global-macro-quiz.vercel.app/) et actualise avec **Ctrl+F5**. Vérifie `/module?id=d1` sans compte, puis termine une partie connecté et vérifie **Profil → Parties récentes**.
6. Lance une première collecte dans **GitHub → Actions → Données du jour → Run workflow** sur la branche par défaut. Le robot crée la branche `data-live` et y publie les instantanés. Vérifie `/donnees` et `/capitalisations` après le passage. Cette mise à jour se lit sans nouveau déploiement.

[Vercel et les déploiements Git](https://vercel.com/docs/git) · [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables) · [Clés Supabase](https://supabase.com/docs/guides/getting-started/api-keys)

## Données et progression

- Le défi quotidien utilise la date de Paris et le même jeu de questions pour les visiteurs et les comptes. Les cours, les mini-checks et les corrections immédiates restent accessibles selon le niveau du parcours.
- GitHub Actions contrôle la macro et l’or toutes les 30 minutes. Le panel de capitalisations est contrôlé chaque heure en semaine. Le calendrier GitHub et les délais de publication des fournisseurs peuvent décaler la disponibilité.
- Les tableaux et les quiz lisent la même publication via `data-live`. Vercel ne redéploie pas sur cette branche. Les tableaux ouverts vérifient toutes les deux minutes s’il y a une nouvelle publication.
- Un échec conserve l’ancienne observation et sa date. Le site identifie les valeurs dont la fraîcheur n’a pas pu être établie et les retire des nouveaux quiz. Les capitalisations converties en dollars indiquent la séance boursière et le taux de change Yahoo Finance ou BCE réellement utilisé.
