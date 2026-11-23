// Parcours : 4 niveaux, 22 modules à valider dans l'ordre.

export type LevelId = "beginner" | "intermediate" | "advanced" | "expert";

export const LEVELS: { id: LevelId; name: string; tagline: string }[] = [
  { id: "beginner", name: "Débutant", tagline: "Les bases : calcul, vocabulaire, grands mécanismes." },
  { id: "intermediate", name: "Intermédiaire", tagline: "Taux, obligations, politique monétaire, change." },
  { id: "advanced", name: "Avancé", tagline: "Calculs plus durs, ordres de grandeur, cas d’entretien." },
  { id: "expert", name: "Expert", tagline: "Dérivés, courbes, mises en situation." },
];

export type Module = {
  id: string; // d1, i3, a2, e5…
  level: LevelId;
  title: string;
  goal: string;
  categories: string[]; // catégories de questions utilisées
  chapter?: string; // fiche de cours complète
  chapters?: string[];
  points: string[]; // cours court : l'essentiel en quelques lignes
  ready: boolean; // false = pas encore assez de questions
};

export const MODULES: Module[] = [
  {
    id: "d1", level: "beginner", title: "Les pourcentages et le calcul de tête",
    goal: "Multiplie, divise, lis « pour cent » et convertis un écart.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "« Pour cent » signifie « sur 100 ». Pour 10 %, divise par 10. Pour 1 %, divise par 100. Pour 7 %, prends sept fois 1 %.",
      "50 % est une moitié, 25 % un quart et 5 % la moitié de 10 %. Par exemple, 5 % de 200 font 10.",
      "Pour multiplier par 5, multiplie par 10 puis divise par 2. Pour diviser par 8, divise par 2 trois fois. 1 000 → 500 → 250 → 125.",
      "Si le départ est 100 €, une hausse de 10 € fait 10 %. Le pourcentage d’une variation se rapporte au départ.",
      "Un point de pourcentage vaut 100 points de base (pb). Ainsi 150 pb valent 1,5 point. Un milliard vaut 1 000 millions.",
    ],
  },
  {
    id: "d3", level: "beginner", title: "Actions et obligations : les bases",
    goal: "Distingue un titre de propriété d’un titre de dette.",
    categories: ["financial-markets"], chapter: "actions-et-indices", ready: true,
    points: [
      "Une Bourse organise les échanges entre acheteurs et vendeurs. Les prix se forment lors des transactions.",
      "Une action représente une part de propriété d’une entreprise. L’entreprise peut verser une partie de ses bénéfices aux actionnaires sous forme de dividende.",
      "Une obligation représente une créance. L’émetteur emprunte, promet de rembourser une somme appelée nominal à l’échéance et peut verser un intérêt appelé coupon.",
      "Un coupon de 5 % sur un nominal de 100 € vaut 5 € par an. Un émetteur en difficulté peut ne pas payer tout ce qui était prévu.",
    ],
  },
  {
    id: "d2", level: "beginner", title: "Capitalisations et indices : les bases",
    goal: "Calcule une valeur en Bourse et reconnais quelques références.",
    categories: ["market-caps"], chapter: "capitalisations", ready: true,
    points: [
      "La capitalisation boursière vaut prix d’une action × nombre d’actions en circulation. Un titre à 20 € avec 5 millions d’actions donne 100 M€.",
      "Le prix d’une action seule ne mesure pas la taille de l’entreprise. Une mid cap désigne une capitalisation intermédiaire. Les seuils dépendent du marché.",
      "Un indice suit un panier d’actions selon une méthode. Le CAC 40 est une référence de la Bourse de Paris, le DAX du marché allemand.",
      "LVMH est un groupe de luxe. LVMH, L’Oréal, Air Liquide et Schneider Electric sont des exemples de sociétés françaises cotées à Paris. Nestlé a son siège en Suisse.",
    ],
  },
  {
    id: "d5", level: "beginner", title: "Les bases de la macroéconomie",
    goal: "Apprends à lire production, inflation, emploi et ordres de grandeur.",
    categories: ["macroeconomics", "macro-guesstimates"], chapters: ["inflation", "guesstimates"], ready: true,
    points: [
      "La macroéconomie étudie l’économie à l’échelle d’un pays ou d’une zone. Le PIB mesure la production finale réalisée sur le territoire pendant une période.",
      "Croissance du PIB réel signifie que la production a augmenté en volume, après correction des variations de prix.",
      "L’inflation est la hausse générale des prix. Si elle reste positive en passant de 5 % à 2 %, les prix montent plus lentement. Une baisse durable du niveau général des prix est une déflation.",
      "Le chômage se rapporte à la population active : les personnes qui ont un emploi plus celles qui en cherchent un selon la définition statistique. Si ton revenu reste stable et les prix montent, ton pouvoir d’achat baisse.",
      "Pour estimer un ordre de grandeur, écris les hypothèses et les unités. Dix villes de 50 000 habitants représentent environ 500 000 habitants sans recouvrement.",
    ],
  },
  {
    id: "d4", level: "beginner", title: "Banques centrales : les bases",
    goal: "Découvre ce que font la BCE, la Fed et les taux directeurs.",
    categories: ["central-banks", "monetary-policy"], chapter: "banques-centrales", ready: true,
    points: [
      "Une banque centrale conduit la politique monétaire. Les banques commerciales y détiennent des réserves et peuvent s’y financer. Un particulier ouvre son compte auprès d’une banque commerciale.",
      "Les taux directeurs influencent le crédit et l’épargne. Inflation durablement élevée : des taux plus hauts peuvent freiner la demande. Activité faible et inflation basse : une baisse peut soutenir la demande.",
      "La politique monétaire agit notamment par les taux. Les impôts et dépenses de l’État relèvent de la politique budgétaire.",
      "La BCE, à Francfort, conduit la politique monétaire de l’euro. Le Conseil des gouverneurs décide. Son objectif principal est la stabilité des prix, autour de 2 % d’inflation à moyen terme. Un petit coussin positif réduit le risque de déflation.",
      "La Fed est la banque centrale américaine. Le FOMC décide de la politique monétaire du dollar. Le double mandat associe stabilité des prix et emploi maximal.",
      "La BoE conduit la politique monétaire de la livre sterling, la BoJ celle du yen, et la BNS celle du franc suisse. L’indépendance permet de décider dans un mandat légal sans ordre d’un gouvernement.",
    ],
  },
  {
    id: "d6", level: "beginner", title: "Change et matières premières : les bases",
    goal: "Lis une paire de devises et distingue les unités du pétrole et de l’or.",
    categories: ["fx", "commodities"], chapters: ["change", "matieres-premieres"], ready: true,
    points: [
      "Une devise est la monnaie d’un pays ou d’une zone. EUR/USD = 1,10 signifie 1 € = 1,10 $. 1 000 € valent donc 1 100 $ hors frais.",
      "La première devise est celle dont on donne le prix. Si la paire monte, elle s’apprécie contre la seconde. USD/JPY qui monte signifie que le yen s’affaiblit face au dollar.",
      "Le cours spot s’applique à un échange proche. Le franc suisse est souvent recherché comme devise refuge, selon le contexte.",
      "Les matières premières sont des biens physiques comme le brut, l’or ou le blé. Le pétrole se cote en dollars par baril (environ 159 litres), l’or en dollars par once troy (environ 31 g).",
      "Le Brent est associé à la mer du Nord, le WTI au marché américain. L’OPEP+ coordonne des objectifs de production. L’or peut servir de refuge ou de diversification.",
      "Repères fictifs pour lire les échelles : 74 $ le baril représente quelques dizaines de dollars et 3 200 $ l’once quelques milliers.",
    ],
  },
  {
    id: "i1", level: "intermediate", title: "Variations, taux et intérêts composés",
    goal: "Enchaîne deux étapes de calcul et garde la bonne base.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "Variation relative = (final − initial) ÷ initial. 80 à 100 : 20 ÷ 80 = 25 %.",
      "Pour les changements successifs, multiplie les coefficients. +20 % puis −10 % donne 1,20 × 0,90 = 1,08, soit +8 %.",
      "Après −20 %, tu repars de 80 sur une base de 100. Il faut +25 % sur 80 pour revenir à 100.",
      "Intérêts composés : capital × (1 + taux en décimal)^nombre d’années. À 10 % pendant deux ans, 1 000 € deviennent 1 210 €.",
      "100 pb = 1 point de pourcentage. Ajoute 0,35 point à 3,10 % pour passer à 3,45 %. Pour retrouver une base, divise la part par le taux en décimal.",
      "Le PER compare le prix d’une action et son bénéfice par action. Son inverse donne le rendement des bénéfices. Un PER de 20 correspond à 1 / 20, soit 5 %.",
    ],
  },
  {
    id: "i2", level: "intermediate", title: "Capitalisations, poids et grandes valeurs",
    goal: "Passe du cours à l’indice, au flottant et à la valeur d’entreprise.",
    categories: ["market-caps"], chapter: "capitalisations", ready: true,
    points: [
      "Pour les repères de marché : S&P 500 aux États-Unis, CAC 40 en France, DAX en Allemagne, FTSE 100 au Royaume-Uni, Nikkei 225 au Japon. AAPL désigne Apple, Saudi Aramco est cotée à Riyad.",
      "Le poids d’une action dans un indice pondéré par capitalisation correspond à sa capitalisation retenue divisée par le total. 100 sur 2 000 donne 5 %.",
      "Le flottant désigne les actions disponibles à la négociation. Certains indices pondèrent les valeurs par la capitalisation de leur flottant.",
      "Dans un modèle simple, valeur d’entreprise = capitalisation + dette nette. La dette nette vaut dette financière moins trésorerie.",
      "Les estimations de capitalisations et les classements du panel se lisent avec la date de référence. La fiche Capitalisations indique aussi la devise et l’unité.",
    ],
  },
  {
    id: "i3", level: "intermediate", title: "Cotation, taux et obligations",
    goal: "Passe du bid-ask au rendement et à l’actualisation.",
    categories: ["financial-markets"], chapters: ["obligations", "actions-et-indices"], ready: true,
    points: [
      "Le bid est le prix auquel le teneur de marché achète. L’ask est celui auquel il vend. Le spread est ask − bid.",
      "Rendement du dividende = dividende annuel par action ÷ cours. Le rendement actuariel d’une obligation tient compte du prix et de tous les paiements attendus.",
      "Quand le rendement exigé monte, le prix des flux fixes baisse. Un zéro-coupon remboursant 100 € dans un an se valorise à 100 ÷ (1 + taux en décimal).",
      "La courbe associe taux et échéance. Une pente 2–10 ans est le dix ans moins le deux ans. Si le long est sous le court, le segment est inversé.",
    ],
  },
  {
    id: "i4", level: "intermediate", title: "Politique monétaire : instruments et langage",
    goal: "Lis les taux de la BCE et de la Fed et interprète le discours.",
    categories: ["central-banks", "monetary-policy"], chapters: ["banques-centrales-intermediaire", "politique-monetaire"], ready: true,
    points: [
      "La facilité de dépôt rémunère des fonds déposés pour une nuit. Le prêt marginal fournit des fonds au jour le jour contre garantie. L’écart se convertit en points de base.",
      "La Fed annonce une fourchette cible des fed funds. Un taux directeur est un instrument, la stabilité des prix un objectif.",
      "La BCE se réfère à l’IPCH de la zone euro et la Fed à l’indice des prix PCE. L’inflation sous-jacente peut exclure des postes volatils comme l’énergie.",
      "Un discours hawkish penche vers des conditions plus strictes. Un discours dovish penche vers un assouplissement. Le dot plot donne des jugements individuels conditionnels.",
      "Le taux réel anticipé s’approxime par le taux nominal moins l’inflation attendue. Un contrat fixe déjà signé conserve son taux. Le coût des nouveaux crédits réagit plus vite.",
    ],
  },
  {
    id: "i5", level: "intermediate", title: "Macroéconomie : indices, comptes et estimations",
    goal: "Utilise des ratios, un déflateur et des hypothèses explicites.",
    categories: ["macroeconomics", "macro-guesstimates"], chapters: ["macroeconomie", "guesstimates"], ready: true,
    points: [
      "Le déficit public est un flux annuel et la dette publique un stock. Les valeurs de référence européennes sont 3 % du PIB pour le déficit et 60 % pour la dette.",
      "Ratio dette/PIB = dette publique brute ÷ PIB nominal. Croissance réelle approximative = croissance nominale − hausse du déflateur du PIB.",
      "L’IPCH harmonise la mesure des prix en Europe. La courbe de Phillips décrit une relation conditionnelle entre les tensions sur l’emploi et l’inflation à court terme.",
      "Pour estimer une dépense totale, multiplie population × part concernée × dépense par personne. Pour annualiser un flux quotidien, multiplie par le nombre de jours retenu.",
    ],
  },
  {
    id: "i6", level: "intermediate", title: "Pips, prix du brut et conversions",
    goal: "Calcule un taux croisé, un spread ou un prix en euros.",
    categories: ["fx", "commodities"], chapters: ["change-intermediaire", "matieres-premieres-intermediaire"], ready: true,
    points: [
      "Sur EUR/USD, 1 pip vaut 0,0001. Sur USD/JPY, 1 pip vaut 0,01. Les clients achètent la devise de base à l’ask et la vendent au bid. GBP/USD est surnommé cable.",
      "Simplifie les unités pour croiser : EUR/USD × USD/JPY = EUR/JPY. Si deux taux ont la même devise de cotation, divise. Convertis des USD en euros en divisant par EUR/USD.",
      "Un dollar plus fort renchérit les factures USD en euros. Pour un exportateur qui encaisse des dollars, un euro plus fort réduit la contre-valeur en euros.",
      "Un choc de production à demande inchangée influence le prix du brut. Une hausse de l’énergie peut alimenter l’inflation globale. Le WTI de référence est livré à Cushing.",
      "Compare le Brent et le WTI à même date et même échéance. Un producteur sécurise une vente en vendant à terme. Un acheteur sécurise un achat en achetant à terme.",
    ],
  },
  {
    id: "a1", level: "advanced", title: "Calcul mental avancé",
    goal: "Combine des coefficients et contrôle l’ordre de grandeur.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "Une identité utile : 99 × 101 = 100² − 1. Pour 47 × 53, écris (50 − 3)(50 + 3) = 2 500 − 9.",
      "Un facteur annuel (1 + r) se répète avec les intérêts composés. La règle de 72 estime les années pour doubler à 72 ÷ taux en %.",
      "Écris les rapports avec leurs unités. Pour un poids, divise la partie par le total puis multiplie par 100. Pour un cours croisé, simplifie la devise intermédiaire.",
      "Le résultat net se calcule en multipliant le chiffre d’affaires par la marge nette. L’EBITDA mesure un résultat avant intérêts, impôts et amortissements. Pour EV/EBITDA, calcule d’abord l’EV, puis divise par l’EBITDA.",
      "Pour une estimation annuelle, convertis d’abord la fréquence et les unités. Contrôle le signe et l’échelle en refaisant le calcul avec des chiffres ronds.",
    ],
  },
  {
    id: "a2", level: "advanced", title: "Taux, banques centrales et change",
    goal: "Interprète une surprise et choisis le canal de transmission.",
    categories: ["central-banks", "monetary-policy", "fx"], chapters: ["banques-centrales-avance", "change-avance"], ready: true,
    points: [
      "Surprise = décision − consensus. Une hausse américaine inattendue peut relever les taux courts anticipés et soutenir le dollar si le différentiel domine les autres flux.",
      "Le QE achète des actifs et peut comprimer les taux longs. Le QT réduit le portefeuille, notamment en ne réinvestissant pas intégralement les remboursements.",
      "Le taux réel ex ante dépend de l’inflation attendue, et son écart au neutre donne un repère sur l’orientation. La règle de Taylor intègre inflation et écart de production.",
      "Le forward verrouille un cours. Le carry non couvert repose sur le différentiel de taux et reste exposé au change. Le terme EUR/USD vaut spot × facteur USD / facteur EUR sans coût ni base.",
      "Un choc d’offre, une ruée vers le dollar ou des critères de prêt plus stricts peuvent dominer la transmission ordinaire. En régime ancré, la banque centrale peut défendre sa devise en utilisant ses réserves.",
    ],
  },
  {
    id: "a3", level: "advanced", title: "Macro, actions et matières premières",
    goal: "Relie taux, demande, valorisation et courbes à terme.",
    categories: ["macroeconomics", "macro-guesstimates", "market-caps", "commodities"], chapters: ["matieres-premieres-avance", "guesstimates", "capitalisations"], ready: true,
    points: [
      "Un choc de demande peut pousser prix et production dans le même sens. Un choc d’offre défavorable fait typiquement monter les prix et réduit la production.",
      "Compte courant = épargne nationale − investissement dans le modèle simplifié. Estime une dépense par population × consommation × fréquence.",
      "Pour un indice au flottant, multiplie la capitalisation par le flottant avant de diviser par le total retenu. Contribution approximative à l’indice = poids initial × variation.",
      "Des flux lointains sont plus sensibles à une variation du taux d’actualisation, toutes choses égales par ailleurs.",
      "Contango : prix différé au-dessus du proche. Backwardation : l’inverse. Sous courbe stable, ces configurations affectent le rendement du roulement. Le stockage et la disponibilité immédiate expliquent une partie de la pente.",
      "Un dollar plus fort peut renchérir la matière première pour des acheteurs étrangers. Des taux réels plus hauts peuvent peser sur l’or. L’activité industrielle et les ruptures d’offre restent des moteurs distincts.",
    ],
  },
  {
    id: "a4", level: "advanced", title: "Obligations : duration, convexité et DV01",
    goal: "Estime la perte ou le gain d’une obligation après un choc de taux.",
    categories: ["financial-markets"], chapter: "obligations", ready: true,
    points: [
      "La duration modifiée donne au premier ordre Δprix / prix ≈ −duration × Δrendement. La variation du rendement s’écrit en décimal, 25 pb = 0,0025.",
      "Au second ordre ajoute ½ × convexité × (Δrendement)². Une convexité positive amortit les pertes lors d’une hausse des taux et amplifie les gains lors d’une baisse.",
      "Le DV01 absolu ≈ prix de la position × duration modifiée × 0,0001. Il indique une sensibilité en monnaie à un mouvement d’un point de base.",
    ],
  },
  {
    id: "a5", level: "advanced", title: "Dérivés et options à l’échéance",
    goal: "Calcule les payoffs et distingue la protection de son coût.",
    categories: ["financial-markets"], chapter: "derives", ready: true,
    points: [
      "Un call donne le droit d’acheter, un put celui de vendre au strike selon le contrat. Posséder une action et acheter un put donne une protection contre la baisse.",
      "À l’échéance, call = max(S − K, 0), put = max(K − S, 0). Pour le résultat net d’un acheteur, retranche la prime.",
      "Un straddle acheté combine call et put au même strike et à la même échéance. Son payoff à l’échéance est |S − K| et son résultat retranche les deux primes.",
    ],
  },
  {
    id: "e1", level: "expert", title: "Calcul mental expert",
    goal: "Combine taux, ratios et variations avec des contrôles de cohérence.",
    categories: ["mental-math"], chapter: "calcul-mental", ready: true,
    points: [
      "Transforme les pourcentages en facteurs. Deux effets distincts s’enchaînent par multiplication. Décompose un pourcentage complexe en 10 %, 5 % et 1 %.",
      "Pour multiplier près d’une base, utilise (a − b)(a + b) = a² − b² ou distribue autour de chiffres ronds.",
      "La capitalisation composée applique le même facteur plusieurs fois. La règle de 72 donne une vérification approchée.",
      "Suis l’unité d’un ratio ou d’un taux croisé, calcule la variation de la base puis teste le signe et l’ordre de grandeur du résultat.",
      "Avec cours et nombre d’actions, trouve d’abord la capitalisation. Le PER s’obtient aussi par capitalisation divisée par bénéfice net, en gardant la même unité.",
    ],
  },
  {
    id: "e2", level: "expert", title: "Obligations : prix relatifs et déformations de courbe",
    goal: "Calcule des taux à terme et interprète des expositions de maturités.",
    categories: ["financial-markets"], chapter: "obligations", ready: true,
    points: [
      "La pente 2–10 ans vaut rendement à 10 ans moins rendement à 2 ans. Pour un aplatissement, un long dix ans et un court deux ans à DV01 équilibrés bénéficient d’une baisse relative du dix ans.",
      "Un DV01 net nul ne neutralise qu’un petit mouvement parallèle. Vérifie les sensibilités par échéance et l’effet de convexité.",
      "En capitalisation annuelle, (1 + z₂)² = (1 + z₁) × (1 + f₁,₂). Isole le facteur à terme puis retranche 1.",
    ],
  },
  {
    id: "e3", level: "expert", title: "Dérivés, grecs et volatilité",
    goal: "Décompose un P&L et ajuste une couverture delta.",
    categories: ["financial-markets"], chapter: "derives", ready: true,
    points: [
      "Le delta donne un P&L linéaire par mouvement du sous-jacent. Le gamma décrit la variation du delta. Si une position delta-neutre est longue de gamma, une hausse du sous-jacent rend son delta positif.",
      "Le vega mesure la sensibilité du prix à la volatilité implicite. Vérifie s’il est exprimé par point de volatilité.",
      "Pour un P&L linéaire avec plusieurs facteurs, additionne delta × variation du sous-jacent et vega × variation de volatilité. Une couverture delta n’est valable que localement.",
    ],
  },
  {
    id: "e4", level: "expert", title: "Macro, change et politique monétaire : cas de desk",
    goal: "Distingue les surprises, le prix déjà intégré et les chocs qui se contredisent.",
    categories: ["macroeconomics", "monetary-policy", "central-banks", "fx"], chapters: ["banques-centrales-expert", "change-expert"], ready: true,
    points: [
      "Compare la décision à celle qui était anticipée, puis la trajectoire annoncée au chemin déjà intégré. Une baisse de 25 pb peut être restrictive par rapport aux attentes si le marché attendait −50 pb.",
      "La surprise relative entre deux banques centrales compte davantage pour le change que les seules décisions. Le risque global et les primes peuvent dominer le taux.",
      "Taux réel exact = (1 + taux nominal) ÷ (1 + inflation) − 1. À 5 % nominal et 2 % d’inflation, il vaut environ 2,94 %.",
      "La parité couverte compare deux placements en verrouillant le change. Un basis peut persister à cause du coût du bilan et du financement. Pour arbitrer, utilise des cours bid et ask exécutables.",
      "Deux chocs peuvent coexister. Lis les OIS, la pente, la compensation d’inflation et les indices de risque pour distinguer les canaux.",
    ],
  },
  {
    id: "e5", level: "expert", title: "Mises en situation : positions, spreads et estimations",
    goal: "Agrège plusieurs risques et explicite ce qui reste après couverture.",
    categories: ["macro-guesstimates", "market-caps", "commodities"], chapters: ["matieres-premieres-expert", "guesstimates", "capitalisations"], ready: true,
    points: [
      "Pour un portefeuille, calcule chaque P&L signé dans la même devise. Le levier brut vaut somme des expositions absolues ÷ fonds propres.",
      "Long Brent et court WTI à quantités égales gagne si l’écart Brent − WTI augmente. Le ratio or/argent utilise les mêmes unités et le même instant.",
      "Une couverture peut laisser un risque de change, un écart entre référence et actif réel ou un appel de marge avant le paiement physique.",
      "Valeur d’entreprise simplifiée = capitalisation + dette − trésorerie. Pour EV/EBITDA, divise cette valeur par l’EBITDA. Dans un indice, somme les contributions de chaque poids.",
      "Dans une estimation, calcule séparément les segments, additionne et teste la sensibilité aux hypothèses de volume et de panier. Vérifie les utilisateurs uniques et le nombre d’achats par personne.",
    ],
  },
];

export const GUEST_MODULE = "d1"; // le seul module jouable sans compte

export type Progress = Record<string, { passed: boolean; best_pct: number; attempts: number }>;
export type Status = "placed" | "validated" | "open" | "locked" | "soon";

export function moduleById(id: string | null): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

export function levelOfModule(m: Module) {
  return LEVELS.find((l) => l.id === m.level)!;
}

export function modulePosition(m: Module): number {
  return MODULES.filter((item) => item.level === m.level).findIndex((item) => item.id === m.id) + 1;
}

export function placementDone(placement: string | null): LevelId[] {
  if (placement === "avance") return ["beginner", "intermediate"];
  if (placement === "intermediaire") return ["beginner"];
  return [];
}

// Statut de chaque module : on valide dans l'ordre, le suivant s'ouvre quand le précédent est validé.
export function computeStatuses(progress: Progress, placement: string | null): Record<string, Status> {
  const placed = placementDone(placement);
  const out: Record<string, Status> = {};
  let prevOk = true;
  for (const m of MODULES) {
    if (placed.includes(m.level)) {
      out[m.id] = "placed";
      continue;
    }
    if (!m.ready) {
      out[m.id] = "soon";
      prevOk = false;
      continue;
    }
    if (progress[m.id]?.passed) {
      out[m.id] = "validated";
      continue;
    }
    out[m.id] = prevOk ? "open" : "locked";
    prevOk = false;
  }
  return out;
}

export function nextOpenModule(statuses: Record<string, Status>): Module | undefined {
  return MODULES.find((m) => statuses[m.id] === "open");
}

// Module qui précède dans l'ordre (pour dire « valide d'abord … »).
export function previousModule(id: string, statuses?: Record<string, Status>): Module | undefined {
  const i = MODULES.findIndex((m) => m.id === id);
  if (i <= 0) return;
  return (statuses && MODULES.slice(0, i).find((m) => statuses[m.id] === "open" || statuses[m.id] === "soon")) ?? MODULES[i - 1];
}
