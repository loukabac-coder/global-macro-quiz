import { curriculumChapters } from "@/lib/curriculum/chapters";
import type { LevelId } from "@/lib/modules";

// Contenu du Cours. Notions durables uniquement : les chiffres qui bougent
// (classements, niveaux de taux, cours) sont dans les questions datées et la page Capitalisations.

export type Section = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  formulas?: string[];
  example?: string;
  table?: { head: string[]; rows: string[][] };
};

export type Chapter = {
  slug: string;
  category: string;
  code: string;
  title: string;
  level: string;
  difficulty?: LevelId;
  sources?: { label: string; url: string }[];
  intro: string;
  sections: Section[];
  remember: string[];
  interview?: string[];
};

const referenceChapters: Chapter[] = [
  // ------------------------------------------------------------------ CALCUL MENTAL
  {
    slug: "calcul-mental",
    category: "mental-math",
    code: "H",
    title: "Calcul mental",
    level: "À commencer par là",
    intro:
      "Commence par multiplier, diviser et lire un pourcentage. Les sections suivantes traitent les variations successives, les intérêts composés, les conversions et les ordres de grandeur.",
    sections: [
      {
        title: "1. Les pourcentages en trois gestes",
        paragraphs: ["Le signe % veut dire pour cent. 10 % = 10 / 100. Pour diviser par 8, divise trois fois par 2 : 1 000 → 500 → 250 → 125."],
        bullets: [
          "10 % : on décale la virgule d’un rang. 10 % de 350 = 35.",
          "1 % : on décale de deux rangs. 1 % de 4 200 = 42.",
          "50 % = la moitié, 25 % = un quart, 20 % = un cinquième, 75 % = trois quarts, 12,5 % = un huitième.",
          "Tout le reste s’obtient par addition : 15 % = 10 % + 5 %, 35 % = 3 × 10 % + 5 %, 17 % = 10 % + 5 % + 2 × 1 %.",
          "Astuce de symétrie : x % de y = y % de x. 4 % de 50 = 50 % de 4 = 2.",
        ],
        example: "15 % de 80 : 10 % = 8, 5 % = 4, donc 12.",
      },
      {
        title: "2. Appliquer une hausse ou une baisse",
        bullets: [
          "Hausse de x % : on multiplie par (1 + x). +5 % → × 1,05. Baisse de x % : on multiplie par (1 − x). −25 % → × 0,75.",
          "Retrouver le prix de départ : on divise. Un prix de 210 après +5 % valait 210 / 1,05 = 200.",
          "Piège classique : retirer 20 % d’un prix qui a augmenté de 20 % ne redonne pas le prix de départ.",
        ],
        formulas: [
          "Prix final = prix initial × (1 + variation)",
          "Prix initial = prix final / (1 + variation)",
        ],
      },
      {
        title: "3. Les variations se multiplient",
        paragraphs: [
          "+10 % puis −10 % donne 1,10 × 0,90 = 0,99, soit −1 %. Plus la baisse est forte, plus la hausse nécessaire pour revenir au départ est grande.",
        ],
        table: {
          head: ["Baisse subie", "Hausse nécessaire pour revenir"],
          rows: [["−10 %", "+11,1 %"], ["−20 %", "+25 %"], ["−33,3 %", "+50 %"], ["−50 %", "+100 %"], ["−75 %", "+300 %"]],
        },
        formulas: ["Hausse nécessaire = x / (1 − x)    (x = la baisse, ici −50 % → 0,5 / 0,5 = +100 %)", "Baisse qui annule une hausse y : y / (1 + y)    (+50 % → 0,5 / 1,5 = 33,3 %)"],
      },
      {
        title: "4. Fractions utiles",
        table: {
          head: ["Fraction", "En %", "Fraction", "En %"],
          rows: [
            ["1/2", "50 %", "1/8", "12,5 %"],
            ["1/3", "33,3 %", "1/9", "11,1 %"],
            ["1/4", "25 %", "1/10", "10 %"],
            ["1/5", "20 %", "1/12", "8,3 %"],
            ["1/6", "16,7 %", "1/16", "6,25 %"],
            ["1/7", "14,3 %", "1/20", "5 %"],
          ],
        },
        bullets: ["Diviser par 8 = prendre 12,5 %. Diviser par 4 puis par 2.", "Un PER de 20 correspond à 5 % de rendement des bénéfices (1/20). Un PER de 25 → 4 %."],
      },
      {
        title: "5. Additions, soustractions, produits",
        bullets: [
          "Compenser : 47 + 38 = 47 + 40 − 2 = 85. 250 − 175 : on monte de 175 à 250, soit +75.",
          "Décomposer : 17 × 6 = 10 × 6 + 7 × 6 = 60 + 42 = 102.",
          "× 5 : × 10 puis ÷ 2. × 25 : × 100 puis ÷ 4. × 50 : × 100 puis ÷ 2. × 125 : × 1 000 puis ÷ 8.",
          "÷ 5 : × 2 puis ÷ 10. ÷ 25 : × 4 puis ÷ 100.",
          "× 9 : × 10 puis − le nombre. × 99 : × 100 puis − le nombre. × 11 : 17 × 11 = 170 + 17 = 187.",
          "Doubler / moitié : 16 × 35 = 8 × 70 = 4 × 140 = 560.",
        ],
      },
      {
        title: "6. Carrés et identités remarquables",
        formulas: [
          "(a + b)² = a² + 2ab + b²      52² = 2 500 + 200 + 4 = 2 704",
          "(a − b)² = a² − 2ab + b²      99² = 10 000 − 200 + 1 = 9 801",
          "(a − b)(a + b) = a² − b²      98 × 102 = 10 000 − 4 = 9 996",
          "n5² : n × (n + 1), puis on écrit 25      45² → 4 × 5 = 20 → 2 025",
        ],
        table: {
          head: ["n", "n²", "n", "n²", "n", "n²"],
          rows: [
            ["11", "121", "17", "289", "23", "529"],
            ["12", "144", "18", "324", "24", "576"],
            ["13", "169", "19", "361", "25", "625"],
            ["14", "196", "20", "400", "30", "900"],
            ["15", "225", "21", "441", "35", "1 225"],
            ["16", "256", "22", "484", "40", "1 600"],
          ],
        },
        bullets: ["Produit de deux nombres symétriques autour d’un nombre rond : 19 × 21 = 20² − 1 = 399 ; 48 × 52 = 50² − 4 = 2 496."],
      },
      {
        title: "7. Racines et puissances utiles",
        table: {
          head: ["Valeur", "Approximation", "Valeur", "Approximation"],
          rows: [
            ["√2", "1,414", "2¹⁰", "1 024 (≈ 1 000)"],
            ["√3", "1,732", "2⁸", "256"],
            ["√5", "2,236", "2²⁰", "≈ 1 million"],
            ["√10", "3,162", "10³ / 10⁶ / 10⁹", "mille / million / milliard"],
            ["√12", "3,46", "√252", "15,87 (≈ 16)"],
          ],
        },
        bullets: [
          "Conversion de volatilité : annuelle → journalière = ÷ √252 ≈ ÷ 16. Annuelle → mensuelle = ÷ √12 ≈ ÷ 3,5. Annuelle → hebdomadaire = ÷ √52 ≈ ÷ 7,2.",
          "ln 2 ≈ 0,693 ; ln 10 ≈ 2,30. (1 + r)ⁿ ≈ 1 + n × r quand r est petit.",
        ],
      },
      {
        title: "8. Intérêts, doublements, composition",
        formulas: [
          "Règle de 72 : temps de doublement ≈ 72 / taux en %      (à 6 % → 12 ans ; à 4 % → 18 ans ; à 3 % → 24 ans)",
          "Intérêt simple = capital × taux × durée en années",
          "Valeur future = capital × (1 + taux)ⁿ",
          "Composition rapide sur 2 ans : (1 + a)² ≈ 1 + 2a + a²      7 % sur 2 ans : 7 + 7 + 0,49 = 14,49 %",
        ],
        example: "5 % pendant 10 ans : 1,05¹⁰ ≈ 1,63, soit environ +63 % (et non +50 %).",
      },
      {
        title: "9. Points de base, P&L, change",
        bullets: [
          "1 point de base (pb ou bp) = 0,01 %. 100 pb = 1 %. 25 pb = 0,25 %.",
          "P&L = quantité × variation de prix. 12 000 actions × 0,35 $ = 4 200 $.",
          "Perte en % sur une position : 5 M€ × 0,3 % = 15 000 €.",
          "Coût d’un spread : notionnel × spread. 8 M€ × 125 pb = 8 M€ × 1,25 % = 100 000 €.",
          "Change : devise de base → devise cotée, on multiplie par le cours. Dans l’autre sens, on divise. EUR/USD = 1,08 : 1 000 € = 1 080 $ ; 1 080 $ = 1 000 €.",
          "Si l’euro prend x %, le dollar perd x / (1 + x). L’euro +10 % → le dollar −9,09 %.",
        ],
      },
      {
        title: "10. Ratios financiers de tête",
        formulas: [
          "PER = cours / bénéfice par action = capitalisation / bénéfice net",
          "Rendement des bénéfices = 1 / PER",
          "Rendement du dividende = dividende / cours      3 $ / 75 $ = 4 %",
          "Marge nette = résultat net / chiffre d’affaires      12,5 % de 480 M€ = 60 M€",
          "Prix d’un zéro coupon à 1 an = 100 / (1 + taux)      100 / 1,05 ≈ 95,24",
        ],
      },
      {
        title: "11. Ordres de grandeur et estimation",
        bullets: [
          "1 million = 10⁶, 1 milliard (Md) = 10⁹, 1 billion = 10¹² (en anglais : trillion). 1 000 Md = 1 000 milliards = 1 billion (T).",
          "Arrondir d’abord, corriger ensuite : 4,8 × 21 ≈ 5 × 20 = 100 ; la vraie valeur (100,8) est tout près.",
          "Donner un résultat avec un ordre de grandeur et une marge d’erreur plutôt qu’un faux chiffre précis.",
          "Toujours vérifier la cohérence : un PER de 2 000 ou un rendement de 80 % est presque toujours une erreur de virgule.",
        ],
      },
    ],
    remember: [
      "On calcule par addition de pourcentages simples (10 %, 5 %, 1 %).",
      "Les variations se multiplient : +10 % puis −10 % = −1 %. −50 % exige +100 %.",
      "Les identités remarquables transforment un produit difficile en calcul facile.",
      "100 pb = 1 %. Règle de 72 pour les doublements. 1/PER = rendement des bénéfices.",
      "Annuel → journalier : ÷ 16 (√252). Annuel → mensuel : ÷ 3,5 (√12).",
    ],
    interview: [
      "« Un titre perd 20 %, de combien doit-il remonter ? » → 25 %.",
      "« 17 × 23 ? » → 20² − 3² … ou 17 × 20 + 17 × 3 = 340 + 51 = 391.",
      "« Combien font 8 % de 625 ? » → 50 (1 % = 6,25).",
      "Les entretiens de marché testent la vitesse et la méthode : explique ton raisonnement à voix haute.",
    ],
  },

  // ------------------------------------------------------------------ CAPITALISATIONS
  {
    slug: "capitalisations",
    category: "market-caps",
    code: "I",
    title: "Capitalisations boursières",
    level: "Débutant à Expert",
    intro: "Commence par le prix d’une action et le nombre d’actions. Poursuis avec la pondération, la valeur d’entreprise et le risque de concentration. Les classements et les estimations datés se trouvent sur la page Capitalisations.",
    sections: [
      {
        title: "1. Définition",
        formulas: [
          "Capitalisation = cours de l’action × nombre d’actions en circulation",
        ],
        example: "Une action cote 50 $ et l’entreprise a 2 milliards d’actions. Sa capitalisation vaut 100 milliards de dollars.",
        paragraphs: [
          "Le prix d’une action seul ne dit rien de la taille d’une entreprise : une action à 500 $ avec 200 M d’actions (100 Md$) est plus petite qu’une action à 50 $ avec 10 Md d’actions (500 Md$).",
        ],
      },
      {
        title: "2. Capitalisation, valeur d’entreprise et valeur comptable",
        bullets: [
          "Capitalisation boursière : valeur de marché des fonds propres (ce que valent les actionnaires).",
          "La valeur d’entreprise estime la valeur des activités financées par les actionnaires et les prêteurs. Le calcul simplifié additionne capitalisation et dette nette. Selon le périmètre, on ajuste aussi les intérêts minoritaires ou les actions de préférence.",
          "Valeur comptable : fonds propres dans les comptes de l’entreprise. Le ratio cours / valeur comptable (P/B) compare les deux.",
        ],
        formulas: ["EV = capitalisation + dette − trésorerie (+ minoritaires)", "EV / EBITDA : multiple très utilisé en valorisation"],
        example: "La capitalisation vaut 100, la dette 30 et la trésorerie 10 dans la même unité. L’EV simplifiée vaut 120. Avec un EBITDA de 12, le multiple vaut 10.",
      },
      {
        title: "3. Flottant et classes d’actions",
        bullets: [
          "Flottant (free float) : part des actions réellement négociables, hors actionnaires stables (État, familles fondatrices).",
          "La plupart des indices utilisent la capitalisation flottante : elle reflète ce que les investisseurs peuvent vraiment acheter.",
          "Certaines entreprises ont plusieurs classes d’actions (Alphabet : GOOGL et GOOG ; Berkshire : classes A et B). La capitalisation totale additionne toutes les classes ; selon la source, on peut ne voir qu’une classe.",
          "Les ADR sont des certificats qui permettent d’acheter une action étrangère sur une bourse américaine.",
        ],
      },
      {
        title: "4. Tailles d’entreprises",
        table: {
          head: ["Catégorie", "Exemple de convention de taille"],
          rows: [["Mega cap", "plus de 200 Md$"], ["Large cap", "plus de 10 Md$"], ["Mid cap", "environ 2 à 10 Md$"], ["Small cap", "environ 300 M$ à 2 Md$"], ["Micro cap", "moins de 300 M$"]],
        },
        paragraphs: ["Ces seuils sont des conventions qui varient selon les fournisseurs d’indices et évoluent avec le temps."],
      },
      {
        title: "5. Comment les indices pondèrent",
        table: {
          head: ["Indice", "Pondération"],
          rows: [
            ["S&P 500", "capitalisation flottante"],
            ["Nasdaq 100", "capitalisation (modifiée)"],
            ["MSCI World", "capitalisation flottante"],
            ["CAC 40", "capitalisation flottante"],
            ["Euro Stoxx 50", "capitalisation flottante (plafonnée)"],
            ["Dow Jones", "prix des actions (price-weighted)"],
          ],
        },
        bullets: [
          "Dans un indice pondéré par la capitalisation, quelques géantes peuvent peser une très grande part : c’est le risque de concentration.",
          "Dow Jones : une action chère pèse plus, même si l’entreprise est petite.",
        ],
        formulas: ["Poids dans un indice = capitalisation retenue de l’entreprise / total des capitalisations retenues"],
        example: "Une valeur ajustée de 100 Md$ pour un total de 10 000 Md$ pèse 1 %.",
      },
      {
        title: "6. Ce qui fait bouger une capitalisation",
        bullets: [
          "Le cours de l’action (résultats, taux, anticipations de croissance).",
          "Le nombre d’actions : émissions, rachats d’actions, scissions.",
          "Des taux d’actualisation plus bas peuvent augmenter la valeur des bénéfices futurs. Leur effet dépend aussi des anticipations de bénéfice et du risque.",
          "Les opérations : fusions, introductions en bourse, sorties de cote.",
        ],
      },
      {
        title: "7. Repères structurels",
        bullets: [
          "La répartition par pays d’un indice pondéré par capitalisation évolue avec les cours et la composition. La fiche du MSCI World donne le poids de chaque pays à une date indiquée.",
          "Les « Magnificent Seven » : Apple, Microsoft, Alphabet, Amazon, Nvidia, Meta, Tesla.",
          "En Europe, les grandes capitalisations se répartissent entre luxe, santé, technologies, finance et énergie.",
          "Pour comparer les valeurs suivies ou estimer la capitalisation de Nvidia, utilise la date d’observation affichée sur la page Capitalisations.",
        ],
      },
    ],
    remember: [
      "Capitalisation = cours × nombre d’actions. EV = capitalisation + dette nette.",
      "Les indices les plus suivis pondèrent par la capitalisation flottante ; le Dow Jones par le prix.",
      "Un classement se date toujours, il périme vite : on consulte la page du jour.",
    ],
    interview: [
      "« Quelle est la différence entre capitalisation et valeur d’entreprise ? »",
      "« Pourquoi une action à 500 $ n’est-elle pas forcément plus chère qu’une à 50 $ ? »",
      "« Quel est le risque de concentration du S&P 500 ? »",
    ],
  },


  // ------------------------------------------------------------------ POLITIQUE MONETAIRE
  {
    slug: "politique-monetaire",
    category: "monetary-policy",
    code: "B",
    title: "Politique monétaire",
    level: "Intermédiaire",
    intro:
      "Comment une décision de taux se transmet à l’économie, comment on lit la courbe des taux et comment on évalue si une politique est restrictive ou accommodante.",
    sections: [
      {
        title: "1. Taux nominal, taux réel, inflation anticipée",
        formulas: [
          "Taux réel ≈ taux nominal − inflation",
          "Exact (Fisher) : 1 + taux réel = (1 + taux nominal) / (1 + inflation)",
          "Inflation anticipée (point mort, breakeven) = taux nominal − taux réel d’une obligation indexée",
        ],
        example: "Taux 5 %, inflation 3 % : taux réel ≈ 2 % (1,94 % en exact). Obligation nominale à 4 %, indexée à 1,8 % : inflation anticipée ≈ 2,2 %.",
      },
      {
        title: "2. Taux neutre et orientation de la politique",
        bullets: [
          "Le taux neutre (r*) est le taux réel qui n’accélère ni ne freine l’économie. Il n’est pas observable : on l’estime.",
          "Politique restrictive : taux réel au-dessus du neutre. Accommodante : en dessous.",
          "Plancher à zéro (zero lower bound) : quand les taux sont proches de zéro, la banque centrale passe aux QE, à la forward guidance ou à des taux légèrement négatifs.",
          "Piège de liquidité : situation où baisser les taux n’a plus d’effet sur la demande.",
        ],
      },
      {
        title: "3. La règle de Taylor",
        paragraphs: ["Formule qui suggère un taux directeur en fonction de l’inflation et de l’activité. C’est un repère, pas une obligation."],
        formulas: [
          "i = r* + π + 0,5 × (π − π*) + 0,5 × (écart de production)",
          "r* : taux réel neutre · π : inflation · π* : cible d’inflation",
        ],
        example: "r* = 2 %, π = 4 %, cible 2 %, écart de production +1 % : i = 2 + 4 + 0,5 × 2 + 0,5 × 1 = 7,5 %.",
      },
      {
        title: "4. Les canaux de transmission",
        bullets: [
          "Canal du taux d’intérêt : taux plus hauts → crédit plus cher → investissement et consommation en baisse.",
          "Canal du crédit : les banques prêtent moins et plus cher.",
          "Canal des prix d’actifs : actions et immobilier baissent, effet de richesse négatif.",
          "Canal du change : taux plus hauts → devise qui s’apprécie → importations moins chères, exportations pénalisées.",
          "Canal des anticipations : la crédibilité de la banque centrale ancre l’inflation anticipée.",
          "Les effets arrivent avec un retard de plusieurs trimestres.",
        ],
      },
      {
        title: "5. Courbe des taux",
        bullets: [
          "La courbe compare les rendements selon les maturités (2 ans, 5 ans, 10 ans, 30 ans).",
          "Normale : pentue vers le haut. Plate : taux courts ≈ taux longs. Inversée : taux courts > taux longs.",
          "L’inversion (par exemple 10 ans − 2 ans < 0) est historiquement associée à des récessions, avec un délai variable. C’est un signal, pas une certitude.",
          "Steepening : écart long − court qui augmente. Flattening : écart qui diminue.",
          "Les taux courts suivent surtout les anticipations de politique monétaire. Les taux longs ajoutent la croissance, l’inflation et une prime de terme.",
        ],
        formulas: ["Prime de terme = rendement long − moyenne anticipée des taux courts"],
      },
      {
        title: "6. Inflation : mesures et courbe de Phillips",
        bullets: [
          "IPC / IPCH : indice des prix à la consommation (IPCH harmonisé en Europe). PCE : indicateur préféré de la Fed.",
          "Inflation sous-jacente (core) : hors énergie et alimentation, moins volatile, plus utile pour la tendance.",
          "Courbe de Phillips : relation entre chômage bas et inflation plus forte, à court terme.",
          "Inflation importée, par la demande, par les coûts, spirale prix-salaires.",
          "Désinflation : l’inflation baisse mais reste positive. Déflation : les prix baissent.",
        ],
      },
      {
        title: "7. Taux interbancaires à connaître",
        table: {
          head: ["Devise", "Taux au jour le jour", "Autres repères"],
          rows: [["Euro", "€STR", "Euribor (3 mois, 6 mois)"], ["Dollar", "SOFR", "Fed funds effectif"], ["Livre", "SONIA", "Bank Rate"], ["Yen", "TONA", "—"]],
        },
        paragraphs: ["Le €STR a remplacé l’EONIA en 2022, après son lancement en 2019. Le LIBOR a été abandonné au profit de taux sans risque."],
      },
    ],
    remember: [
      "Taux réel = nominal − inflation. Breakeven = nominal − réel indexé.",
      "La politique monétaire agit avec un retard de plusieurs trimestres.",
      "Courbe inversée : signal de prudence, pas une certitude.",
      "Règle de Taylor : un repère de taux en fonction de l’inflation et de l’écart de production.",
    ],
    interview: [
      "« Que signifie une courbe des taux inversée ? »",
      "« Comment la Fed transmet-elle une hausse de taux à l’économie ? »",
      "« Qu’est-ce que le taux neutre ? »",
    ],
  },

  // ------------------------------------------------------------------ MACRO
  {
    slug: "macroeconomie",
    category: "macroeconomics",
    code: "C",
    title: "Macroéconomie",
    level: "Débutant",
    intro: "Les grands indicateurs qui résument l’état d’une économie, comment on les lit et comment ils influencent les marchés.",
    sections: [
      {
        title: "1. Le PIB",
        formulas: [
          "PIB = C + I + G + (X − M)",
          "C : consommation · I : investissement · G : dépenses publiques · X − M : exportations nettes",
          "PIB réel = PIB nominal corrigé de l’inflation (déflateur)",
        ],
        bullets: [
          "Le PIB mesure la production de biens et services sur le territoire, sur une période (trimestre, année).",
          "Croissance réelle ≈ croissance nominale − inflation.",
          "PIB potentiel : ce que l’économie peut produire sans créer de tensions sur les prix. Écart de production = PIB − PIB potentiel.",
          "PIB par habitant : niveau de vie moyen. À parité de pouvoir d’achat (PPA) : comparable entre pays.",
        ],
      },
      {
        title: "2. Inflation",
        bullets: [
          "Hausse générale et durable du niveau des prix. Un seul prix qui monte n’est pas de l’inflation.",
          "Se mesure par l’IPC (indice des prix à la consommation) : panier de biens et services d’un ménage moyen.",
          "L’inflation sous-jacente exclut énergie et alimentation, plus volatiles.",
          "Effet sur les marchés : inflation plus forte → taux plus hauts → obligations qui baissent, souvent pression sur les actions.",
        ],
      },
      {
        title: "3. Emploi et chômage",
        formulas: ["Taux de chômage = chômeurs / population active", "Taux d’emploi = personnes en emploi / population en âge de travailler"],
        bullets: [
          "Population active = personnes en emploi + chômeurs. Les inactifs (étudiants, retraités) n’en font pas partie.",
          "Le chômage est un indicateur retardé : il réagit après l’activité.",
          "NFP (Non-Farm Payrolls) : créations d’emplois mensuelles aux États-Unis, publiées le premier vendredi du mois, très suivies par les marchés.",
          "Loi d’Okun (règle empirique) : une hausse du chômage accompagne un ralentissement de la croissance.",
          "NAIRU : taux de chômage compatible avec une inflation stable.",
        ],
      },
      {
        title: "4. Cycle économique",
        bullets: [
          "Phases : expansion, pic, ralentissement ou récession, creux, reprise.",
          "Récession technique (convention courante) : deux trimestres consécutifs de baisse du PIB. Aux États-Unis, le NBER date les récessions avec un jugement plus large.",
          "Stagflation : croissance faible ou négative avec inflation élevée.",
          "Indicateurs avancés : enquêtes PMI, confiance des consommateurs, permis de construire, courbe des taux. Coïncidents : production industrielle. Retardés : chômage, inflation sous-jacente.",
          "PMI : enquête auprès des directeurs d’achat. Au-dessus de 50 = expansion ; en dessous = contraction.",
        ],
      },
      {
        title: "5. Finances publiques",
        bullets: [
          "Déficit public : dépenses − recettes de l’État sur l’année. La dette est l’accumulation des déficits.",
          "Le ratio dette/PIB est l’un des indicateurs de soutenabilité. Le protocole de Maastricht fixe deux valeurs de référence : déficit de 3 % du PIB et dette de 60 %.",
          "Multiplicateur keynésien : un euro de dépense publique génère plus d’un euro de PIB. Version simple : 1 / (1 − propension à consommer). Si 80 % des revenus sont consommés, multiplicateur théorique = 5.",
          "Stabilisateurs automatiques : impôts et prestations qui amortissent les chocs sans décision nouvelle.",
          "Effet d’éviction : l’emprunt public peut pousser les taux à la hausse et réduire l’investissement privé.",
          "Soutenabilité : la dette est stable si la croissance nominale dépasse le taux d’intérêt et que le déficit primaire est faible.",
        ],
      },
      {
        title: "6. Balance des paiements et commerce",
        bullets: [
          "Balance courante : balance commerciale + services + revenus + transferts. Un déficit se finance par des entrées de capitaux.",
          "Déficits jumeaux : déficit public et déficit courant qui évoluent ensemble.",
          "Termes de l’échange : prix des exportations / prix des importations.",
          "Droits de douane : ils renchérissent les importations, avec des effets sur l’inflation et le change.",
        ],
      },
      {
        title: "7. Indicateurs clés et calendrier",
        table: {
          head: ["Indicateur", "Fréquence", "À retenir"],
          rows: [
            ["Emploi américain (NFP)", "Mensuel", "Le plus suivi du mois"],
            ["IPC / IPCH", "Mensuel", "Inflation, décisions de taux"],
            ["PMI", "Mensuel", "Seuil de 50"],
            ["PIB", "Trimestriel", "Estimations successives"],
            ["Ventes au détail", "Mensuel", "Consommation"],
            ["Réunions des banques centrales", "6 à 8 par an", "Taux et communication"],
          ],
        },
      },
    ],
    remember: [
      "PIB = C + I + G + (X − M).",
      "Inflation = hausse générale des prix. IPC mesure, core exclut énergie et alimentation.",
      "Le chômage est retardé ; les PMI et la courbe des taux sont avancés.",
      "Maastricht : valeurs de référence de 3 % du PIB pour le déficit et 60 % pour la dette.",
    ],
    interview: [
      "« Pourquoi les marchés regardent-ils autant le NFP ? »",
      "« Quelle est la différence entre PIB nominal et réel ? »",
      "« Qu’est-ce que la stagflation ? »",
    ],
  },

  // ------------------------------------------------------------------ INFLATION
  {
    slug: "inflation",
    category: "macroeconomics",
    code: "C2",
    title: "Inflation",
    level: "Débutant",
    intro: "Ce qu’est l’inflation, comment on la mesure, d’où elle vient et pourquoi elle pilote les taux et les marchés.",
    sections: [
      {
        title: "1. Définition et mesure",
        bullets: [
          "Inflation : hausse générale et durable du niveau des prix. Le pouvoir d’achat de la monnaie baisse.",
          "On la mesure avec un indice des prix : on compare le prix d’un panier de biens et services d’une période à l’autre.",
          "Glissement annuel : variation sur 12 mois (le chiffre le plus cité). Glissement mensuel : variation d’un mois sur l’autre.",
          "Déflation : baisse générale des prix. Désinflation : l’inflation ralentit mais reste positive.",
        ],
        formulas: ["Inflation = (indice des prix aujourd’hui / indice il y a 12 mois) − 1", "Annualiser un mois : (1 + variation mensuelle)¹² − 1"],
        example: "Panier à 100 € il y a un an, 103 € aujourd’hui : inflation de 3 %. Une hausse de 0,25 % par mois donne (1,0025)¹² − 1 ≈ 3,04 % sur un an.",
      },
      {
        title: "2. Les principaux indices",
        table: {
          head: ["Indice", "Zone", "Détail"],
          rows: [
            ["IPC (CPI)", "États-Unis, Royaume-Uni, France (IPC national)", "Prix à la consommation d’un ménage moyen"],
            ["IPCH (HICP)", "Union européenne", "Version harmonisée, cible de la BCE"],
            ["PCE", "États-Unis", "Indicateur préféré de la Fed (cible 2 %)"],
            ["Déflateur du PIB", "Tous pays", "Prix de tout ce qui est produit dans le pays"],
            ["IPP (PPI)", "Tous pays", "Prix de production, en amont de la chaîne"],
          ],
        },
        bullets: [
          "Inflation sous-jacente (core) : hors énergie et alimentation, plus stable. Les banques centrales la regardent de près.",
          "Inflation totale (headline) : tout inclus, elle bouge beaucoup avec le pétrole et le gaz.",
        ],
      },
      {
        title: "3. D’où vient l’inflation",
        bullets: [
          "Par la demande : trop de demande par rapport à ce que l’économie peut produire (économie en surchauffe, écart de production positif).",
          "Par les coûts : hausse des coûts de production (énergie, matières premières, salaires) répercutée sur les prix.",
          "Importée : hausse des prix à l’étranger ou baisse de la monnaie, qui renchérit les importations.",
          "Spirale prix-salaires : les prix montent, les salaires suivent, les entreprises relèvent leurs prix.",
          "Anticipations : si chacun s’attend à de l’inflation, elle s’installe. D’où l’importance de la crédibilité de la banque centrale.",
          "Effet de base : le glissement annuel dépend aussi du niveau d’il y a un an. Un grand choc d’il y a 12 mois qui sort du calcul peut faire chuter l’inflation annuelle.",
        ],
      },
      {
        title: "4. Les cibles des banques centrales",
        bullets: [
          "BCE : 2 % à moyen terme (IPCH), symétrique. Fed : 2 % (PCE). Banque d’Angleterre : 2 % (IPC). Banque du Japon : 2 %.",
          "Les banques centrales ne visent pas 0 % : une inflation un peu positive laisse de la marge pour baisser les taux réels et évite la déflation.",
        ],
      },
      {
        title: "5. Effets économiques",
        bullets: [
          "Pouvoir d’achat : à 3 % d’inflation, 100 € ne valent plus que 97 € de biens au bout d’un an. À 2 %, les prix doublent en 36 ans (72 / 2).",
          "Gagnants : emprunteurs à taux fixe (la dette perd de la valeur en termes réels). Perdants : épargnants à taux fixe bas, créanciers.",
          "Taux réel : taux nominal − inflation. L’inflation inattendue fait baisser le rendement réel des obligations.",
          "Hyperinflation : plus de 50 % par mois, effondrement de la monnaie (Allemagne 1923, Zimbabwe, Venezuela).",
        ],
      },
      {
        title: "6. Inflation et marchés",
        bullets: [
          "Inflation plus forte que prévu → anticipations de hausse de taux → rendements obligataires qui montent, prix des obligations qui baissent.",
          "Les actions de croissance souffrent quand les taux montent (valeurs actuelles plus faibles).",
          "Le dollar a tendance à monter si la Fed relève ses taux plus que les autres.",
          "Obligations indexées sur l’inflation (TIPS aux États-Unis, OATi en France) : le capital suit l’inflation.",
          "Point mort d’inflation (breakeven) = taux nominal − taux réel : mesure l’inflation anticipée par le marché.",
          "Matières premières et or : parfois vus comme une protection contre l’inflation.",
        ],
      },
    ],
    remember: [
      "Inflation = hausse générale et durable des prix. Cible des grandes banques centrales : 2 %.",
      "Core exclut énergie et alimentation. IPCH = BCE, PCE = Fed.",
      "Taux réel = nominal − inflation. Breakeven = nominal − réel indexé.",
      "Plus d’inflation que prévu → plus de hausses de taux anticipées → obligations en baisse.",
    ],
    interview: [
      "« Pourquoi les banques centrales visent-elles 2 % et pas 0 % ? »",
      "« Qu’est-ce que l’effet de base ? »",
      "« Que se passe-t-il sur les marchés si l’inflation surprend à la hausse ? »",
    ],
  },



  // ------------------------------------------------------------------ OBLIGATIONS
  {
    slug: "obligations",
    category: "financial-markets",
    code: "F1",
    title: "Obligations et taux",
    level: "Intermédiaire",
    intro: "Prix, rendement, duration, courbe, spreads de crédit : le cœur du marché de taux.",
    sections: [
      {
        title: "1. Anatomie d’une obligation",
        bullets: [
          "Nominal (valeur faciale) : montant remboursé à l’échéance, souvent 100 en cotation.",
          "Coupon : intérêt payé périodiquement, en % du nominal.",
          "Échéance (maturité) : date de remboursement.",
          "Rendement actuariel (YTM) : taux de rendement si on conserve l’obligation jusqu’à l’échéance.",
          "Une obligation cote au pair si son prix est 100, au-dessus du pair si le coupon dépasse le rendement, en dessous du pair dans le cas inverse.",
        ],
      },
      {
        title: "2. Prix et rendement évoluent en sens inverse",
        formulas: ["Prix = Σ coupons / (1 + y)ᵗ + nominal / (1 + y)ⁿ"],
        example: "Obligation à 3 ans, coupon 4 % : si le rendement est 4 %, prix = 100. Si le rendement monte à 5 % : 4/1,05 + 4/1,05² + 104/1,05³ = 97,28. Les taux montent, le prix baisse.",
        paragraphs: ["Une obligation qui paie un ancien coupon plus faible vaut moins quand les nouveaux taux montent."],
      },
      {
        title: "3. Duration et convexité",
        bullets: [
          "Duration de Macaulay : durée moyenne pondérée des flux. Pour un zéro coupon, elle vaut l’échéance.",
          "Avec une capitalisation annuelle du rendement y, duration modifiée = duration de Macaulay / (1 + y). Elle mesure la sensibilité relative du prix au rendement.",
          "DV01 (ou PVBP) : variation de prix en valeur pour 1 pb de variation du rendement.",
          "La convexité corrige l’approximation linéaire de la duration. Elle est généralement positive pour une obligation à flux fixes sans option et dépend des flux et des options incorporées.",
        ],
        formulas: [
          "Variation du prix ≈ − duration modifiée × variation du rendement",
          "DV01 ≈ duration modifiée × prix × 0,0001",
        ],
        example: "Duration modifiée 7, rendement +50 pb : prix ≈ −7 × 0,5 % = −3,5 %.",
      },
      {
        title: "4. Les émetteurs",
        bullets: [
          "États : Bund (Allemagne), OAT (France), BTP (Italie), Bonos (Espagne), Treasuries (États-Unis), Gilts (Royaume-Uni), JGB (Japon).",
          "Entreprises : investment grade (notation BBB− ou plus) et haut rendement (high yield, en dessous).",
          "Bund à 10 ans : la référence sans risque de la zone euro. Treasury à 10 ans : la référence mondiale.",
          "Notation : AAA, AA, A, BBB (investment grade) ; BB, B, CCC… (spéculatif). Agences : S&P, Moody’s (Aaa, Aa…), Fitch.",
        ],
      },
      {
        title: "5. Spreads",
        bullets: [
          "Spread de crédit : écart de rendement entre un émetteur et la référence sans risque. Il s’élargit quand la peur monte.",
          "Spread souverain : par exemple OAT − Bund, BTP − Bund. Il mesure la prime de risque d’un pays de la zone euro.",
          "CDS (credit default swap) : assurance contre le défaut d’un émetteur. Le prix est un spread en pb.",
          "Un écartement des spreads est un signal de stress.",
        ],
        formulas: ["Rendement d’une obligation corporate = rendement sans risque + spread de crédit"],
      },
      {
        title: "6. Marché monétaire et repo",
        bullets: [
          "Marché monétaire : prêts et emprunts de très court terme (jusqu’à 1 an) : dépôts, bons du Trésor, billets de trésorerie.",
          "Repo : vente d’un titre avec engagement de le racheter plus tard ; équivaut à un prêt garanti par le titre. Le taux repo est le coût de ce financement.",
          "Swap de taux (IRS) : échange d’un taux fixe contre un taux variable. Sert à couvrir ou à prendre une vue sur les taux.",
        ],
      },
      {
        title: "7. Pourquoi les taux montent ou baissent",
        bullets: [
          "Anticipations de politique monétaire (taux courts).",
          "Inflation anticipée et croissance (taux longs).",
          "Offre de titres : déficits publics, QT.",
          "Demande : banques centrales, assureurs, fonds de pension, fuite vers la qualité en cas de stress.",
        ],
      },
    ],
    remember: [
      "Taux qui montent = prix des obligations qui baissent.",
      "Variation relative du prix ≈ − duration modifiée × variation du rendement exprimée en décimal.",
      "Spread = prime de risque. Il s’élargit quand le marché a peur.",
      "Notation : BBB− est la limite de l’investment grade.",
    ],
    interview: [
      "« Quelle est la duration de Macaulay d’un zéro-coupon à 5 ans ? » → 5 ans.",
      "« Effet de +100 pb de rendement avec une duration modifiée de 8, au premier ordre ? » → environ −8 %.",
      "« Qu’est-ce qu’un repo ? »",
    ],
  },

  // ------------------------------------------------------------------ ACTIONS
  {
    slug: "actions-et-indices",
    category: "financial-markets",
    code: "F2",
    title: "Actions, indices et valorisation",
    level: "Débutant",
    intro: "Ce qu’est une action, comment on la valorise, les grands indices et le fonctionnement des marchés.",
    sections: [
      {
        title: "1. L’action",
        bullets: [
          "Une action est une part de propriété d’une entreprise : droit de vote, droit au dividende, droit sur les bénéfices.",
          "Marché primaire : émission (introduction en bourse, IPO). Marché secondaire : échanges entre investisseurs.",
          "Dividende : part du bénéfice versée aux actionnaires. Rachat d’actions : l’entreprise rachète ses titres, ce qui réduit leur nombre.",
          "Ordres : au marché (exécuté tout de suite au prix disponible) ou à cours limité (prix maximal à l’achat, minimal à la vente).",
          "Bid / ask : meilleur prix d’achat et de vente ; l’écart est le spread, un coût de liquidité.",
        ],
      },
      {
        title: "2. Ratios de valorisation",
        formulas: [
          "PER = cours / bénéfice par action",
          "Rendement des bénéfices = 1 / PER",
          "Rendement du dividende = dividende / cours",
          "P/B = cours / valeur comptable par action",
          "EV / EBITDA = valeur d’entreprise / résultat d’exploitation avant amortissements",
          "ROE = résultat net / fonds propres",
        ],
        example: "Cours 90 $, bénéfice par action 6 $ : PER = 15. Rendement des bénéfices = 6,7 %. Dividende 3 $ : rendement 3,3 %.",
        paragraphs: ["Un PER élevé signifie que le marché anticipe de la croissance, ou que le titre est cher. Il se compare à d’autres entreprises du même secteur, pas au hasard."],
      },
      {
        title: "3. Valeur d’une action : actualisation",
        formulas: [
          "Modèle de Gordon : prix = dividende suivant / (r − g)",
          "r : rendement exigé par l’investisseur · g : croissance perpétuelle du dividende",
        ],
        example: "Dividende suivant 3 $, r = 8 %, g = 3 % : prix = 3 / 0,05 = 60 $.",
        bullets: [
          "Quand les taux baissent, r baisse : la valeur des entreprises de croissance monte beaucoup.",
          "CAPM : rendement attendu = taux sans risque + bêta × (rendement du marché − taux sans risque).",
          "Prime de risque actions : rendement supplémentaire exigé par rapport au taux sans risque.",
        ],
      },
      {
        title: "4. Risque et performance",
        formulas: ["Ratio de Sharpe = (rendement − taux sans risque) / volatilité", "Volatilité annuelle ≈ volatilité journalière × √252"],
        bullets: [
          "Volatilité : écart-type des rendements. Bêta : sensibilité au marché (bêta 1,2 = le titre bouge 20 % de plus que le marché).",
          "Drawdown : perte entre un sommet et un creux.",
          "Diversification : réduit le risque spécifique, pas le risque de marché.",
          "Value at Risk (VaR) : perte maximale à un niveau de confiance donné sur un horizon donné.",
        ],
      },
      {
        title: "5. Les grands indices",
        table: {
          head: ["Indice", "Contenu"],
          rows: [
            ["S&P 500", "500 grandes entreprises américaines, pondérées par la capitalisation flottante"],
            ["Dow Jones", "30 grandes valeurs américaines, pondération par les prix"],
            ["Nasdaq 100", "100 grandes valeurs non financières du Nasdaq, forte part de technologie"],
            ["CAC 40", "40 grandes valeurs cotées à Paris"],
            ["DAX", "40 grandes valeurs allemandes"],
            ["Euro Stoxx 50", "50 grandes valeurs de la zone euro"],
            ["FTSE 100", "100 grandes valeurs de la Bourse de Londres"],
            ["Nikkei 225", "225 valeurs japonaises, pondérées par les prix"],
            ["MSCI World", "grandes et moyennes capitalisations de pays développés"],
          ],
        },
        bullets: ["VIX : volatilité implicite du S&P 500 à 30 jours, souvent appelé « indice de la peur »."],
      },
      {
        title: "6. Les acteurs de la salle de marché",
        bullets: [
          "Sell-side : banques qui vendent des produits et du conseil (ventes, trading, recherche). Buy-side : investisseurs (gérants d’actifs, hedge funds, assureurs).",
          "Sales : relation avec les clients, transmission d’idées et de prix. Trader : prend des risques, fait les prix, gère un portefeuille. Structureur : conçoit des produits sur mesure.",
          "Market maker : cote à l’achat et à la vente en continu et gagne le spread.",
          "Front office : activités de marché ; middle office : risque et contrôle ; back office : règlement-livraison.",
        ],
      },
    ],
    remember: [
      "PER = cours / bénéfice ; rendement des bénéfices = 1 / PER.",
      "Prix d’une action = valeur actualisée des dividendes futurs : baisse des taux = hausse de la valeur.",
      "Dow Jones pondéré par les prix ; S&P 500 par la capitalisation flottante.",
      "Sharpe = (rendement − taux sans risque) / volatilité.",
    ],
    interview: [
      "« Pourquoi une baisse de taux soutient-elle les actions de croissance ? »",
      "« Un PER de 20 : que signifie-t-il ? » (1/20 = 5 % de rendement des bénéfices)",
      "« Différence entre sell-side et buy-side ? »",
    ],
  },

  // ------------------------------------------------------------------ DERIVES
  {
    slug: "derives",
    category: "financial-markets",
    code: "F3",
    title: "Produits dérivés et options",
    level: "Avancé",
    intro: "Forwards, futures, options, grecques et volatilité : le vocabulaire et les formules indispensables en salle de marché.",
    sections: [
      {
        title: "1. Forwards et futures",
        bullets: [
          "Forward : accord de gré à gré pour acheter ou vendre un actif à un prix fixé aujourd’hui, à une date future.",
          "Future : forward standardisé, négocié en bourse, avec appels de marge quotidiens et chambre de compensation.",
          "Utilité : couvrir un risque (producteur de pétrole, importateur) ou prendre une vue (spéculation) avec un faible capital de départ (effet de levier).",
        ],
        formulas: ["Prix à terme théorique = comptant × (1 + r) − revenus + coûts de stockage", "Pour une action : F = S × (1 + r) − dividendes"],
      },
      {
        title: "2. Options : les bases",
        bullets: [
          "Call : droit (pas l’obligation) d’acheter à un prix d’exercice (strike). Put : droit de vendre.",
          "Acheteur : paie la prime, perte limitée à la prime. Vendeur : encaisse la prime, risque potentiellement élevé.",
          "Européenne : exercice à l’échéance. Américaine : exercice à tout moment.",
          "Dans la monnaie (ITM), à la monnaie (ATM), en dehors de la monnaie (OTM).",
        ],
        formulas: [
          "Payoff d’un call à l’échéance = max(S − K ; 0)",
          "Payoff d’un put à l’échéance = max(K − S ; 0)",
          "Seuil de rentabilité d’un call acheté = K + prime",
        ],
        example: "Call de strike 100 acheté 4 : il gagne si l’action dépasse 104 à l’échéance. Perte maximale = 4.",
      },
      {
        title: "3. Valeur d’une option",
        bullets: [
          "Valeur = valeur intrinsèque + valeur temps.",
          "Valeur intrinsèque d’un call = max(S − K ; 0).",
          "Valeur temps : plus l’échéance est lointaine et la volatilité élevée, plus elle est grande ; elle tombe à zéro à l’échéance.",
          "Parité call-put (européennes) : C − P = S − K × e^(−rT).",
        ],
      },
      {
        title: "4. Les grecques",
        table: {
          head: ["Lettre", "Mesure", "Repère"],
          rows: [
            ["Delta", "Sensibilité au prix du sous-jacent", "Call : 0 à 1 ; put : −1 à 0 ; ATM ≈ 0,5"],
            ["Gamma", "Variation du delta", "Maximal à la monnaie, près de l’échéance"],
            ["Vega", "Sensibilité à la volatilité implicite", "Positif pour l’acheteur d’option"],
            ["Theta", "Érosion du temps", "Négatif pour l’acheteur"],
            ["Rho", "Sensibilité aux taux", "Souvent faible"],
          ],
        },
      },
      {
        title: "5. Volatilité",
        bullets: [
          "Volatilité historique : calculée sur les rendements passés. Volatilité implicite : déduite du prix des options, c’est l’anticipation du marché.",
          "VIX : volatilité implicite à 30 jours des options sur le S&P 500.",
          "Smile / skew : la volatilité implicite varie selon le strike ; les puts hors de la monnaie sont souvent plus chers, car les investisseurs achètent une protection.",
          "Conversion : annuel → journalier = ÷ √252 ; annuel → mensuel = ÷ √12.",
        ],
      },
      {
        title: "6. Swaps et stratégies simples",
        bullets: [
          "Swap de taux : échange d’un taux fixe contre un taux variable sur un notionnel.",
          "Swap de change, CDS, swap de matières premières.",
          "Covered call : détenir l’action et vendre un call (rendement supplémentaire, gain plafonné).",
          "Protective put : action + put acheté (assurance contre la baisse).",
          "Straddle : call + put de même strike ; pari sur un grand mouvement, quelle que soit la direction.",
        ],
      },
    ],
    remember: [
      "Call = droit d’acheter, put = droit de vendre. L’acheteur risque seulement la prime.",
      "Payoff call = max(S − K ; 0). Seuil de rentabilité = K + prime.",
      "Delta ≈ 0,5 pour une option à la monnaie ; vega positif pour l’acheteur ; theta négatif.",
      "Volatilité implicite : l’anticipation du marché, déduite du prix des options.",
    ],
    interview: [
      "« Quelle est la perte maximale d’un acheteur de call ? » → la prime.",
      "« Que mesure le delta ? »",
    ],
    sources: [{ label: "MSCI · méthode et pondérations du MSCI World", url: "https://www.msci.com/indexes/index/990100/msci-world-index" }],
  },

  // ------------------------------------------------------------------ GUESSTIMATES
  {
    slug: "guesstimates",
    category: "macro-guesstimates",
    code: "G",
    title: "Ordres de grandeur clés",
    level: "Intermédiaire",
    intro:
      "Estimer vite un ordre de grandeur (PIB, population, dette, marché). On n’a pas besoin de la valeur exacte, on vise le bon ordre de grandeur et une démarche claire.",
    sections: [
      {
        title: "1. La méthode",
        bullets: [
          "Décomposer : une grandeur = population × valeur par personne, ou volume × prix.",
          "Arrondir : travailler avec 1, 2, 3, 5, 10.",
          "Encadrer : donner une fourchette (entre 2 et 4 T$) plutôt qu’un chiffre unique.",
          "Vérifier la cohérence avec un autre chemin de calcul.",
          "Annoncer ses hypothèses à voix haute : le raisonnement compte autant que le résultat.",
        ],
        example: "PIB d’un pays ≈ population × PIB par habitant. 50 M d’habitants × 40 000 $ = 2 000 Md$ = 2 T$.",
      },
      {
        title: "2. Repères historiques",
        paragraphs: [
          "Ces repères arrondis concernent 2024–2025. La population, le PIB nominal en dollars et la consommation pétrolière dépendent respectivement des estimations de l’ONU, des comptes et taux de change, et du périmètre des liquides pétroliers.",
        ],
        table: {
          head: ["Grandeur", "Ordre de grandeur (2024-2025)"],
          rows: [
            ["Population mondiale", "environ 8,2 milliards"],
            ["Population Chine / Inde", "environ 1,4 milliard chacune"],
            ["Population États-Unis", "environ 340 millions"],
            ["Population Union européenne", "environ 450 millions"],
            ["Population France / Allemagne", "environ 68 M / 84 M"],
            ["PIB mondial", "environ 110 000 Md$ (110 T$)"],
            ["PIB États-Unis", "environ 29 T$"],
            ["PIB Chine", "environ 18 à 19 T$"],
            ["PIB Allemagne / Japon", "environ 4 à 5 T$ chacun"],
            ["PIB France", "environ 3 T$"],
            ["Demande mondiale de pétrole", "environ 100 mb/d"],
          ],
        },
      },
      {
        title: "3. Rapports utiles",
        bullets: [
          "Rapporte la dette publique au PIB nominal dans la même devise. Avec 2 800 Md€ de dette pour 2 000 Md€ de PIB dans un exemple fictif, le ratio vaut 140 %.",
          "Précise le périmètre quand tu compares les dépenses publiques au PIB. Le budget de l’État central et les dépenses de toutes les administrations ne couvrent pas les mêmes institutions.",
          "Une capitalisation se mesure à une date. Pour la rapporter au PIB, fixe la devise, l’année du PIB et le périmètre boursier.",
          "Le taux d’épargne des ménages rapporte leur épargne à leur revenu disponible. La consommation rapportée au PIB est un autre ratio.",
        ],
      },
      {
        title: "4. Exemples de raisonnement",
        bullets: [
          "Pour un pays fictif de 68 millions d’habitants et 2,3 personnes par foyer, estime 68 / 2,3 ≈ 30 millions de foyers.",
          "Dette à 100 % du PIB, taux moyen de 2 % : charge d’intérêts ≈ 2 % du PIB. À 4 % : 4 % du PIB.",
          "Un pays de 10 M d’habitants avec un PIB par habitant de 30 000 $ → PIB de 300 Md$.",
        ],
      },
      {
        title: "5. Conversions et hypothèses pratiques",
        table: {
          head: ["Grandeur", "Valeur"],
          rows: [
            ["Jours de bourse par an", "environ 252"],
            ["Jours de bourse par mois", "environ 21"],
            ["Semaines par an", "52"],
            ["Heures par an", "8 760 (365 × 24)"],
            ["Secondes par an", "environ 31,5 millions (≈ 3 × 10⁷)"],
            ["1 milliard de secondes", "environ 32 ans"],
            ["1 baril de pétrole", "159 litres"],
            ["1 once troy d’or", "31,1 grammes"],
            ["1 point de base", "0,01 %"],
            ["1 T$", "1 000 Md$ = 1 000 000 M$"],
          ],
        },
      },
      {
        title: "6. Quelques raccourcis pour estimer",
        bullets: [
          "Si tu connais le PIB par habitant, multiplie-le par la population pour estimer le PIB total. Un revenu moyen des ménages mesure autre chose.",
          "Pour estimer un marché à plusieurs segments, calcule chaque volume × panier, puis additionne. Fais varier une hypothèse pour tester la sensibilité.",
          "Une dette de 100 % du PIB à 3 % de taux moyen coûte 3 % du PIB par an en intérêts.",
          "Une capitalisation de 1 T$ avec un PER de 25 correspond à 40 Md$ de bénéfices (1 000 / 25).",
          "Une volatilité annuelle de 16 % équivaut à environ 1 % par jour (16 / √252 ≈ 1).",
          "+1 % par jour pendant 252 jours multiplie par environ 12 : la composition grossit vite.",
        ],
      },
    ],
    remember: [
      "On décompose, on arrondit, on vérifie, on annonce ses hypothèses.",
      "Un bon ordre de grandeur vaut mieux qu’un chiffre faux et précis.",
      "Les repères chiffrés évoluent : on les date.",
    ],
    interview: [
      "« Estime le PIB de la France sans connaître le chiffre. »",
      "« Combien de verres de vin sont consommés en France en un an ? » (même méthode : population × consommation moyenne)",
    ],
    sources: [
      { label: "ONU · World Population Prospects 2024", url: "https://population.un.org/wpp/" },
      { label: "FMI · World Economic Outlook, avril 2025", url: "https://www.imf.org/en/publications/weo/weo-database/2025/april" },
      { label: "EIA · projections et consommation de produits pétroliers", url: "https://www.eia.gov/outlooks/steo/archives/Sep24.pdf" },
    ],
  },
];

const basics = ["calcul-mental", "actions-et-indices", "capitalisations", "inflation"];
export const CHAPTERS: Chapter[] = [
  ...basics.flatMap((slug) => referenceChapters.filter((chapter) => chapter.slug === slug)),
  ...curriculumChapters.filter((chapter) => chapter.difficulty === "beginner"),
  ...referenceChapters.filter((chapter) => !basics.includes(chapter.slug)),
  ...(["intermediate", "advanced", "expert"] as const).flatMap((level) =>
    curriculumChapters.filter((chapter) => chapter.difficulty === level)),
];

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}
