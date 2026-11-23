# Audit et refonte du Parcours

## Où se trouvaient les contenus

- Les 22 modules étaient définis dans `src/lib/modules.ts`. Leurs notes de cours et leurs liens renvoyaient vers 12 chapitres TypeScript dans `src/lib/courses.ts`.
- Le mini-check tirait 3 questions et le quiz noté 10. La fonction `moduleQuestions` fabriquait des variantes par thème ou par formule. Plusieurs modules associaient ensuite toute la série à leur première catégorie, même quand une question traitait d’un autre thème.
- Le fichier invité `public/data/guest-questions.json` contenait 44 objets avec `id`, `category_id`, `difficulty`, `type`, `prompt`, `options`, `correct`, `tolerance_pct`, `explanation`, `wrong_explanations`, `source`, `kind` et `reference_date`. Le défi du jour partait de ce fichier.
- Supabase contenait une autre banque dans `public.questions`, interrogée pour les modes connectés. L’accès réseau à cette base était bloqué pendant l’audit. Les comptes ci-dessous couvrent les sources lisibles dans le dépôt. Le [script SQL d’inventaire](../sql/inventaire-banque-historique.sql) mesure les lignes de la base et repère les doublons et les entrées à revoir.
- Les instantanés `macro.json` et `market-caps.json` fournissaient les exercices datés, dont certains étaient marqués Débutant.

## Questions par catégorie et difficulté

Chaque cellule donne l’ancien nombre dans le fichier invité, puis le nombre dans la nouvelle banque commune. Les variantes de l’ancien Parcours sont chiffrées dans le tableau suivant. Les questions d’actualité et les séries infinies se calculent à l’ouverture et n’entrent pas dans le total.

| Catégorie | Débutant | Intermédiaire | Avancé | Expert |
|---|---:|---:|---:|---:|
| Calcul mental | 4 → 13 | 4 → 21 | 0 → 18 | 0 → 16 |
| Capitalisations | 4 → 12 | 3 → 14 | 0 → 8 | 0 → 8 |
| Marchés financiers | 3 → 10 | 2 → 12 | 0 → 22 | 0 → 20 |
| Banques centrales | 3 → 20 | 2 → 15 | 0 → 15 | 0 → 15 |
| Politique monétaire | 2 → 8 | 2 → 8 | 0 → 8 | 0 → 8 |
| Macroéconomie | 3 → 8 | 2 → 10 | 0 → 8 | 0 → 8 |
| Change | 2 → 11 | 2 → 15 | 0 → 15 | 0 → 15 |
| Matières premières | 2 → 11 | 1 → 15 | 0 → 15 | 0 → 15 |
| Ordres de grandeur | 2 → 8 | 1 → 8 | 0 → 8 | 0 → 9 |
| **Total** | **25 → 101** | **19 → 118** | **0 → 117** | **0 → 114** |

## Audit par module

Avant la refonte, les nombres indiquent des candidats à un tirage de 10. Un générateur mental échantillonnait 48 questions, avec répétitions possibles. Les scénarios calculés donnaient 8 variantes par formule. Le niveau se lit dans le préfixe, avec d pour Débutant, i pour Intermédiaire, a pour Avancé et e pour Expert.

| Module et sujet | Candidats avant | Questions après | Qualité du cours et questions à reclasser |
|---|---:|---:|---|
| d1 · Calcul mental | 48 | 13 | Trois familles, une demande de calcul sans définition préalable. Nombre exact variable selon le tirage. |
| d3 · Actions et obligations | 24 | 10 | 16 variantes bid-ask ou dividende en rendement trop tôt. 8 capitalisations d’un autre module. |
| d2 · Capitalisations | 24 + culture | 12 | 16 variantes de poids et d’EV trop tôt. Jusqu’à 2 questions conjoncturelles. |
| d5 · Macroéconomie | 24 | 16 | 24 variantes combinant taux réel, croissance réelle ou ratios avant la maîtrise des définitions. |
| d4 · Banques centrales | 16 | 28 | 16 variantes sur les points de base ou le corridor. Aucun item sur ce que sont la BCE et la Fed. |
| d6 · Change et matières premières | 24 | 22 | 8 taux croisés trop tôt et 8 prix du pétrole en euros avant la conversion inverse. |
| i1 · Variations et intérêts | 48 | 21 | Pool adapté dans l’ensemble. La répétition des mêmes familles dominait le quiz. |
| i2 · Capitalisations | 24 | 14 | 8 capitalisations élémentaires du Débutant et absence de QCM de culture dans le tirage. |
| i3 · Taux et obligations | 24 | 12 | 8 variantes de duration avancée. Les prérequis de cotation étaient peu visibles. |
| i4 · Politique monétaire | 24 | 23 | 8 règles de Taylor trop tôt. Peu de vocabulaire en contexte et aucun QCM institutionnel. |
| i5 · Macroéconomie | 24 | 18 | 8 surprises macroéconomiques plutôt Avancé ou Expert. Absence d’items de lecture des indices. |
| i6 · Change et matières premières | 24 | 30 | 8 conversions simples parfois à cheval sur le Débutant. Aucune question de pips ou de cotation. |
| a1 · Calcul mental | 48 | 18 | Pool généré sans inventaire fini. Les exercices isolés de marge ont été complétés par des contrôles d’échelle. |
| a2 · Taux et change | 24 | 38 | 8 taux réels simples et 8 parités couvertes difficiles sans transition. Pas de lecture des surprises. |
| a3 · Macro, actions et matières premières | 24 | 39 | 8 ratios dette/PIB plutôt Intermédiaire et 8 P&L expert. Pas de courbe de matières premières. |
| a4 · Duration et convexité | 24 | 11 | 0 famille à retirer. Les mêmes trois calculs étaient déclinés 8 fois chacun. |
| a5 · Options | 24 | 11 | 0 famille à retirer. Absence de définitions et de choix de couverture dans le quiz. |
| e1 · Calcul mental | 48 | 16 | Pool généré sans inventaire fini. Les raccourcis n’explicitaient pas assez les contrôles. |
| e2 · Courbe des taux | 24 | 10 | 8 pentes simples de niveau Intermédiaire. Aucun cas d’exposition par maturité. |
| e3 · Grecs et volatilité | 24 | 10 | 8 straddles à l’échéance déjà couverts en Avancé. Peu de scénarios à grecs combinés. |
| e4 · Macro, change et politique monétaire | 24 | 46 | 8 taux réels simples de niveau Intermédiaire. Aucune divergence ou lecture de communiqué. |
| e5 · Cas de desk | 24 | 32 | 8 estimations monoposte de niveau Avancé. Pas de spreads, ratios croisés ni risques de couverture. |

Les identifiants du Parcours sont conservés. Les actions et obligations (`d3`) précèdent désormais les capitalisations (`d2`). Les définitions de la macroéconomie (`d5`) précèdent les banques centrales (`d4`). Le changement préserve les validations enregistrées. Les chapitres sur les trois thèmes prioritaires existent désormais dans les quatre niveaux, et les liens d’entraînement de ces chapitres appliquent leur difficulté.

## Règles de tirage

| Mode | Avant | Après |
|---|---|---|
| Parcours | Variantes spécifiques à chaque module | Leçons et banque communes par module et par difficulté |
| Quick Quiz | Tirage aléatoire dans la base avec un possible ajout daté | Six premières questions Débutant, puis des questions Intermédiaire et une Avancé ou Expert |
| Training | Filtres sur la banque Supabase, avec cas spécial Capitalisations Débutant | Thème, difficulté et historique sur les mêmes identifiants pédagogiques |
| Mixed | Équilibrage par catégorie | Équilibrage par catégorie dans la banque commune |
| Daily | Sept questions invité et trois calculs générés | Dix questions déterministes par date de Paris, réparties en quatre Débutant, trois Intermédiaire, deux Avancé et une Expert |
| Challenge | Calcul éclair progressif, culture et ordres de grandeur sans filtre strict | Niveau choisi et type de question adaptés aux trois jeux |
| Weakness | Répétition espacée, puis thème faible, puis tirage quelconque | Révisions dues, puis thème et difficulté faibles, avec les questions de la banque commune |
| Test de niveau | Banque Supabase et calculs générés | Trois niveaux de la banque commune et calculs appliqués |
| Examen blanc | Banque Supabase | 20 questions de la banque commune, sept thèmes, niveaux Intermédiaire et Avancé |
| Calcul mental infini | Générateur par thème et série progressive | Même générateur avec un premier niveau simplifié et les exercices à deux étapes classés Intermédiaire |

## Retraits et réécritures

Les 44 identifiants invité ci-dessous sont sortis du tirage. Les lignes reprises ou reclassées ont de nouveaux identifiants pédagogiques. Dans les favoris, les entrées retirées signalent le retrait et restent supprimables. La banque Supabase historique conserve les données et les relations des anciennes parties.

| Identifiant ancien | Question | Résultat de l’audit |
|---|---|---|
| `guest:001` | 100 points de base valent combien de points de pourcentage ? | Remplacée par des conversions dans les deux sens en d1. |
| `guest:002` | Un indice passe de 80 à 100. Quelle variation en % ? | Reclassée en i1, calcul en deux étapes. |
| `guest:003` | Un indice est pondéré par la capitalisation totale, sans ajustement du flottant. Une société vaut 100 Md$ et l’indice totalise 2 000 Md$. Estime son poids en %. | Reclassée en i2, poids d’indice. Marge de 8 % conservée. |
| `guest:004` | 150 points de base valent combien de points de pourcentage ? | Reprise en d1, conversion exacte. |
| `guest:005` | Un taux de 3,1 % monte de 35 pb. Quel est le nouveau taux, en % ? | Reprise en i1, conversion puis addition. |
| `guest:006` | Dette publique de 2 800 Md€ pour un PIB de 2 000 Md€. Quel ratio dette/PIB, en % ? | Reclassée en i5 dans la macroéconomie. |
| `guest:007` | Calcule 2 400 / 6. | Reclassée en d1, division simple. |
| `guest:008` | Combien font 7 % de 900 ? | Reclassée en d1, pourcentage simple. |
| `guest:009` | Que signifie « Mid cap » ? | Reformulée en d2 avec la définition du terme. |
| `guest:010` | Vrai ou faux : la capitalisation boursière mesure ce que le marché estime que valent les fonds propres d’une entreprise. | Reformulée en d2, définition de la capitalisation. |
| `guest:011` | Quel indice représente les grandes valeurs allemandes ? | Reformulée en d2, repère sur le DAX. |
| `guest:012` | Dans quel pays se trouve le siège de Nestlé ? | Reformulée en d2, siège de Nestlé. |
| `guest:013` | Dans quel pays se trouve le siège d’Alibaba et de Tencent ? | Retirée, association de deux sièges sans notion nouvelle. |
| `guest:014` | Quel groupe pétrolier est coté à la bourse saoudienne (Tadawul) et figure parmi les plus grosses capitalisations mondiales ? | Remplacée en i2 par l’identification du groupe. Le classement change. |
| `guest:015` | Quel groupe de cosmétiques est français et membre du CAC 40 ? | Retirée, appartenance à l’indice non datée et doublon de la culture française. |
| `guest:016` | Que fait une banque centrale qui met en œuvre un programme d’assouplissement quantitatif (QE) ? | Reclassée en a2, mécanisme avancé de QE. |
| `guest:017` | Vrai ou faux : la BCE fixe un seul taux directeur pour toute la zone euro. | Remplacée en i4 par le choix d’un instrument. Formulation trop piégeuse au Débutant. |
| `guest:018` | Vrai ou faux : le resserrement quantitatif (QT) consiste à réduire la taille du bilan de la banque centrale. | Reclassée en a2, mécanisme de QT. |
| `guest:019` | Vrai ou faux : le « dot plot » de la Fed présente les évaluations individuelles des participants au FOMC sur le niveau approprié des fed funds. | Reformulée en i4, interprétation des projections. |
| `guest:020` | Sur quel indicateur des prix la Fed définit-elle son objectif de 2 % à long terme ? | Reprise en i4 après distinction PCE et IPC. |
| `guest:021` | Face à une inflation trop forte, que fait en général une banque centrale ? | Reformulée en d4, conditions explicites d’une hausse. |
| `guest:022` | Un taux d’intérêt nominal de 5 % et une inflation de 3 % : quel est le taux réel approximatif ? | Reclassée en i4, nominal et inflation sur le même horizon. |
| `guest:023` | Qu’est-ce que la règle de Taylor ? | Reclassée en a2 et e4, politique et règle conditionnelle. |
| `guest:024` | Quelles composantes le « core CPI » américain exclut-il ? | Reformulée en i4, il faut distinguer indice global et sous-jacent. |
| `guest:025` | Vrai ou faux : la désinflation correspond à une baisse générale des prix. | Reformulée en d5 avec des prix qui montent plus lentement. |
| `guest:026` | Que mesure le PIB ? | Reformulée en d5, définition de la production finale. |
| `guest:027` | Le PIB nominal d’un pays progresse de 5 % et ses prix (déflateur du PIB) de 2 %. Quelle est la croissance réelle approximative ? | Reclassée en i5, PIB nominal et déflateur. |
| `guest:028` | Quelles valeurs de référence les traités européens fixent-ils pour le déficit et la dette des administrations publiques ? | Reprise en i5 après distinction dette et déficit. |
| `guest:029` | Vrai ou faux : l’IPCH (HICP) est l’indice d’inflation harmonisé utilisé en Europe. | Reformulée en i5, comparaison à méthodologie harmonisée. |
| `guest:030` | Que signifie une dépréciation de l’euro face au dollar ? | Remplacée en d6 par la lecture directe du sens de variation. |
| `guest:031` | EUR/USD passe de 1,05 à 1,10. Que s’est-il passé ? | Reformulée en d6 avec la convention de cotation. |
| `guest:032` | Quelle paire de devises est surnommée « cable » ? | Reclassée en i6 avec le vocabulaire de desk. |
| `guest:033` | EUR/USD = 1,10 et USD/JPY = 150. Combien de yens vaut un euro (EUR/JPY) ? | Reprise en i6, taux croisé et unités explicites. |
| `guest:034` | Vrai ou faux : une hausse du prix du pétrole contribue en général à une hausse de l’inflation. | Reclassée en i6, transmission du brut à l’inflation. |
| `guest:035` | Quelle est l’unité de prix du pétrole ? | Reprise en d6, l’unité fait partie des premières notions. |
| `guest:036` | Quel est le point de livraison de référence du pétrole WTI ? | Reprise en i6, livraison du contrat WTI. |
| `guest:037` | Qu’est-ce que le spread bid-ask ? | Reclassée en i3, bid et ask à définir avant le spread. |
| `guest:038` | Qu’est-ce qu’un dividende ? | Reprise en d3, définition du dividende. |
| `guest:039` | Si le rendement exigé monte, que devient le prix d’une obligation à flux fixes, toutes choses égales par ailleurs ? | Reclassée en i3, prix et rendement à relier. |
| `guest:040` | Qu’est-ce qu’un call ? | Reclassée en a5, premier module de dérivés. |
| `guest:041` | Un put de strike 50 sur une action qui vaut 42 à l’échéance. Quelle valeur à l’échéance (hors prime), en $ ? | Reclassée en a5 avec mise en regard du payoff et de la prime. |
| `guest:042` | Combien de millions dans 1 milliard ? | Reprise en d1 et d5, conversion d’unités de base. |
| `guest:043` | Un réseau dessert 200 villes de 50 000 habitants chacune, sans double comptage. Combien de millions d’habitants couvre-t-il ? | Remplacée en d5 par une multiplication et une unité simple. |
| `guest:044` | Environ combien d’habitants compte la planète, en milliards ? | Retirée, estimation de population non datée. Les estimations du cours utilisent des hypothèses fournies. |

Autres scénarios sortis du tirage sous leur forme précédente.

- Le corridor de taux disparaît du Débutant et devient un calcul Intermédiaire avec des chiffres fictifs.
- Le bid-ask, le rendement d’un dividende, le taux réel et la croissance réelle passent en Intermédiaire. Le taux croisé rejoint le premier module FX qui enseigne les unités.
- Les générateurs de poids du flottant et de valeur d’entreprise sortent des capitalisations Débutant. Ils reparaissent aux niveaux qui les enseignent.
- Les variantes de calcul redondantes de pente en Expert, de straddle à l’échéance en Expert et de ratio dette/PIB en Avancé cèdent la place à un risque par échéance, aux grecs combinés et aux chocs macroéconomiques.
- Les classements, taux de chômage, taux de change et cours du jour sortent du Débutant. L’estimation de la capitalisation d’Apple et les autres questions datées restent accessibles à partir d’Intermédiaire.
- Les noms et décisions récents des banques centrales sont présentés sous forme de publications datées dans le cours Intermédiaire. Les taux du jour continuent de provenir des collectes vérifiées.
- La question d’entretien sur la volatilité des puts sort de la fiche Capitalisations. Le sujet relève du cours sur les dérivés.

## Vérifier la base historique dans Supabase

1. Ouvre **Supabase → SQL Editor → New query**.
2. Colle le contenu de [l’inventaire SQL](../sql/inventaire-banque-historique.sql).
3. Clique sur **Run**. Les trois résultats donnent les effectifs, les doublons exacts d’énoncé et les lignes à examiner pour les données variables en Débutant.
4. Pour activer les nouveaux tirages, déploie le code après validation. Les lots Supabase 1, 4 et 5 en place suffisent. Le contenu est versionné dans `src/lib/curriculum`, et les identifiants `course:…` alimentent les révisions et statistiques via les RPC existantes.

## Sources de vérification

- Stratégie de politique monétaire et instruments de la zone euro. [BCE](https://www.ecb.europa.eu/mopo/strategy/strategy-review/ecb.strategyreview202506_strategy_statement.en.html)
- Objectifs américains, fonctionnement du FOMC et prise de fonction de Kevin Warsh. [Objectifs de la Fed](https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm) · [FOMC](https://www.federalreserve.gov/monetarypolicy/fomc.htm) · [Communiqué du 22 mai 2026](https://www.federalreserve.gov/newsevents/pressreleases/other20260522a.htm)
- Décision de taux et annonce de départ datées. [BCE, 29 octobre 2026](https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html) · [Compte rendu du Conseil](https://www.ecb.europa.eu/press/govcdec/otherdec/2026/html/ecb.gc261030~e40f864093.en.html)
- Marché des changes et base de financement. [Enquête 2025 de la BRI](https://www.bis.org/media-releases/20250930-global-fx-trading-hits-96-trillion-day-april-2025-and-otc-interest-rate-derivatives-surge-79) · [Parité couverte et base](https://www.bis.org/publ/qtrpdf/r_qt1609e.htm)
- Contrats pétroliers et courbe à terme. [CME, livraison WTI](https://www.cmegroup.com/education/courses/introduction-to-crude-oil/crude-oil-fundamentals/delivery-of-wti-futures) · [CME, spreads calendaires](https://www.cmegroup.com/articles/whitepapers/trading-energy-calendar-spread-options.html)
