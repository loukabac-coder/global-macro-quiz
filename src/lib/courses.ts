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
  minutes: number;
  intro: string;
  sections: Section[];
  remember: string[];
  interview?: string[];
};

export const CHAPTERS: Chapter[] = [
  // ------------------------------------------------------------------ CALCUL MENTAL
  {
    slug: "calcul-mental",
    category: "mental-math",
    code: "H",
    title: "Calcul mental",
    level: "À commencer par là",
    minutes: 20,
    intro:
      "En salle de marché, on calcule vite, à peu près juste, sans calculatrice. Ce chapitre donne toutes les techniques utiles : pourcentages, produits, carrés, fractions, conversions et ordres de grandeur.",
    sections: [
      {
        title: "1. Les pourcentages en trois gestes",
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
        title: "4. Fractions à connaître par cœur",
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
    level: "Débutant",
    minutes: 15,
    intro:
      "La capitalisation sert à comparer la taille des entreprises et à pondérer les indices. Les classements changent chaque jour : les questions de ce chapitre sont alimentées par un robot qui met les chiffres à jour toutes les 24 heures (voir la page Capitalisations).",
    sections: [
      {
        title: "1. Définition",
        formulas: [
          "Capitalisation = cours de l’action × nombre d’actions en circulation",
          "Poids dans un indice = capitalisation de l’entreprise / capitalisation totale de l’indice",
        ],
        example: "Cours 50 $, 2 Md d’actions : capitalisation 100 Md$. Dans un indice de 10 000 Md$, elle pèse 1 %.",
        paragraphs: [
          "Le prix d’une action seul ne dit rien de la taille d’une entreprise : une action à 500 $ avec 200 M d’actions (100 Md$) est plus petite qu’une action à 50 $ avec 10 Md d’actions (500 Md$).",
        ],
      },
      {
        title: "2. Capitalisation, valeur d’entreprise et valeur comptable",
        bullets: [
          "Capitalisation boursière : valeur de marché des fonds propres (ce que valent les actionnaires).",
          "Valeur d’entreprise (EV) = capitalisation + dette nette + intérêts minoritaires + actions de préférence. C’est le prix pour acheter toute l’activité.",
          "Valeur comptable : fonds propres dans les comptes de l’entreprise. Le ratio cours / valeur comptable (P/B) compare les deux.",
        ],
        formulas: ["EV = capitalisation + dette − trésorerie (+ minoritaires)", "EV / EBITDA : multiple très utilisé en valorisation"],
        example: "Capitalisation 100, dette 30, trésorerie 10 : EV = 120. Avec un EBITDA de 12, EV / EBITDA = 10.",
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
          head: ["Catégorie", "Repère courant"],
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
      },
      {
        title: "6. Ce qui fait bouger une capitalisation",
        bullets: [
          "Le cours de l’action (résultats, taux, anticipations de croissance).",
          "Le nombre d’actions : émissions, rachats d’actions, scissions.",
          "Le PER : quand les taux baissent, les investisseurs paient plus cher chaque dollar de bénéfice, donc les capitalisations montent.",
          "Les opérations : fusions, introductions en bourse, sorties de cote.",
        ],
      },
      {
        title: "7. Repères structurels",
        bullets: [
          "Les États-Unis représentent de très loin la plus grande part de la capitalisation mondiale, et plus de 60 % du MSCI World.",
          "Les « Magnificent Seven » : Apple, Microsoft, Alphabet, Amazon, Nvidia, Meta, Tesla.",
          "En Europe, les grandes capitalisations se répartissent entre luxe, santé, technologies, finance et énergie.",
          "Pour les chiffres du jour (top 5 mondial, top 3 européen, capitalisation de Nvidia…), utilise la page Capitalisations : elle est actualisée chaque jour.",
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

  // ------------------------------------------------------------------ BANQUES CENTRALES
  {
    slug: "banques-centrales",
    category: "central-banks",
    code: "A",
    title: "Banques centrales",
    level: "Débutant",
    minutes: 20,
    intro:
      "Les banques centrales fixent le coût de l’argent. Savoir qui décide, avec quel mandat, quels outils et quel vocabulaire est la base de toute lecture macro.",
    sections: [
      {
        title: "1. À quoi sert une banque centrale",
        bullets: [
          "Fixer la politique monétaire : le niveau des taux et la quantité de liquidité.",
          "Garantir la stabilité des prix (inflation faible et stable).",
          "Prêteur en dernier ressort : elle prête aux banques en cas de crise de liquidité.",
          "Superviser ou soutenir la stabilité financière, gérer les systèmes de paiement, émettre les billets.",
          "Indépendance : elle décide sans instructions du gouvernement, ce qui ancre la crédibilité anti-inflation.",
        ],
      },
      {
        title: "2. Les grandes banques centrales",
        table: {
          head: ["Banque", "Mandat principal", "Organe de décision"],
          rows: [
            ["BCE (Francfort)", "Stabilité des prix (cible 2 % à moyen terme)", "Conseil des gouverneurs"],
            ["Fed (États-Unis)", "Double mandat : plein emploi et stabilité des prix (2 %, mesure PCE)", "FOMC (12 membres votants)"],
            ["Bank of England", "Stabilité des prix (2 % IPC)", "MPC (9 membres)"],
            ["Banque du Japon", "Stabilité des prix", "Comité de politique monétaire"],
            ["SNB (Suisse)", "Stabilité des prix, en tenant compte de la conjoncture", "Direction générale"],
            ["PBoC (Chine)", "Stabilité de la monnaie et soutien à la croissance", "Comité de politique monétaire"],
          ],
        },
        bullets: [
          "BCE : le Conseil des gouverneurs réunit les 6 membres du Directoire et les gouverneurs des banques centrales nationales de la zone euro. Huit réunions de politique monétaire par an.",
          "Fed : 7 gouverneurs au Conseil, 12 banques régionales ; le FOMC compte 7 gouverneurs + le président de New York + 4 présidents régionaux en rotation. Huit réunions par an.",
          "Traité sur le fonctionnement de l’UE, article 127 : objectif principal de la BCE = stabilité des prix.",
        ],
      },
      {
        title: "3. Les taux directeurs",
        bullets: [
          "BCE : trois taux. Le taux de la facilité de dépôt (rémunération des dépôts des banques) est le principal repère depuis que le système est abondant en liquidité. Les deux autres : taux des opérations principales de refinancement et taux de la facilité de prêt marginal.",
          "Fed : le taux directeur est une fourchette cible pour le taux des fonds fédéraux (federal funds rate), taux au jour le jour entre banques. La Fed l’influence en réglant les taux administrés (intérêt sur réserves, reverse repo).",
          "Taux au jour le jour de référence : €STR (euro), SOFR (dollar), SONIA (livre), TONA (yen).",
          "Le taux directeur se transmet à tous les taux : prêts, crédits immobiliers, obligations, change.",
        ],
      },
      {
        title: "4. Les outils",
        bullets: [
          "Taux directeur : l’outil principal, ajusté à chaque réunion.",
          "QE (quantitative easing, assouplissement quantitatif) : achats massifs de titres (obligations d’État…) financés par création de monnaie de banque centrale. Il fait baisser les taux longs et soutient les prix d’actifs.",
          "QT (quantitative tightening, resserrement quantitatif) : réduction du bilan, en laissant les titres arriver à échéance ou en les vendant.",
          "Forward guidance : communiquer sur la trajectoire future des taux pour piloter les anticipations.",
          "Prêts à long terme aux banques (TLTRO à la BCE) et facilités de liquidité.",
          "Contrôle de la courbe des taux (YCC) : cibler un taux long, comme l’a fait la Banque du Japon de 2016 à 2024.",
          "Interventions de change et réserves obligatoires, plus rarement utilisées.",
        ],
      },
      {
        title: "5. Programmes et dates marquantes",
        table: {
          head: ["Repère", "Contenu"],
          rows: [
            ["2008 – 2009", "Crise financière : taux proches de zéro, premiers QE (Fed, BoE)"],
            ["2012", "Mario Draghi : « whatever it takes » ; création de l’OMT à la BCE"],
            ["2015", "APP : QE de la BCE"],
            ["2016", "BoJ : taux négatifs et contrôle de la courbe des taux"],
            ["2020", "COVID : PEPP (BCE), QE massifs, taux à zéro"],
            ["2022", "Retour de l’inflation : cycle de hausses de taux rapide et QT ; création du TPI à la BCE"],
            ["2024", "BoJ : fin des taux négatifs et du contrôle de la courbe des taux"],
          ],
        },
        paragraphs: ["Ce sont des repères historiques stables. Pour les niveaux de taux actuels, consulte les sites officiels : ils changent à chaque réunion."],
      },
      {
        title: "6. Le vocabulaire des marchés",
        bullets: [
          "Hawkish (faucon) : plutôt favorable à des taux plus élevés pour lutter contre l’inflation.",
          "Dovish (colombe) : plutôt favorable à des taux plus bas pour soutenir l’activité.",
          "Pivot : changement de cap de la politique monétaire. Taper : ralentir le rythme des achats.",
          "Dot plot : graphique trimestriel où chaque membre du FOMC indique où il voit le taux dans le futur.",
          "Data-dependent : la décision dépend des prochaines données (inflation, emploi).",
          "Jackson Hole : symposium annuel des banquiers centraux, où la Fed donne souvent des signaux.",
        ],
      },
      {
        title: "7. Lecture rapide",
        paragraphs: [
          "Taux qui montent = politique restrictive : on freine l’inflation et l’activité, la monnaie tend à s’apprécier, les prix des obligations baissent. Taux qui baissent = politique accommodante : on soutient l’activité, la monnaie tend à se déprécier, les prix des obligations montent.",
        ],
      },
    ],
    remember: [
      "BCE : stabilité des prix. Fed : emploi + prix. Cible 2 % pour les deux.",
      "QE = achats de titres, bilan qui gonfle. QT = bilan qui se réduit.",
      "Le taux directeur est l’outil central, le bilan est l’outil de renfort.",
      "Hawkish = taux plus hauts, dovish = taux plus bas.",
    ],
    interview: [
      "« Quelle est la différence entre le mandat de la BCE et celui de la Fed ? »",
      "« Que fait la banque centrale d’un QE sur les taux longs ? »",
      "« Comment s’appelle le taux de référence au jour le jour en euro ? » → €STR.",
    ],
  },

  // ------------------------------------------------------------------ POLITIQUE MONETAIRE
  {
    slug: "politique-monetaire",
    category: "monetary-policy",
    code: "B",
    title: "Politique monétaire",
    level: "Intermédiaire",
    minutes: 20,
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
    minutes: 20,
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
          "Ratio dette / PIB : mesure la soutenabilité. Critères de Maastricht : déficit sous 3 % du PIB, dette sous 60 %.",
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
      "Maastricht : déficit sous 3 %, dette sous 60 % du PIB.",
    ],
    interview: [
      "« Pourquoi les marchés regardent-ils autant le NFP ? »",
      "« Quelle est la différence entre PIB nominal et réel ? »",
      "« Qu’est-ce que la stagflation ? »",
    ],
  },

  // ------------------------------------------------------------------ CHANGE
  {
    slug: "change",
    category: "fx",
    code: "D",
    title: "Marché des changes",
    level: "Débutant",
    minutes: 20,
    intro: "Comment lire un cours de change, comment calculer, et ce qui fait bouger une devise.",
    sections: [
      {
        title: "1. Lire un cours",
        bullets: [
          "Une paire A/B donne le prix d’une unité de A (devise de base) en unités de B (devise cotée).",
          "EUR/USD = 1,10 : 1 euro vaut 1,10 dollar. Si EUR/USD monte, l’euro s’apprécie et le dollar se déprécie.",
          "Bid : prix auquel la banque achète la devise de base. Ask (offer) : prix auquel elle la vend. Le spread = ask − bid.",
          "Pip : 4e décimale (0,0001) pour la plupart des paires ; 2e décimale (0,01) pour les paires avec le yen.",
          "Paires majeures : EUR/USD, USD/JPY, GBP/USD, USD/CHF, AUD/USD, USD/CAD, NZD/USD. Croisées : EUR/GBP, EUR/JPY…",
        ],
        formulas: [
          "Inverser une paire : USD/EUR = 1 / (EUR/USD)",
          "Si l’euro prend x %, le dollar perd x / (1 + x)      +10 % → −9,09 %",
          "Cours croisé : EUR/GBP = (EUR/USD) / (GBP/USD)",
        ],
        example: "EUR/USD = 1,10 et GBP/USD = 1,25 : EUR/GBP = 1,10 / 1,25 = 0,88.",
      },
      {
        title: "2. Les parités à connaître",
        table: {
          head: ["Notion", "Formule", "Idée"],
          rows: [
            ["Parité couverte des taux (CIP)", "F = S × (1 + i cotée) / (1 + i base)", "Le change à terme reflète l’écart de taux"],
            ["Parité non couverte (UIP)", "E[ΔS] ≈ écart de taux", "En théorie, rend le carry nul en moyenne"],
            ["Parité de pouvoir d’achat (PPA)", "S = P / P*", "À long terme, les prix convergent"],
          ],
        },
        example: "EUR/USD spot = 1,10, taux USD 5 %, taux EUR 3 % : cours à 1 an = 1,10 × 1,05 / 1,03 ≈ 1,1214. L’euro (taux plus bas) se traite à prime à terme.",
        paragraphs: ["Règle : la devise au taux d’intérêt le plus élevé se traite à terme avec une décote ; la devise au taux le plus bas, avec une prime."],
      },
      {
        title: "3. Ce qui fait bouger une devise",
        bullets: [
          "Écarts de taux d’intérêt : une devise à taux élevé attire les capitaux (surtout les taux réels).",
          "Croissance relative et flux d’investissement étranger.",
          "Inflation relative : à long terme, la devise du pays à forte inflation se déprécie (PPA).",
          "Balance courante et flux de capitaux.",
          "Appétit pour le risque : en période de stress, les valeurs refuges (dollar, yen, franc suisse) montent souvent.",
          "Prix des matières premières pour les devises liées (CAD, NOK, AUD).",
          "Interventions et communication des banques centrales.",
        ],
      },
      {
        title: "4. Carry trade",
        paragraphs: [
          "Emprunter une devise à taux bas (la devise de financement : yen, franc suisse) pour placer dans une devise à taux élevé. Le gain vient de l’écart de taux, tant que la devise ne s’inverse pas.",
          "Risque : un retour brutal de l’aversion pour le risque ou un resserrement dans le pays à taux bas fait remonter la devise de financement, et les positions se dénouent en chaîne (débouclage du carry).",
        ],
        formulas: ["Gain du carry ≈ taux de la devise placée − taux de la devise empruntée ± variation du change"],
      },
      {
        title: "5. Régimes de change",
        bullets: [
          "Flottant : le marché fixe le cours (euro, dollar, yen, livre).",
          "Fixe (peg) ou rattaché : la banque centrale défend une parité (certaines devises du Golfe sont liées au dollar).",
          "Flottement géré : le cours évolue dans une marge, avec interventions.",
          "Union monétaire : l’euro.",
          "Intervention : achat ou vente de devises par la banque centrale pour influencer le cours.",
        ],
      },
      {
        title: "6. Marché et acteurs",
        bullets: [
          "Marché le plus liquide du monde : de l’ordre de 7 à 10 T$ échangés par jour selon les enquêtes triennales de la BRI. Le dollar est présent dans près de 9 transactions sur 10.",
          "Ouvert 24 h sur 24, du lundi au vendredi : sessions de Sydney, Tokyo, Londres, New York.",
          "Acteurs : banques (market makers), fonds, entreprises (couverture), banques centrales, particuliers.",
          "Au comptant (spot) : règlement en général à J + 2 (J + 1 pour USD/CAD). À terme (forward) : règlement plus tard. Swap de change : achat au comptant + vente à terme.",
          "Indice du dollar (DXY) : le dollar contre un panier de six devises, dominé par l’euro (plus de la moitié), puis yen, livre, dollar canadien, couronne suédoise, franc suisse.",
          "Taux de change effectif réel (REER) : un cours pondéré par les échanges et corrigé de l’inflation.",
        ],
      },
      {
        title: "7. Noms usuels",
        table: {
          head: ["Paire", "Surnom"],
          rows: [["EUR/USD", "fiber"], ["GBP/USD", "cable"], ["USD/JPY", "dollar-yen"], ["AUD/USD", "aussie"], ["NZD/USD", "kiwi"], ["USD/CAD", "loonie"]],
        },
      },
    ],
    remember: [
      "Le cours dit combien de devise cotée coûte une unité de devise de base.",
      "Taux d’intérêt, croissance et appétit pour le risque pilotent beaucoup de mouvements.",
      "Une hausse de x % d’une devise est une baisse inférieure à x % de l’autre.",
      "Forward : la devise à taux élevé se traite avec une décote à terme.",
    ],
    interview: [
      "« Pourquoi le yen monte-t-il en période de stress ? » (débouclage du carry, valeur refuge)",
      "« Calcule EUR/GBP à partir de EUR/USD et GBP/USD. »",
      "« Quel est l’effet d’une hausse de taux de la Fed sur le dollar ? »",
    ],
  },

  // ------------------------------------------------------------------ MATIERES PREMIERES
  {
    slug: "matieres-premieres",
    category: "commodities",
    code: "E",
    title: "Matières premières",
    level: "Débutant",
    minutes: 20,
    intro: "Pétrole, gaz, or, cuivre, agricoles : ce qui pilote les prix, comment on les cote et leur lien avec le dollar et l’inflation.",
    sections: [
      {
        title: "1. Les grandes familles",
        table: {
          head: ["Famille", "Exemples", "Référence"],
          rows: [
            ["Énergie", "Pétrole, gaz, charbon", "Brent, WTI, TTF, Henry Hub"],
            ["Métaux précieux", "Or, argent, platine", "Once troy (31,1 g)"],
            ["Métaux industriels", "Cuivre, aluminium, nickel", "LME, COMEX"],
            ["Agriculture", "Blé, maïs, soja, café, sucre", "CBOT, ICE"],
          ],
        },
      },
      {
        title: "2. Pétrole",
        bullets: [
          "Brent : référence internationale, issue de la mer du Nord. WTI : référence américaine (West Texas Intermediate), livrée à Cushing, Oklahoma.",
          "Unités : un baril = 159 litres. Production et demande se comptent en millions de barils par jour (mb/d), de l’ordre de 100 mb/d au niveau mondial.",
          "OPEP : organisation des pays producteurs ; OPEP+ : OPEP plus des partenaires dont la Russie. Elle ajuste ses quotas pour influencer les prix.",
          "Grands producteurs : États-Unis, Arabie saoudite, Russie. Les États-Unis sont devenus un producteur majeur grâce au pétrole de schiste.",
          "Un dollar plus fort rend le pétrole plus cher pour les acheteurs hors zone dollar, ce qui pèse sur la demande.",
          "Avril 2020 : le WTI est passé brièvement sous zéro, faute de capacités de stockage au moment de l’échéance du contrat.",
        ],
      },
      {
        title: "3. Gaz naturel",
        bullets: [
          "Marchés régionaux : Henry Hub (États-Unis), TTF (Europe), JKM (Asie).",
          "GNL (gaz naturel liquéfié) : transport par bateau, qui rend le marché plus mondial.",
          "Forte saisonnalité : demande élevée l’hiver pour le chauffage.",
          "Unités : MWh, MMBtu. Un choc d’offre sur le gaz se répercute vite sur l’électricité et l’inflation en Europe.",
        ],
      },
      {
        title: "4. Or et métaux précieux",
        bullets: [
          "Or : valeur refuge, protection contre l’inflation et l’incertitude. Ne verse ni coupon ni dividende.",
          "L’or est très sensible aux taux réels : taux réels plus bas → or plus attractif.",
          "Dollar plus faible → or souvent plus haut (il est coté en dollars).",
          "Les banques centrales détiennent de l’or dans leurs réserves et sont des acheteuses importantes.",
          "Argent : à la fois métal précieux et industriel, plus volatil que l’or.",
        ],
      },
      {
        title: "5. Cuivre et métaux industriels",
        bullets: [
          "Le cuivre est surnommé « Dr Copper » : son prix reflète la santé de l’économie mondiale.",
          "La Chine est le premier consommateur : son activité (immobilier, infrastructures) pèse beaucoup.",
          "Transition énergétique : forte demande en cuivre, lithium, nickel (véhicules électriques, réseaux).",
        ],
      },
      {
        title: "6. Marché à terme : contango et backwardation",
        bullets: [
          "Les matières premières se négocient surtout via des contrats à terme (futures).",
          "Contango : prix à terme > prix comptant. Courbe pentue vers le haut : stockage abondant, offre confortable.",
          "Backwardation : prix à terme < prix comptant. Tension sur l’offre immédiate : stocks bas.",
          "Roll yield : gain ou perte à chaque renouvellement d’un contrat. En contango, rouler coûte ; en backwardation, il rapporte.",
        ],
        formulas: ["Prix à terme ≈ prix comptant × (1 + taux sans risque) + coût de stockage − rendement de convenance"],
      },
      {
        title: "7. Ce qui pilote les prix",
        bullets: [
          "Offre : quotas, grèves, météo, géopolitique, découvertes.",
          "Demande : croissance mondiale, Chine, saisons.",
          "Stocks : niveaux bas → prix qui montent et backwardation.",
          "Dollar : la plupart des matières premières sont cotées en dollars.",
          "Devises de matières premières : CAD, NOK, AUD, CLP profitent de la hausse de leurs exportations.",
          "Inflation : l’énergie et l’alimentation pèsent sur l’inflation totale, mais sont exclues de l’inflation sous-jacente.",
        ],
      },
    ],
    remember: [
      "Brent = référence internationale du pétrole, WTI = référence américaine.",
      "Dollar fort = pression sur les prix des matières premières.",
      "Contango : terme > comptant. Backwardation : terme < comptant.",
      "L’or réagit aux taux réels, au dollar et au stress de marché.",
    ],
    interview: [
      "« Que signifie la backwardation sur le pétrole ? »",
      "« Pourquoi l’or monte-t-il quand les taux réels baissent ? »",
      "« Pourquoi le cuivre est-il un indicateur de croissance ? »",
    ],
  },

  // ------------------------------------------------------------------ OBLIGATIONS
  {
    slug: "obligations",
    category: "financial-markets",
    code: "F1",
    title: "Obligations et taux",
    level: "Intermédiaire",
    minutes: 25,
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
          "Duration modifiée = Macaulay / (1 + y) : sensibilité du prix à une variation du taux.",
          "DV01 (ou PVBP) : variation de prix en valeur pour 1 pb de variation du rendement.",
          "Convexité : la relation prix-rendement est courbe. La convexité corrige l’approximation linéaire et joue en faveur de l’investisseur.",
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
      "Variation du prix ≈ − duration × variation du taux.",
      "Spread = prime de risque. Il s’élargit quand le marché a peur.",
      "Notation : BBB− est la limite de l’investment grade.",
    ],
    interview: [
      "« Quelle est la duration d’un zéro coupon à 5 ans ? » → 5.",
      "« Quel est l’effet d’une hausse de 1 point des taux sur une obligation de duration 8 ? » → environ −8 %.",
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
    minutes: 25,
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
    minutes: 25,
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
      "« Pourquoi les puts hors de la monnaie ont-ils une volatilité implicite plus élevée ? »",
    ],
  },

  // ------------------------------------------------------------------ GUESSTIMATES
  {
    slug: "guesstimates",
    category: "macro-guesstimates",
    code: "G",
    title: "Guesstimates macro",
    level: "Intermédiaire",
    minutes: 15,
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
        title: "2. Repères à connaître en ordre de grandeur",
        paragraphs: [
          "Ces repères sont des ordres de grandeur à la date indiquée ; ils évoluent chaque année. Les questions du quiz qui portent dessus affichent leur date de référence et expirent.",
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
          "Dette publique / PIB : de l’ordre de 100 à 120 % en France et aux États-Unis, plus de 200 % au Japon.",
          "Budget de l’État : en général 20 à 50 % du PIB selon les pays (France : dépenses publiques autour de 55 %).",
          "Capitalisation boursière mondiale / PIB mondial : proche de 1, avec de grandes variations.",
          "Taux d’épargne, part de la consommation (60 à 70 % du PIB dans les grandes économies développées).",
        ],
      },
      {
        title: "4. Exemples de raisonnement",
        bullets: [
          "Nombre de foyers en France : 68 M d’habitants / 2,3 personnes par foyer ≈ 30 M de foyers.",
          "Dette à 100 % du PIB, taux moyen de 2 % : charge d’intérêts ≈ 2 % du PIB. À 4 % : 4 % du PIB.",
          "Un pays de 10 M d’habitants avec un PIB par habitant de 30 000 $ → PIB de 300 Md$.",
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
  },
];

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}
