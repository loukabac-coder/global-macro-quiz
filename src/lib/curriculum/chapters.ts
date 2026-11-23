import type { Chapter, Section } from "@/lib/courses";
import type { LevelId } from "@/lib/modules";
import { DIFFICULTY_FR } from "@/lib/quiz";

const ecb = { label: "BCE · stratégie de politique monétaire", url: "https://www.ecb.europa.eu/mopo/strategy/strategy-review/ecb.strategyreview202506_strategy_statement.en.html" };
const fed = { label: "Fed · objectifs et instruments", url: "https://www.federalreserve.gov/monetarypolicy/monetary-policy-what-are-its-goals-how-does-it-work.htm" };
const fomc = { label: "Fed · fonctionnement du FOMC", url: "https://www.federalreserve.gov/monetarypolicy/fomc.htm" };
const bis = { label: "BRI · enquête sur le marché des changes, avril 2025", url: "https://www.bis.org/media-releases/20250930-global-fx-trading-hits-96-trillion-day-april-2025-and-otc-interest-rate-derivatives-surge-79" };
const basis = { label: "BRI · parité couverte et cross-currency basis", url: "https://www.bis.org/publ/qtrpdf/r_qt1609e.htm" };
const energy = { label: "CME · livraison du WTI à Cushing", url: "https://www.cmegroup.com/education/courses/introduction-to-crude-oil/crude-oil-fundamentals/delivery-of-wti-futures" };
const curve = { label: "CME · courbes et spreads calendaires de l’énergie", url: "https://www.cmegroup.com/articles/whitepapers/trading-energy-calendar-spread-options.html" };

function section(title: string, ...paragraphs: string[]): Section {
  return { title, paragraphs };
}

function chapter(
  slug: string, category: string, stage: LevelId, code: string, title: string, intro: string,
  sections: Section[], remember: string[], sources: NonNullable<Chapter["sources"]>,
): Chapter {
  return { slug, category, difficulty: stage, level: DIFFICULTY_FR[stage], code, title, intro, sections, remember, sources };
}

export const curriculumChapters: Chapter[] = [
  chapter("banques-centrales", "central-banks", "beginner", "BC1", "Banques centrales, BCE et Fed",
    "Découvre à quoi sert une banque centrale, qui décide pour l’euro et le dollar et comment un taux directeur influence un crédit.",
    [
      section("La banque des banques",
        "Une banque centrale conduit la politique monétaire d’un pays ou d’une zone. Dans la zone euro, l’Eurosystème émet les billets. La BCE participe aussi à la surveillance des banques, dans une mission distincte de la politique monétaire.",
        "Les banques commerciales y détiennent des réserves et peuvent obtenir certains financements. Un particulier ouvre son compte courant auprès d’une banque commerciale ou d’un établissement de paiement.",
        "Une banque centrale indépendante prend ses décisions dans le cadre de son mandat légal. Cette autonomie aide à résister aux pressions politiques de court terme. Elle rend compte de ses décisions publiquement."),
      section("Inflation et taux directeurs",
        "L’inflation est une hausse générale et durable des prix. La déflation est une baisse durable du niveau général. Elle peut inciter à remettre des achats à plus tard et faire peser davantage le poids des dettes en termes réels.",
        "La BCE vise environ 2 % d’inflation à moyen terme. La Fed retient aussi environ 2 % à long terme. Une petite inflation positive laisse une marge contre la déflation et donne davantage de place pour réduire les taux lors d’un choc.",
        "Un taux directeur est fixé par une banque centrale. Il influence le coût des nouveaux prêts et la rémunération de l’épargne. Une inflation durablement élevée peut conduire à une hausse des taux pour freiner la demande. Une activité faible et une inflation basse peuvent appeler une baisse."),
      section("La BCE et l’euro",
        "BCE signifie Banque centrale européenne. Elle siège à Francfort et a été créée en 1998. L’euro a été lancé en 1999, puis les billets et pièces ont été mis en circulation en 2002.",
        "La BCE conduit la politique monétaire de la zone euro avec les banques centrales nationales de cette zone. Son objectif principal est la stabilité des prix. Les décisions reviennent au Conseil des gouverneurs, qui tient généralement une réunion monétaire toutes les six semaines environ.",
        "La facilité de dépôt rémunère l’argent que les banques placent jusqu’au lendemain auprès de leur banque centrale nationale. Son taux est le principal repère opérationnel de la BCE pour orienter sa politique."),
      section("La Fed et les autres banques centrales",
        "La Réserve fédérale américaine, appelée Fed, a été instituée en 1913. Son Conseil des gouverneurs siège à Washington et elle conduit la politique monétaire du dollar américain.",
        "Son double mandat associe prix stables et emploi maximal. Le comité du FOMC décide de la politique monétaire, généralement lors de huit réunions programmées par an. Il annonce une fourchette cible pour le taux des fed funds.",
        "La Banque d’Angleterre (BoE, Londres) conduit la politique monétaire de la livre sterling. La Banque du Japon (BoJ, Tokyo) s’occupe du yen et la Banque nationale suisse (BNS ou SNB) du franc suisse."),
    ], ["BCE : euro et stabilité des prix.", "Fed : dollar américain, stabilité des prix et emploi maximal.", "Des taux directeurs plus hauts rendent généralement les nouveaux prêts plus chers."], [ecb, fed, fomc]),

  chapter("banques-centrales-intermediaire", "central-banks", "intermediate", "BC2", "Instruments et langage des banques centrales",
    "Lis une décision de taux, distingue les instruments et repère ce que le discours dit sur l’inflation et l’emploi.",
    [
      section("Des instruments différents",
        "La facilité de dépôt rémunère les liquidités laissées pour une nuit. La facilité de prêt marginal permet un emprunt au jour le jour contre des garanties admissibles. Les opérations principales de refinancement fournissent aussi des liquidités aux banques selon leur calendrier.",
        "On calcule l’écart entre deux taux en points de base. Exemple fictif : prêt marginal à 2,40 % et dépôt à 2,00 %. Leur écart de 0,40 point vaut 40 pb.",
        "La Fed annonce une fourchette pour le taux des fed funds, taux d’emprunt au jour le jour entre institutions admissibles. Dans un exemple fictif, passer de 4–4,25 % à 3,75–4 % revient à abaisser chacune des bornes de 25 pb."),
      section("Cible et indices",
        "La BCE s’appuie sur l’IPCH de la zone euro. La Fed se réfère à la variation annuelle de l’indice des prix PCE. Un indice américain CPI ou IPC et le PCE suivent tous deux les prix, selon des périmètres et pondérations différents.",
        "Un indice sous-jacent hors énergie et alimentation aide à distinguer des pressions plus persistantes des variations de postes volatils. La cible symétrique de la BCE traite les écarts au-dessus et au-dessous de 2 % comme indésirables, à moyen terme."),
      section("Deux étapes de raisonnement",
        "Une prise de position hawkish, ou faucon, donne davantage de poids au risque d’inflation et penche vers des taux plus hauts ou durablement élevés. Un discours dovish, ou colombe, peut privilégier un assouplissement lorsque la demande et l’emploi faiblissent.",
        "Une hausse de taux modifie plus vite les offres de nouveau crédit et les emprunts à taux variable. Le taux d’un prêt à taux fixe déjà signé reste celui du contrat. Pour un placement à 4 % avec 2,5 % d’inflation attendue sur le même horizon, le rendement réel ex ante s’approxime à 1,5 %."),
      section("Lire le calendrier et les projections",
        "Le FOMC peut se réunir en dehors de ses huit réunions programmées. Le dot plot du SEP donne les évaluations individuelles des participants sur le niveau approprié des fed funds, sous leurs propres hypothèses. Ce graphique ne constitue pas un engagement.",
        "L’euro est devenu la monnaie officielle en 1999. Les billets et pièces ont suivi en 2002. Les décisions de politique monétaire sont publiées avec leur date, distincte de la date d’entrée en vigueur."),
      section("Lire les publications datées",
        "Le tableau des décisions donne le jour et le sens de la dernière annonce de chaque banque centrale suivie. Ouvre le communiqué pour retrouver les taux concernés, l’argumentaire et la date d’entrée en vigueur.",
        "Le tableau des taux utilise les observations en vigueur. Une décision de maintien peut être récente alors que le dernier changement de taux remonte à plusieurs réunions."),
    ], ["Un taux directeur, un IPC et une cible d’inflation sont trois choses distinctes.", "L’écart entre deux taux en % se multiplie par 100 pour obtenir des pb."],
    [ecb, fed, fomc]),

  chapter("banques-centrales-avance", "central-banks", "advanced", "BC3", "Transmission, QE et QT",
    "Relie une surprise monétaire aux obligations, au crédit, au change et à la demande.",
    [
      section("De la décision au marché",
        "Calcule d’abord la surprise : décision moins consensus. Si une hausse attendue de 25 pb devient une hausse de 50 pb, la surprise vaut +25 pb. Si elle relève surtout les taux attendus à court terme, le rendement à deux ans peut monter plus que le dix ans et la courbe 2–10 ans s’aplatit.",
        "Toutes choses égales par ailleurs, une hausse inattendue des taux américains peut soutenir le dollar si le différentiel attendu en faveur des États-Unis se creuse. La communication prospective, ou forward guidance, peut bouger les taux anticipés sans décision immédiate."),
      section("Bilan, liquidité et duration",
        "Le QE consiste à acheter des titres en quantité. Les achats peuvent comprimer la prime de terme et abaisser les taux longs, ce qui détend les conditions financières. Quand leur prix monte, le rendement de titres à flux fixes baisse.",
        "Le QT réduit le portefeuille. Une méthode consiste à ne réinvestir qu’une partie des titres qui arrivent à échéance. Le secteur privé doit alors potentiellement absorber davantage de duration.",
        "Un prêt temporaire contre garantie répond à un besoin de liquidité. Une banque solvable peut en avoir besoin même si ses actifs couvrent ses passifs. Des critères de crédit plus stricts peuvent freiner le financement des ménages malgré une baisse des taux."),
      section("Chocs et taux réels",
        "Une pénurie d’énergie peut relever les prix et réduire la production. Une hausse des taux peut freiner les effets indirects sur les prix, mais accentuer le ralentissement. Des anticipations ancrées près de la cible limitent un mécanisme auto-entretenu.",
        "À taux nominal donné, une baisse de l’inflation attendue élève le taux réel. Un taux réel supérieur au taux neutre estimé suggère une orientation restrictive, sous réserve de l’incertitude sur ce taux neutre.",
        "Exemple de règle de Taylor, avec des taux en % : i = r* + π + 0,5(π − 2) + 0,5y. Si r* = 1, π = 4 et y = −2, i = 5 %. La règle est un repère dépendant des coefficients et des hypothèses."),
      section("Défendre une parité",
        "Pour soutenir sa devise dans un régime de change fixe, une banque centrale peut vendre des réserves en monnaie étrangère et racheter la monnaie locale. Cela réduit son stock de réserves."),
    ], ["Surprise = décision moins consensus.", "Guidance, bilan et critères de prêt sont des canaux distincts."], [ecb, fed]),

  chapter("banques-centrales-expert", "central-banks", "expert", "BC4", "Lire un communiqué comme sur un desk",
    "Décompose la décision du jour, la trajectoire anticipée et les primes avant d’expliquer les mouvements croisés.",
    [
      section("Trajectoire déjà intégrée dans les prix",
        "Compte séparément la surprise sur la décision et la surprise sur les prochains mois. Une hausse entièrement attendue peut coïncider avec une baisse des taux à terme si le communiqué annonce plus de baisses futures que prévu.",
        "Repère ce qui change dans le diagnostic. Une nouvelle insistance sur les risques d’emploi peut déplacer la trajectoire, même si le taux du jour est inchangé. Deux hausses de même taille peuvent déplacer le change si une seule surprend.",
        "Un OIS est un swap indexé sur un taux au jour le jour. Son prix donne un repère de trajectoire, avec des primes possibles. Avec seulement deux issues, 0 ou +25 pb, et un prix de +15 pb hors primes, la probabilité implicite de hausse est 15 / 25 = 60 %."),
      section("Courbe, liquidité et inflation",
        "Les taux longs comprennent les anticipations de taux courts et une prime de terme. Un QT plus rapide que prévu peut relever la prime de terme, même si l’anticipation sur les taux courts reste stable.",
        "Le DV01 est une sensibilité en monnaie à un point de base. Un aplatissement peut profiter à une position longue de duration à dix ans et courte à deux ans, à DV01 opposés, lorsque le dix ans baisse par rapport au deux ans.",
        "L’écart entre taux nominal et taux réel de titres comparables fournit une compensation d’inflation. Il mêle anticipations, risque d’inflation et différences de liquidité.",
        "Des taux restrictifs, un prêt temporaire à une banque et une ligne de swap en dollars peuvent coexister. Les derniers outils traitent les tensions de financement. Le taux directeur vise la politique monétaire."),
      section("Cas de plusieurs chocs",
        "Compare le taux réel approché au neutre estimé : avec un nominal de 4,5 %, une inflation attendue de 2,7 % et un réel neutre de 1,2 %, l’écart est de 60 pb.",
        "Si des taux courts montent après une surprise restrictive et que le pétrole monte sur une coupure de production distincte, attribue chaque réaction au canal pertinent. Le pétrole peut monter en même temps que des actions sensibles à l’actualisation baissent."),
    ], ["Sépare décision, trajectoire déjà intégrée et primes.", "Compare les anticipations aux deux volets du mandat de la Fed."], [ecb, fed, fomc]),

  chapter("change", "fx", "beginner", "FX1", "Lire une paire de devises",
    "Comprends ce que signifient EUR/USD et USD/JPY avant de calculer ou d’interpréter une variation.",
    [
      section("Deux devises, un prix",
        "Une devise est la monnaie d’un pays ou d’une zone. Dans EUR/USD, EUR est la devise de base et USD est celle de cotation. Le prix indique combien de dollars valent un euro.",
        "Exemple fictif : EUR/USD = 1,10. Un euro vaut 1,10 $. Mille euros valent donc 1 100 $ avant frais. USD/CHF = 0,90 signifie qu’un dollar vaut 0,90 franc suisse."),
      section("Chercher le sens de la variation",
        "Si la paire monte, la devise écrite à gauche s’apprécie face à celle de droite. Si EUR/USD baisse, l’euro perd de la valeur en dollars et le dollar gagne de la valeur en euros.",
        "USD/JPY qui monte de 140 à 155 signifie qu’il faut davantage de yens pour acheter un dollar. Le yen s’est donc déprécié contre le dollar."),
      section("Premiers repères",
        "EUR/USD, USD/JPY, GBP/USD et USD/CHF sont des exemples de grandes paires. GBP est la livre sterling, JPY le yen et CHF le franc suisse.",
        "Le cours au comptant, ou spot, concerne un échange avec règlement proche. Le franc suisse est souvent traité comme une devise refuge. Les flux de refuge dépendent de la situation."),
    ], ["La première devise est celle dont on donne le prix.", "Quand la paire monte, la devise de gauche gagne contre celle de droite."], [bis]),

  chapter("change-intermediaire", "fx", "intermediate", "FX2", "Pips, spreads et conversions croisées",
    "Utilise une cotation à deux prix, compte les pips et trouve un cours croisé avec les bonnes unités.",
    [
      section("Cotation de marché",
        "Le bid est le cours auquel le teneur de marché achète la devise de base. L’ask est celui auquel il la vend. Pour EUR/USD 1,2040–1,2043, un client achète des euros à 1,2043 $ et les vend à 1,2040 $. Le spread vaut 0,0003, soit 3 pips.",
        "Un pip vaut normalement 0,0001 pour EUR/USD et 0,01 pour USD/JPY. GBP/USD est appelé cable. Swissie désigne couramment le franc suisse dans le langage de marché."),
      section("Croiser et inverser",
        "EUR/USD = 1,10 et USD/JPY = 150 donnent EUR/JPY = 165, car dollars par euro × yens par dollar = yens par euro.",
        "Quand les deux paires sont cotées en dollars, divise. EUR/USD = 1,20 et GBP/USD = 1,50 donnent 1,20 / 1,50 = 0,80 GBP pour 1 EUR.",
        "EUR/USD = 1,25 donne 1 / 1,25 = 0,80 euro par dollar. Pour convertir une facture en dollars en euros, divise son montant par EUR/USD, avant frais."),
      section("Exposition au change",
        "Un importateur de la zone euro paie davantage en euros si le dollar s’apprécie. Un exportateur qui reçoit des dollars en obtient moins en euros quand EUR/USD monte. Le même calcul s’applique à un prix de pétrole en dollars.",
        "La variation relative se calcule en divisant l’écart par la valeur initiale. De 1,20 à 1,26, EUR/USD augmente de 5 %. En régime de change ancré, une autorité défend une parité ou une bande."),
    ], ["Pour un taux croisé, écris les unités et simplifie la devise commune.", "Un client achète au prix ask et vend au prix bid."], [bis]),

  chapter("change-avance", "fx", "advanced", "FX3", "Forwards, carry et chocs de change",
    "Relie le change aux taux et aux flux, puis choisis une couverture selon le sens et la date du paiement.",
    [
      section("Variation des taux et régime de change",
        "Une hausse surprise des taux peut soutenir une devise si son rendement attendu augmente relativement aux autres. Une ruée vers les dollars peut l’emporter sur les taux, par exemple lors d’un besoin de liquidité ou d’une fuite vers des actifs refuges.",
        "Un pays à change fixe peut acheter sa monnaie avec ses réserves étrangères. Un importateur d’énergie peut souffrir d’une hausse du pétrole, via le coût de ses importations. Un pétrole plus cher en USD et un dollar plus fort cumulent leurs effets en euros."),
      section("Termes, points et couverture",
        "Un terme fixe aujourd’hui le taux utilisé pour un échange futur. Un exportateur qui encaissera des dollars les vend à terme. Un importateur qui devra payer en dollars les achète à terme. Un contrat ferme sur un montant estimé peut surcouvrir un encaissement plus faible.",
        "Le cours à terme vaut spot plus points de terme exprimés dans la même unité. Si EUR/USD vaut 1,1000 et les points −40 pips, le terme vaut 1,0960.",
        "Sans base ni coûts et pour un même horizon, EUR/USD à terme vaut spot × facteur de placement USD / facteur de placement EUR. Un taux USD plus élevé pousse ce cours à terme au-dessus du spot. Le cours à terme est un prix de couverture, le spot futur reste inconnu.",
        "Un swap de change échange deux devises à une date proche puis effectue l’échange inverse à terme."),
      section("Carry et débouclement",
        "Un carry non couvert emprunte une devise peu rémunérée pour placer dans une devise mieux rémunérée. Le gain de taux peut disparaître si la devise du placement baisse. Quand plusieurs opérateurs ferment le carry, ils rachètent la devise empruntée, ce qui peut la soutenir."),
    ], ["Aligne le montant et l’échéance du terme sur le flux commercial.", "Différentiel de taux, demande de liquidité et aversion au risque peuvent se contredire."], [bis, basis]),

  chapter("change-expert", "fx", "expert", "FX4", "Parités, arbitrage et risque de couverture",
    "Compare une cotation exécutable à un prix théorique et décompose le risque qui reste après couverture.",
    [
      section("Parité couverte, non couverte et basis",
        "Sans arbitrage ni frais, les deux chemins d’un placement couvert donnent le même résultat. Avec spot EUR/USD 1,20, taux USD de 5 % et EUR de 0 % à un an, le terme vaut 1,20 × 1,05 / 1 = 1,26 USD/EUR.",
        "La parité couverte fixe le taux applicable à la reconversion. La parité non couverte repose sur le change futur attendu, qui peut être différent du cours réalisé. Le cross-currency basis mesure un écart aux conditions théoriques de parité couverte. Le financement, la demande de dollars et les limites de bilan peuvent le maintenir."),
      section("Raisonner au bid ou à l’ask",
        "Une vente EUR contre USD puis USD contre JPY se fait aux deux bids. Avec 1,10/1,11 et 150/151, le bid EUR/JPY équivaut à 1,10 × 150 = 165. Le prix vendeur du cours inverse est 1 / bid du cours initial.",
        "Un arbitrage triangulaire achète au cours vendeur le moins cher et revend au cours acheteur le plus élevé, si les cotations sont fermes et les coûts couverts."),
      section("Fragilité de la couverture et du carry",
        "Si un flux est retardé, compense le contrat sur l’ancienne date et établis la même couverture pour la nouvelle. Si la couverture est partielle, convertis chaque part avec son propre cours. Une option d’achat ou de vente permet de conserver un potentiel favorable en échange d’une prime.",
        "Pour un carry, multiplie le capital par le facteur de placement et le facteur de change, puis retranche la dette avec intérêts. À +6 % de revenu local et −5 % de change, un placement de 100 vaut 100,70 unités de financement. Une dette à 2 % vaut 102.",
        "Un pays ne peut maintenir à la fois un change fixe, une libre circulation des capitaux et une indépendance complète des taux. Lors d’une divergence Fed–BCE, compare les surprises de trajectoire des deux côtés et les flux de risque."),
    ], ["Un terme et un spot futur sont deux objets différents.", "Un cours théorique se compare au bid ou à l’ask que tu peux exécuter."], [bis, basis]),

  chapter("matieres-premieres", "commodities", "beginner", "MP1", "Pétrole, or et matières premières",
    "Reconnais les familles, les unités de cotation et les références du brut.",
    [
      section("Des biens physiques",
        "Le pétrole, le gaz, l’or, le cuivre et le blé sont des matières premières. Le blé est agricole, le cuivre est un métal industriel et l’or un métal précieux.",
        "Le pétrole brut se cote généralement en dollars par baril. Un baril représente environ 159 litres. Le Brent est associé à la mer du Nord et sert de référence internationale. Le WTI est une référence du brut américain.",
        "L’OPEP+ regroupe des pays producteurs qui coordonnent notamment leurs objectifs de production."),
      section("Or et unités",
        "Le marché cote généralement l’or en dollars par once troy. Une once troy vaut environ 31 grammes. L’or est recherché par certains investisseurs pour diversifier leur patrimoine ou en valeur refuge. Cela ne garantit pas son prix.",
        "Pour s’exercer aux ordres de grandeur, imagine un baril coté 74 $ et une once d’or cotée 3 200 $. Ces exemples fictifs illustrent les dizaines et les milliers de dollars. Les cours de marché sont accessibles dans Données macro avec leur date."),
    ], ["Pétrole : dollars par baril.", "Or : dollars par once troy.", "Brent et WTI sont deux références différentes."], [energy]),

  chapter("matieres-premieres-intermediaire", "commodities", "intermediate", "MP2", "Offre, demande et prix du brut",
    "Interprète un mouvement des stocks ou de la production et convertis des prix en unités comparables.",
    [
      section("Offre et demande",
        "Une réduction de production peut faire monter les prix à demande inchangée. Des stocks qui augmentent plus que prévu peuvent indiquer un marché physique moins tendu. Il faut examiner les entrées, la demande et la capacité de stockage.",
        "Une reprise industrielle peut soutenir le cuivre. Quand la hausse du brut se transmet au carburant, elle augmente directement la contribution de l’énergie à l’inflation globale."),
      section("Comparer le Brent, le WTI et les prix en euros",
        "Le WTI de référence a un point de livraison à Cushing, dans l’Oklahoma. Les bruts diffèrent par la qualité, le coût du transport et le lieu de livraison.",
        "Un spread Brent–WTI se mesure à la même date et avec des prix de même nature ou même échéance. Si le Brent vaut 82 $ et le WTI 77 $, l’écart vaut 5 $ par baril.",
        "Un baril de 72 $ coûte 60 € à EUR/USD = 1,20. Si une once de 31 g d’or vaut 3 100 $, le gramme vaut environ 100 $. Indique la devise, l’unité et la date pour un prix réel."),
      section("Comptant et terme",
        "Le spot concerne une livraison proche. Un terme porte sur une date future et permet de fixer un prix. Un producteur qui veut stabiliser ses recettes vend à terme. Un industriel qui veut sécuriser ses achats se couvre en achetant à terme."),
    ], ["Compare les mêmes dates, unités et échéances.", "Une variation des stocks seule ne dit pas si l’offre ou la demande a bougé."], [energy, curve]),

  chapter("matieres-premieres-avance", "commodities", "advanced", "MP3", "Courbes, portage et liens entre marchés",
    "Lis la pente des futures, distingue le rendement du roulement et identifie le facteur dominant sur le pétrole et l’or.",
    [
      section("Contango et backwardation",
        "Si le prix proche est inférieur au prix différé, ce segment est en contango. Si le proche est supérieur au différé, il est en backwardation. Le financement et le stockage peuvent soutenir le prix différé. Une pénurie immédiate accroît la valeur d’avoir du stock aujourd’hui.",
        "Sur une courbe inchangée dans le temps, un long peut subir la convergence vers des prix proches plus bas en contango et bénéficier de la convergence en backwardation. L’effet de roulement est une composante du rendement. Une variation de tout le niveau de la courbe peut le dominer.",
        "Pour un futures, le P&L d’un long vaut variation du prix × quantité. Deux mille barils et une hausse de 3 $ donnent +6 000 $. Un hedge en WTI sur un achat de Brent laisse le risque de l’écart entre les deux références."),
      section("Dollar, taux réels et inflation",
        "Un dollar moins cher peut soutenir le prix USD d’une matière première en améliorant le pouvoir d’achat des clients dont la devise s’apprécie. Si un choc d’offre frappe le pétrole d’un pays importateur, le coût de ses importations peut monter en même temps que l’activité ralentit.",
        "L’or ne paie pas de coupon. Si les rendements réels montent et que les autres facteurs restent constants, son coût d’opportunité augmente. L’appétit pour le risque et le dollar peuvent faire varier la réaction. La demande de cuivre est plus directement liée à l’industrie.",
        "Une hausse du brut comprime la marge simplifiée du raffineur si le prix des produits raffinés et les autres coûts restent fixes. Les contraintes de stockage à Cushing concernent particulièrement les échéances WTI qui approchent de la livraison."),
    ], ["Courbe ascendante sur le segment : contango.", "Courbe descendante : backwardation.", "Vérifie le facteur dominant avant de conclure sur l’or ou le pétrole."], [energy, curve]),

  chapter("matieres-premieres-expert", "commodities", "expert", "MP4", "Spreads, ratios et risques de desk",
    "Décompose les jambes d’une couverture, lis un bilan pétrolier et distingue la surprise du niveau déjà anticipé.",
    [
      section("Positions relatives",
        "Une position longue Brent et courte WTI gagne quand Brent moins WTI s’élargit, à quantités égales. Un long proche et court lointain profite d’une hausse de la pente proche moins lointain. Calcule chaque jambe signée avant de l’additionner.",
        "Compare les métaux sur la même unité et au même instant. Le ratio or/argent est le prix de l’or divisé par celui de l’argent. Il peut augmenter quand les deux prix baissent, si l’argent baisse plus vite. Deux échéances qui montent du même montant gardent leur écart."),
      section("Stockage, transport et liquidité",
        "Si tu peux acheter le physique, le stocker et le vendre à terme, compare le différentiel au coût de portage total. Spot 70 $, terme 76 $, portage 4 $ donnent 2 $ bruts par baril si la livraison, les coûts et les prix sont verrouillés.",
        "La valeur de disposer immédiatement de la marchandise peut dominer le coût de portage. À l’inverse, une saturation du stockage peut amener le contrat proche à un prix négatif si le détenteur paie pour se défaire d’une livraison.",
        "Un écart de transport, de qualité ou d’échéance laisse un risque de base. Un hedge vendeur peut nécessiter un appel de marge en espèces avant l’encaissement de la recette physique."),
      section("Plusieurs chocs et plusieurs instruments",
        "Une baisse de production plus modeste que celle intégrée dans les prix peut faire reculer le brut. Pour distinguer une baisse des stocks liée à la consommation d’une baisse liée aux importations, réconcilie les flux physiques.",
        "L’or peut monter malgré des taux réels plus hauts si la demande de refuge domine. À l’importation, isole la couverture du prix USD de celle du change, puis convertis chaque montant au taux applicable. Pour un indice à poids fixes, multiplie chaque hausse de prix par son poids avant d’additionner."),
    ], ["Travaille en P&L signé, même quantité et même unité.", "Une couverture de prix peut laisser un risque de change, de base ou de trésorerie."], [energy, curve]),
];
