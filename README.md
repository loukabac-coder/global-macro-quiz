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

1. Dans Supabase, vérifie que le projet cible contient les tables `profiles`, `questions`, `quiz_sessions` et `attempts`. Sur une base de test, applique les migrations dans l’ordre [Lot 1](sql/lot-1-progression.sql), [Lot 4](sql/lot-4-modules.sql), [Lot 5](sql/lot-5-examen-et-questions.sql), [Lot 6](sql/lot-6-recommencer-quiz.sql), puis [Lot 7](sql/lot-7-parcours.sql).
2. Dans Vercel, ouvre **Settings → Environment Variables**. Conserve les variables publiques et ajoute `SUPABASE_SECRET_KEY` à **Production**. Pour une Preview testée sur une autre base, renseigne les trois variables de cette base pour la Preview.
3. Avant de publier le nouveau parcours, ouvre **Supabase → SQL Editor → New query** sur le projet cible. Si les lots précédents sont déjà appliqués, copie [lot-7-parcours.sql](sql/lot-7-parcours.sql), puis clique sur **Run**.
4. Publie le commit sur la branche Production de Vercel, habituellement `main`. Les commandes suivantes supposent que cette branche est bien `main` et que tu travailles dessus.

```powershell
git status --short
git add .github README.md package.json package-lock.json public/data scripts sql src test vercel.json
git diff --cached --stat
git commit -m "Fiabilise les quiz, le parcours et les données"
git pull --rebase origin main
git push origin main
```

5. Dans **Deployments**, attends que le nouveau commit soit marqué **Ready** pour **Production**. Ouvre [le site](https://global-macro-quiz.vercel.app/) et actualise avec **Ctrl+F5**. Vérifie `/module?id=d1` sans compte, puis termine une partie connecté et vérifie **Profil → Parties récentes**.
6. Lance une première collecte dans **GitHub → Actions → Données du jour → Run workflow** sur la branche par défaut. Le robot crée la branche `data-live` et y publie les instantanés. Vérifie `/donnees` et `/capitalisations` après le passage. Cette mise à jour se lit sans nouveau déploiement.

[Vercel et les déploiements Git](https://vercel.com/docs/git) · [Variables d’environnement Vercel](https://vercel.com/docs/environment-variables) · [Clés Supabase](https://supabase.com/docs/guides/getting-started/api-keys)

## Données et progression

- Le parcours propose les six grands modules à trois niveaux. Le [bilan du lot 7](docs/parcours-lot-7.md) donne les volumes de la banque, les règles de validation et la reprise des acquis. Le [script d’inventaire](sql/inventaire-banque-historique.sql) interroge la banque Supabase historique en lecture seule.
- L’examen blanc tire 20 questions corrigées de niveau intermédiaire ou avancé dans cette banque. La page indique les thèmes manquants si le tirage est impossible. Les signalements des comptes connectés sont consultables dans la table `question_reports` du projet Supabase.
- La reprise d’un quiz classique est disponible pendant quatre heures sur le même navigateur. Le chronomètre d’une question déjà démarrée continue de courir pendant l’interruption.
- Le défi quotidien utilise la date de Paris et le même jeu de questions pour les visiteurs et les comptes. Les cours, les mini-checks et les corrections immédiates restent accessibles selon le niveau du parcours.
- GitHub Actions contrôle toutes les sources chaque jour à 7 h 11 et 18 h 41, heure de Paris. En semaine, les séries de marché bénéficient de passages supplémentaires. Les horaires de GitHub et de publication des fournisseurs peuvent décaler la disponibilité.
- Les tableaux et les quiz lisent la même publication via `data-live`. Les tableaux ouverts cherchent une nouvelle publication toutes les deux minutes. Le code du site est déployé depuis la branche principale.
- Lors d’un échec de collecte, la dernière observation conserve sa date et son dernier contrôle réussi. Les questions restent utilisables tant que les deux dates passent le contrôle de fraîcheur. Les capitalisations en dollars indiquent la séance et le taux de change utilisé.
