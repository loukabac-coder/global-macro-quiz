import type { ProgramLevel } from "@/lib/program";

type Lesson = [title: string, level: ProgramLevel, explanation: string, example: string];
type UnitLessons = Record<string, Lesson[]>;

export const CORE_LESSONS: UnitLessons = {
  "01/pib": [
    ["Mesurer la taille d’une économie", "beginner", "Le PIB additionne la valeur créée sur un territoire pendant une période. En croissance réelle, l’effet des prix est retiré. Le PIB nominal convient pour comparer des montants dans la même devise et pour calculer un ratio dette/PIB.", "Dans une économie qui produit autant qu’avant avec des prix 5 % plus élevés, le PIB nominal peut monter sans hausse de la production réelle."],
    ["Comparer les économies et les publications", "intermediate", "Précise l’année, la devise et la mesure. Le classement nominal en dollars change avec le taux de change. La parité de pouvoir d’achat répond à une autre question en tenant compte des différences de prix. Vérifie si le chiffre est une première estimation, une révision ou une prévision.", "Deux pays ont le même PIB. Celui de 20 millions d’habitants a un PIB par habitant cinq fois supérieur à celui de 100 millions."],
    ["Lire le calendrier des publications", "beginner", "Repère l’organisme statistique et la date annoncée dans son calendrier. La date de publication et la période mesurée répondent à deux questions différentes. Vérifie le millésime avant de comparer les montants.", "Une estimation du PIB annuel peut paraître au début de l’année suivante puis être révisée."],
  ],
  "01/inflation": [
    ["Mesurer l’inflation", "beginner", "Un indice de prix résume le coût d’un ensemble de biens et services pondéré. L’inflation représente sa variation. Elle est positive tant que l’indice monte, même quand la hausse ralentit.", "Si un indice passe de 100 à 110 puis à 115, les prix montent encore la seconde année, à un rythme plus faible."],
    ["Relier les prix au pouvoir d’achat", "beginner", "Le pouvoir d’achat indique ce qu’un revenu permet d’acheter. Compare l’évolution du revenu à celle des prix. Un revenu stable permet d’acheter moins lorsque les prix montent.", "Avec le même salaire et un panier plus cher, la quantité achetable diminue."],
    ["Inflation globale et sous-jacente", "intermediate", "L’inflation globale couvre l’intégralité du panier. Une mesure sous-jacente exclut certains produits volatils selon la convention publiée. Compare les méthodologies avant de comparer deux pays.", "Une baisse du prix du pétrole peut ralentir la mesure globale alors que les prix des services continuent d’augmenter rapidement."],
    ["Lire une publication", "advanced", "Repère le mois, la définition, la base de comparaison et les composantes qui expliquent le mouvement. Si la base de comparaison était exceptionnellement haute il y a un an, le glissement annuel peut ralentir même avec des hausses mensuelles.", "Lis conjointement la variation sur un mois, la variation sur un an et le détail de l’énergie et des services."],
  ],
  "01/emploi": [
    ["Lire le chômage et la participation", "beginner", "La population active regroupe les personnes en emploi et celles qui recherchent un emploi et sont disponibles selon les critères statistiques. Le taux de chômage vaut chômeurs divisés par actifs. Le taux d’emploi rapporte les personnes en emploi à la population de référence.", "Avec 55 actifs et cinq chômeurs, le chômage atteint environ 9 %. Si cinq personnes sortent de la population active, l’interprétation dépend de qui est sorti."],
    ["Suivre un cycle avec plusieurs indicateurs", "intermediate", "Compare la production, les heures travaillées, les embauches, les salaires et la productivité. Les données peuvent diverger temporairement. Les entreprises peuvent réduire les heures avant de réduire leurs effectifs.", "Un recul du chômage accompagné d’un recul de l’emploi justifie de vérifier la participation."],
  ],
  "01/finances": [
    ["Stocks, flux et ratios budgétaires", "beginner", "La dette publique se mesure à une date. Un déficit se mesure sur une période et correspond à un écart entre recettes et dépenses selon le périmètre retenu. Le ratio dette/PIB compare la dette à la production d’une année.", "Une dette de 900 Md€ et un PIB annuel de 1 000 Md€ donnent un ratio de 90 %."],
    ["Relier taux, refinancement et charge d’intérêts", "intermediate", "La dette déjà émise continue souvent à payer des coupons fixes. Quand les taux montent, la charge change au rythme des nouvelles émissions et de l’arrivée à échéance des anciens titres. L’inflation et la croissance influencent le dénominateur du ratio.", "Un pays dont la dette arrive à échéance rapidement voit en général ses conditions de financement se transmettre plus vite au budget."],
  ],
  "01/commerce": [
    ["Comprendre le solde commercial", "beginner", "Le solde commercial des biens correspond à la différence entre exportations et importations de biens. Le compte courant inclut aussi les services et certaines catégories de revenus. Un déficit s’interprète avec sa cause et son financement.", "Des exportations de biens de 200 et des importations de 230 donnent un solde des biens de −30."],
    ["Suivre une hausse de la facture d’importation", "intermediate", "Distingue volumes physiques, prix et change. Un choc énergétique peut creuser le déficit commercial d’un pays importateur alors même qu’il achète autant de barils.", "À volumes constants, une hausse du prix du pétrole en dollars et une baisse de l’euro poussent toutes deux la facture en euros vers le haut."],
  ],
  "02/institutions": [
    ["Identifier qui décide pour quelle monnaie", "beginner", "La BCE conduit la politique monétaire de la zone euro avec l’Eurosystème. Le FOMC décide de la politique monétaire de la Fed aux États-Unis. La Banque d’Angleterre, la Banque du Japon et la Banque nationale suisse ont leurs propres cadres.", "Associe zone euro et euro à la BCE, Japon et yen à la BoJ, Royaume-Uni et livre sterling à la Banque d’Angleterre."],
    ["Comparer les mandats", "intermediate", "La stabilité des prix est l’objectif principal de la BCE. Pour la Fed, stabilité des prix et emploi maximal constituent les deux grandes dimensions du mandat qu’elle met en avant. Les objectifs se lisent dans les textes de l’institution.", "Pour comparer deux décisions, commence par expliquer quel risque économique domine dans chaque zone."],
  ],
  "02/taux": [
    ["Suivre le passage du taux au crédit", "beginner", "Le taux directeur influence les conditions de financement à court terme puis les taux proposés aux ménages et entreprises. Les banques appliquent aussi des marges qui dépendent du risque, de la concurrence et de la durée du prêt.", "Un relèvement des taux peut rendre certains projets d’investissement trop coûteux et ralentir la demande."],
    ["Interpréter une politique restrictive", "intermediate", "Un resserrement vise à freiner la demande ou éviter une inflation persistante. Une baisse peut soutenir l’activité quand l’inflation le permet. Évalue l’orientation avec les taux réels anticipés et l’évolution du crédit.", "Si le taux nominal est inchangé et l’inflation attendue diminue, le taux réel approximatif augmente."],
  ],
  "02/instruments": [
    ["Opérations, facilités et liquidité", "intermediate", "Une banque centrale peut prêter des liquidités contre des garanties et rémunérer les dépôts des banques. Les conditions de ces opérations contribuent à guider les taux monétaires.", "Une banque qui se finance au jour le jour compare le coût du marché à celui des opérations et facilités disponibles."],
    ["Achats d’actifs et réduction du bilan", "advanced", "Lors d’un QE, des achats peuvent soutenir les prix des titres et influencer les rendements ou les primes de terme. Lors d’un QT, le bilan peut se réduire à mesure que des titres arrivent à échéance et que le produit n’est plus entièrement réinvesti.", "Distingue la décision sur le taux court et la décision sur le rythme de réduction du portefeuille."],
  ],
  "02/decisions": [
    ["Lire le communiqué et le calendrier", "intermediate", "Identifie le taux concerné, la date de décision, la prise d’effet et le texte sur les décisions à venir. Une banque centrale peut publier à part ses projections et le compte rendu.", "Compare ce qui est décidé aujourd’hui avec ce qui est indiqué sur la prochaine réunion."],
    ["Évaluer la surprise pour le marché", "advanced", "Les prix avant l’annonce reflètent les anticipations des investisseurs et les primes de risque. Une décision attendue peut provoquer peu de réaction. Le commentaire sur la trajectoire future peut déplacer les taux même quand le niveau du jour reste inchangé.", "Le taux reste stable mais la banque signale plus de hausses possibles. Les taux à deux ans peuvent monter."],
  ],
  "03/institutions": [
    ["Distinguer gouvernements et institutions", "beginner", "Commence par la zone concernée et le pouvoir de l’acteur. Dans l’Union européenne, le Conseil européen donne les grandes orientations. Les ministres nationaux se réunissent au Conseil de l’Union européenne. La Commission propose notamment des textes.", "Pour une décision, repère qui annonce, qui adopte et qui applique."],
    ["Vérifier un dirigeant ou une élection", "intermediate", "Identifie le titre précis, le pays, la date de référence et la prise de fonction. Un résultat électoral et une entrée en fonction peuvent être séparés dans le temps. Une coalition peut se former après les élections.", "Vérifie l’autorité électorale pour le résultat et la page institutionnelle pour la personne en poste."],
  ],
  "03/echanges": [
    ["Identifier les droits de douane et les sanctions", "beginner", "Un droit de douane taxe un bien importé selon un taux et des règles d’origine. Une sanction peut porter sur une personne, des financements, des biens ou des services. Consulte le texte pour connaître les exceptions et les dates.", "Un droit sur certains composants augmente potentiellement le coût d’un industriel en aval."],
    ["Suivre l’économie après une restriction", "intermediate", "Sépare l’effet direct sur les quantités ou coûts de livraison des réactions possibles des fournisseurs, des consommateurs et des autorités. La part importée, les stocks et les substituts déterminent le délai d’adaptation.", "Une nouvelle restriction peut déplacer le commerce vers d’autres fournisseurs si les qualités et les infrastructures sont compatibles."],
  ],
  "03/approvisionnement": [
    ["Repérer les routes et points de passage", "beginner", "Les détroits et canaux concentrent certains flux. Une perturbation peut imposer un détour, mobiliser davantage de navires et augmenter les délais.", "Un navire qui contourne l’Afrique au lieu de passer par Suez arrive plus tard. Le fret peut monter si assez de navires sont immobilisés plus longtemps."],
    ["Identifier la dépendance réellement critique", "intermediate", "Cartographie l’extraction, la transformation, le transport et la fabrication. Plusieurs fournisseurs du même pays peuvent partager la même infrastructure et le même risque.", "Des mines réparties entre plusieurs pays peuvent toutes envoyer leur minerai vers une seule région de raffinage."],
  ],
  "03/actualite": [
    ["Dater et qualifier un fait public", "intermediate", "En lisant une dépêche ou un communiqué, relève l’acteur, le périmètre, la date de publication et la prise d’effet. Une proposition, un accord politique et un texte en vigueur correspondent à des étapes différentes.", "Une autorité peut publier un accord aujourd’hui avec application dans plusieurs mois."],
    ["Relier un événement aux marchés", "advanced", "Construis une transmission plausible. Nomme le marché touché, le sens attendu sous tes hypothèses et les éléments qui peuvent interrompre le mécanisme. Pour affirmer un résultat observé, vérifie des données datées et comparables.", "Un risque sur une route pétrolière peut faire monter la prime de risque. Un relevé de prix seul ne permet pas d’attribuer le mouvement entier à cet événement."],
  ],
  "04/capitalisations": [
    ["Du cours par action à la taille de l’entreprise", "beginner", "La valeur de marché des capitaux propres correspond au cours multiplié par le nombre de titres en circulation. Avec plusieurs classes, mesure chaque classe une fois. Le cours d’une action mesure la valeur d’un seul titre.", "100 millions d’actions à 20 € donnent 2 milliards d’euros."],
    ["Lire un classement et estimer une capitalisation", "intermediate", "Vérifie la date, la liste des entreprises, la devise commune et le traitement des doubles cotations. Énonce la fourchette acceptée avant d’estimer, puis contrôle les millions et les milliards.", "Une réponse de 1,2 millier de milliards équivaut à 1 200 milliards dans la même devise."],
  ],
  "04/indices": [
    ["Associer un indice à son univers", "beginner", "Le CAC 40, le S&P 500 et le Nikkei 225 suivent des paniers d’actions différents. Chaque fournisseur choisit son univers et ses critères. Le niveau est exprimé en points.", "Demande si le rendement de l’indice intègre les dividendes avant de comparer deux performances."],
    ["Repérer les contributions et la concentration", "intermediate", "Si le poids d’une action est de 10 %, une hausse de 5 % apporte environ un demi-point, toutes choses égales. Deux paniers de même taille peuvent diverger si leurs poids diffèrent.", "Quatre poids de 10 % cumulent déjà 40 % du panier."],
  ],
  "04/devises": [
    ["Lire une paire sans inverser les monnaies", "beginner", "Dans EUR/USD, le nombre correspond à des dollars par euro. Si ce nombre monte, un euro achète davantage de dollars. Le cours USD/EUR est l’inverse.", "À 1,25 dollar par euro, 100 € valent 125 $. À la même date, un dollar vaut 0,80 €."],
    ["Interpréter une cotation et son impact", "intermediate", "Lors d’un achat ou d’une vente réelle, distingue cours de référence et prix exécutable. Pour expliquer l’effet d’un mouvement de change sur une entreprise, situe ses coûts, recettes et éventuelles couvertures.", "Un importateur européen qui paie en dollars est exposé à un dollar plus cher quand sa recette est en euros."],
  ],
  "04/matieres": [
    ["Reconnaître les contrats et leurs unités", "beginner", "Le pétrole Brent et le WTI se citent souvent en dollars par baril. L’or se cite en dollars par once troy. Le cuivre peut être coté par tonne métrique ou par livre selon la source et l’instrument.", "L’once troy vaut environ 31,1 grammes. Identifie l’unité avant de comparer deux prix."],
    ["Comparer les prix et leurs dates", "intermediate", "Aligne période d’observation, devise, lieu, échéance et définition. Une moyenne mensuelle et un prix quotidien peuvent tous deux être récents tout en répondant à des questions différentes.", "Pour un écart Brent–WTI, prends le même jour et des échéances comparables."],
  ],
  "04/producteurs": [
    ["Séparer production, exportation et réserves", "beginner", "La production mesure une quantité sur une période. Les réserves mesurent un stock estimé exploitable sous certaines conditions. Les exportations mesurent les flux vendus à l’étranger.", "Le Chili est un grand producteur de cuivre. La transformation du cuivre et l’expédition des produits raffinés peuvent se faire dans d’autres pays."],
    ["Lire un classement et expliquer les écarts", "intermediate", "Repère l’année, le produit, l’unité et le rôle des réexportations. Un pays peut produire beaucoup et exporter peu si sa consommation intérieure absorbe l’offre.", "Pour mesurer une dépendance industrielle, regarde les zones de transformation en plus des volumes extraits."],
  ],
  "05/bases": [
    ["Suivre un ordre sur un marché", "beginner", "Le vendeur affiche un prix auquel il accepte de vendre, l’ask. Le bid correspond au meilleur achat disponible. Un ordre au marché privilégie l’exécution. Un ordre à cours limité impose une borne sur le prix.", "Avec bid 99 et ask 101, un achat immédiat de petite taille croise généralement le prix vendeur à 101."],
    ["Comparer liquidité et risque d’exécution", "intermediate", "Le spread mesure un écart entre deux cotations. La profondeur décrit les quantités disponibles à chaque prix. Un carnet peu profond peut imposer plusieurs prix d’exécution pour un gros ordre.", "Demande la quantité disponible à 101 avant d’utiliser ce prix pour un ordre important."],
  ],
  "05/actions": [
    ["Ce que possède un actionnaire", "beginner", "Une action représente une participation aux capitaux propres. Elle peut donner le droit de vote et droit à un dividende s’il est décidé. En liquidation, les créanciers passent généralement avant les actionnaires.", "Une entreprise voit son bénéfice reculer. Le dividende peut être réduit si le conseil et les actionnaires le décident selon le cadre applicable."],
    ["Comparer valeur des actions et valeur d’entreprise", "intermediate", "Pour comparer l’activité financée par dette et fonds propres, la valeur d’entreprise ajoute notamment la dette nette à la valeur des actions. Choisis un multiple dont numérateur et dénominateur décrivent le même périmètre financier.", "Une capitalisation de 80 Md€ et une dette nette de 20 Md€ donnent environ 100 Md€ de valeur d’entreprise dans le cas simple."],
  ],
  "05/obligations": [
    ["Lire les flux d’une obligation", "beginner", "Une obligation est un contrat de dette. Le coupon correspond au paiement prévu. Le nominal est la base de calcul et souvent le principal remboursé à l’échéance. Le prix d’achat peut s’écarter du nominal.", "Une obligation de 1 000 € paie un coupon annuel de 4 %, soit 40 € tant que l’émetteur honore ses engagements."],
    ["Comprendre le lien prix–rendement", "intermediate", "Les flux fixes sont actualisés au rendement exigé. Si le rendement monte, leur valeur actuelle baisse. La duration modifiée donne une approximation de la variation en pourcentage pour un petit mouvement de taux, à flux et crédit inchangés.", "Une duration de 5 donne une baisse proche de 5 % pour une hausse de rendement d’un point, approximation de premier ordre."],
  ],
  "05/contrats": [
    ["Décrire le contrat, les parties et l’échéance", "beginner", "Un forward fixe aujourd’hui les conditions d’une transaction à venir. Un future est standardisé et s’échange sur un marché organisé. Les appels de marge peuvent créer un besoin de trésorerie avant l’échéance.", "Un importateur qui doit acheter des dollars dans trois mois peut fixer à l’avance le change correspondant."],
    ["Choisir une couverture et nommer le risque restant", "intermediate", "Fais correspondre le sens, le montant, la date et le sous-jacent de la couverture à l’exposition. Dans un swap de taux ordinaire, les parties échangent des intérêts calculés sur un notionnel, par exemple fixe contre variable.", "Une entreprise à dette variable peut payer un taux fixe et recevoir le taux variable dans un swap. Le risque d’écart d’indice subsiste si les références diffèrent."],
  ],
  "05/options": [
    ["Call, put, strike et prime", "beginner", "L’acheteur d’un call paie une prime pour le droit d’acheter au strike. L’acheteur d’un put paie pour le droit de vendre au strike. L’option définit une échéance et des modalités d’exercice.", "Un call de strike 100 permet de capter 20 de résultat brut à l’échéance si le sous-jacent vaut 120."],
    ["Lire le résultat net à l’échéance", "intermediate", "Le résultat brut d’un call acheté vaut le maximum entre zéro et le prix final diminué du strike. Pour un put, inverse la différence. Retire ensuite la prime pour obtenir le résultat net de l’acheteur dans un modèle sans frais.", "Un put de strike 100 payé 4 avec un cours final de 90 donne 10 de résultat brut et 6 de profit net."],
    ["Comparer deux protections", "advanced", "Un put acheté avec une action crée un plancher à l’échéance, prime comprise dans le résultat. Un contrat à terme peut fixer un prix dès aujourd’hui. Compare le coût initial, la protection et la participation à un mouvement favorable.", "Pour une recette future incertaine, un contrat de montant fixe peut surcouvrir. Une option donne un droit et coûte une prime."],
  ],
  "05/structures": [
    ["Ouvrir le produit et regarder ses flux", "beginner", "Un produit structuré combine des clauses pour obtenir un paiement lié à un indice, une action ou une autre référence. Lis l’émetteur, le nominal, l’échéance et les conditions de remboursement. L’émetteur doit pouvoir honorer le contrat.", "Un titre rembourse le nominal à trois ans et ajoute un coupon si un indice dépasse un seuil, sous réserve de la solvabilité de l’émetteur."],
    ["Lire barrière, coupon et scénarios", "intermediate", "Précise quel seuil est testé, à quelles dates et ce que déclenche le franchissement. Un coupon conditionnel et une protection du capital peuvent obéir à deux tests différents.", "Si la barrière du capital est observée seulement à l’échéance, une baisse passagère peut avoir un effet différent d’une clôture finale au-dessous du seuil."],
    ["Présenter le produit en entretien", "advanced", "Décris d’abord la proposition, puis donne un scénario favorable, un intermédiaire et un défavorable. Nomme le risque d’émetteur, le risque de liquidité et la condition de remboursement. Explique le risque restant avec les données du contrat.", "Avec un nominal de 1 000 €, une clause de participation intégrale à une baisse de 40 % peut ramener le remboursement à 600 € dans le scénario prévu par la clause."],
  ],
  "05/cas": [
    ["Expliquer un produit en entretien", "beginner", "Commence par une phrase qui nomme le contrat et les parties. Décris ensuite les flux, leur calendrier et la source du risque. Termine par un exemple chiffré court.", "Une obligation est un prêt négociable à un émetteur. Pour un nominal de 100 et un coupon de 4 %, l’investisseur reçoit 4 par an tant que l’émetteur paie."],
    ["Comparer des couvertures pour un même client", "intermediate", "Énonce l’exposition puis choisis le sens de la protection. Pour un importateur qui doit payer une devise, un achat à terme fixe sa contre-valeur. Une option d’achat protège d’une hausse tout en laissant le choix de profiter d’une baisse, contre une prime.", "Demande si le montant et la date de paiement sont connus. Une couverture ferme peut devoir être annulée si la commande disparaît."],
    ["Tester le risque restant avec deux scénarios", "advanced", "Vérifie les dates, la devise, la qualité et le support. Pose ensuite deux mouvements opposés, écris les flux avec leur signe et additionne le résultat de la couverture. Si les références diffèrent, explique comment leur écart crée un risque de base.", "Un transporteur couvre un prix de carburant avec du brut. Il reste exposé à un mouvement de l’écart entre le prix de son carburant et celui du brut."],
  ],
  "06/pourcentages": [
    ["Utiliser un dixième, un quart et une moitié", "beginner", "Décale la virgule pour 10 %. Pour 5 %, divise ce résultat par deux. Pour 25 %, divise deux fois par deux. Pour une variation, rapporte l’écart à la valeur initiale.", "De 80 à 100, l’écart de 20 est un quart de 80, donc +25 %."],
    ["Enchaîner deux variations et convertir les points", "intermediate", "Prends une base de 100 et applique chaque variation au nouveau montant. Un point de pourcentage vaut 100 points de base.", "100 → 110 → 99 avec +10 % puis −10 %. Avec un taux de 2 % qui augmente de 25 pb, obtiens 2,25 %."],
  ],
  "06/unites": [
    ["Passer des unités aux millions et aux milliards", "beginner", "Chaque marche unités, milliers, millions, milliards multiplie ou divise par mille. Mets les grandeurs à la même échelle avant une addition ou un ratio.", "2 Md€ moins 500 M€ donnent 1 500 M€. Tu peux saisir 1,5 et sélectionner milliards d’euros."],
    ["Choisir un raccourci pour une conversion", "intermediate", "Traite les facteurs ronds à part. À 1,25 dollar pour un euro, rappelle-toi que 125 dollars valent 100 euros. Pour une division par huit, prends trois fois la moitié.", "250 $ valent 200 €. 1 000 ÷ 8 donne 500 → 250 → 125."],
  ],
  "06/interets": [
    ["Calculer les intérêts simples", "beginner", "Multiplie le capital initial par le taux puis par la fraction d’année. Vérifie si la question demande les intérêts seuls ou le capital final.", "1 000 € à 4 % par an donnent 40 € sur un an et 20 € sur six mois."],
    ["Composer des intérêts sur deux ans", "intermediate", "Applique une fois le taux au capital initial et une fois au capital augmenté. Tu peux additionner deux intérêts de départ et l’intérêt sur le premier intérêt.", "1 000 € à 10 % donnent 100 € chaque année sur le capital de départ et 10 € sur le premier coupon réinvesti. Total final 1 210 €."],
  ],
  "06/estimations": [
    ["Choisir une unité et décomposer", "beginner", "Une estimation lie un nombre de personnes ou de biens à une consommation, une fréquence ou un prix. Annonce l’hypothèse et contrôle le résultat en milliers ou millions.", "120 000 habitants à 2,4 personnes par foyer donnent environ 50 000 foyers."],
    ["Segmenter et vérifier une fourchette", "intermediate", "Calcule le résultat de chaque segment et additionne. Identifie l’hypothèse qui change le plus le total et rectifie la précision affichée.", "100 000 achats à 10 € et 50 000 à 20 € font chacun 1 M€, soit environ 2 M€ au total."],
  ],
};
