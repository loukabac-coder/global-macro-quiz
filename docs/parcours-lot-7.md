# Global Macro Quiz · Parcours à six modules

## Inventaire

Le départ comptait 21 fiches, 22 étapes historiques et 450 questions versionnées. La banque active comprend 1 203 questions éditoriales et 122 variantes paramétrées déjà matérialisées, pour un total de 1 325 entrées. Le comptage porte sur les énoncés normalisés uniques et les identifiants uniques. Les questions d’actualité, de marché et de PIB dérivées des publications s’ajoutent à ces volumes.

| Module | Débutant avant → après | Intermédiaire avant → après | Avancé avant → après | Éditoriales après D / I / A |
|---|---:|---:|---:|---:|
| 01 Macroéconomie | 8 → 53 | 10 → 61 | 16 → 68 | 53 / 55 / 65 |
| 02 Banques centrales et taux directeurs | 28 → 53 | 23 → 56 | 46 → 73 | 53 / 56 / 70 |
| 03 Géopolitique et actualité économique | 0 → 51 | 0 → 52 | 0 → 52 | 51 / 52 / 52 |
| 04 Repères de marché | 34 → 85 | 34 → 85 | 40 → 91 | 85 / 81 / 91 |
| 05 Marchés financiers et produits | 10 → 76 | 22 → 90 | 78 → 147 | 76 / 80 / 113 |
| 06 Calcul mental et ordres de grandeur | 21 → 61 | 29 → 70 | 51 → 101 | 61 / 55 / 54 |

Les colonnes « avant » reclassent les anciennes questions par thème et regroupent l’ancien niveau Expert avec Avancé. La banque publiée utilise 1 071 familles comptées dans leur grand module. Le calcul mental renouvelle ses séries à partir de neuf thèmes de génération, dont les estimations guidées. Le fichier d’actualité embarqué a donné dix questions admissibles à la date du contrôle du 23 novembre 2026. Les volumes des autres questions datées dépendent des lignes admissibles dans la publication utilisée.

## Parcours et données Supabase

Les 29 sous-modules regroupent 163 pages de cours. Les 21 adresses de fiches historiques redirigent vers les pages correspondantes. La recherche indexe le texte, les formules et les tableaux. Le parcours propose 84 validations de sous-modules et 18 synthèses sur les trois niveaux. Une validation demande au moins 4 bonnes réponses sur 5 pour un sous-module et 6 sur 8 pour une synthèse. Les six synthèses d’un niveau ouvrent le suivant. Le test de niveau recommande une difficulté d’entraînement.

Les correspondances d’anciens acquis sont définies dans [program.ts](../src/lib/program.ts). Par exemple, `d5` couvre les sous-modules Débutant PIB et inflation. Les validations transférées affichent « Acquis repris ». Les réussites du [parcours antérieur](audit-parcours.md), dont celles des étapes `e1` et `e5`, restent consultables dans « Anciennes validations ». La réussite d’une nouvelle synthèse est inscrite à son propre identifiant.

La [migration Lot 7](../sql/lot-7-parcours.sql) adapte deux contraintes de `quiz_private.quiz_runs` pour accepter les séries de 5 et 8 questions et le chronomètre facultatif du calcul mental. Les RPC existants enregistrent les validations dans `public.module_progress`. Les profils, les sessions, les tentatives, l’XP, les favoris et les signalements restent dans leurs tables existantes. Les anciennes tentatives de dix questions restent valides.

## Mise en ligne

1. Ouvre Supabase, puis **SQL Editor → New query**. Colle le contenu du [Lot 7](../sql/lot-7-parcours.sql) et clique sur **Run**, une fois les Lots 1, 4, 5 et 6 appliqués.
2. Publie le code sur la branche principale quand tu veux lancer le déploiement Vercel. Après le déploiement, ouvre **Parcours** avec un compte et valide un quiz de cinq questions.
3. Sur GitHub, ouvre **Actions → Données du jour → Run workflow** et sélectionne la branche principale. Les étapes Capitalisations, Indicateurs macro et Actualité montrent les sources contrôlées dans leurs journaux.
4. Ouvre **Données** et **Capitalisations**. Vérifie les dates de séance ou de période, le dernier contrôle et les séries signalées. Les jeux en cours gardent leurs données de départ. Les nouveaux tirages utilisent les données admissibles de `data-live`.

## Collecte quotidienne

Le [workflow](../.github/workflows/donnees-du-jour.yml) effectue deux passages complets par jour, à 7 h 11 et 18 h 41 en heure de Paris, y compris le week-end et les jours fériés. Des passages supplémentaires vérifient les séries de marché en semaine.

- `scripts/update_macro.py` vérifie notamment les données de la BCE, de la Fed, du BLS, d’Eurostat, de l’EIA et de la Banque mondiale. Il contrôle le PIB nominal de 12 économies. L’or et le cuivre des contrats à terme sont suivis séparément du prix moyen mensuel du cuivre publié par le FMI via FRED.
- `scripts/update_market_caps.py` collecte les estimations de capitalisation par entreprise. Les estimations utilisent le cours et le nombre de titres du fournisseur. Les rangs comparent les observations d’une même séance en dollars américains. Les autres entreprises du périmètre peuvent rester visibles avec leur propre date.
- `scripts/update_news.py` vérifie les communiqués du Conseil de l’UE et du Canada ainsi que cinq fonctions en poste sur les sites des institutions concernées. Les questions utilisent des faits publiés, avec leur contexte et un lien vers la source. L’actualité de pays ou institutions hors de ces flux dépend de l’enrichissement éditorial.

Un échec transitoire conserve la dernière date de vérification réussie. Une donnée de marché sans contrôle réussi depuis plus de 48 heures sort des nouveaux quiz. Au-delà de l’horizon de validité de l’observation, un nouveau contrôle de la même valeur ne suffit pas à la rendre admissible. La date exacte de publication apparaît lorsqu’elle est disponible auprès du fournisseur. Une observation inchangée peut rester admissible si elle est encore dans son horizon de publication.
