import { editorial } from "@/lib/curriculum/editorial";

export const trainingBasics = [
  ...editorial("01", "pib", ["", `
millesime|Comparer des chiffres homogènes|Le PIB de A est disponible pour l’an dernier et celui de B seulement pour l’année précédente. Quelle comparaison est la plus homogène ?|Comparer les deux pays pour la dernière année disponible en commun|Comparer directement les deux derniers chiffres sans indiquer les dates|Comparer le taux d’inflation de A avec le PIB de B|Comparer la même année évite de confondre décalage de publication et différence de taille.
`]),
  ...editorial("02", "instruments", [`
outils|Distinguer deux instruments|Quelle mesure une banque centrale peut-elle prendre pour influencer le coût du crédit ?|Modifier son taux directeur|Modifier le barème de l’impôt sur le revenu|Édicter le budget des communes|Un taux directeur influence les taux auxquels les banques se financent.
achats|Reconnaître un achat d’actifs|Quand une banque centrale achète des obligations, que reçoit-elle ?|Des titres de dette|Des recettes fiscales|Des actions de toutes les entreprises|L’achat fait entrer les titres de dette dans son bilan.
prets|Identifier une opération de refinancement|Une banque emprunte auprès de la banque centrale. Quelle opération effectue-t-elle ?|Un refinancement|Un impôt|Une émission d’actions|Le refinancement permet d’obtenir des liquidités auprès de la banque centrale.
bilan|Lire un actif du bilan|Où figurent les obligations détenues par la banque centrale dans son bilan ?|À l’actif|Dans les seules recettes de l’État|Au passif comme une dette envers le vendeur|Les obligations détenues sont une créance pour leur détenteur.
reserves|Identifier les réserves bancaires|Que peuvent conserver les banques commerciales sur un compte à la banque centrale ?|Des réserves|Le stock de marchandises des ménages|Les actions de leurs clients|Les réserves sont des dépôts auprès de la banque centrale.
collateral|Expliquer une garantie|Pourquoi demander une garantie quand la banque centrale accorde certains prêts ?|Pour limiter le risque de perte si l’emprunteur ne rembourse pas|Pour supprimer toute échéance|Pour fixer directement le prix des biens|La garantie peut être utilisée en cas de défaut.
echeance|Reconnaître un remboursement|Une obligation détenue par la banque centrale arrive à échéance. Qui rembourse le principal ?|L’émetteur de l’obligation|Toute banque commerciale à parts égales|L’acheteur initial des marchandises|L’émetteur doit rembourser selon les conditions de son emprunt.
qe|Reconnaître le principe du QE|Que désigne le plus souvent le QE ?|Un programme d’achats d’actifs à grande échelle|Une baisse du taux de TVA|Un plafonnement des salaires|L’assouplissement quantitatif passe principalement par des achats d’actifs.
liquidite|Repérer un apport de liquidité|Quel exemple fournit des liquidités à une banque commerciale ?|Un prêt de la banque centrale à cette banque|Un relevé de prix chez un détaillant|Une élection législative|Le prêt permet à la banque de disposer de fonds.
qt|Comprendre le non-réinvestissement|Lorsqu’un portefeuille d’obligations est réduit par non-réinvestissement, que fait la banque centrale ?|Elle laisse une partie des titres arriver à échéance sans les remplacer|Elle augmente systématiquement ses achats|Elle transforme chaque obligation en action|Le remboursement n’est pas suivi d’un achat équivalent.
`, "", `
contrepartie|Distinguer les deux côtés d’un bilan|Une opération crée simultanément une créance et une dette pour la banque centrale. Que peut-on en déduire ?|Son actif et son passif peuvent augmenter ensemble|La dette disparaît par construction|Son bilan doit devenir négatif|Une opération peut accroître la taille du bilan sans changer le principe d’équilibre comptable.
echeances|Distinguer ventes et maturités|Quelle différence sépare une vente de titres du non-réinvestissement ?|Une vente remet un titre existant sur le marché avant son échéance|Le non-réinvestissement exige la vente de chaque titre|Les deux opérations augmentent toujours le portefeuille|Le non-réinvestissement se réalise lors du remboursement du titre.
prix|Identifier un effet possible des achats|Une hausse de la demande d’obligations peut faire monter leur prix. Quel effet sur leur rendement à flux constants ?|Il peut baisser|Il doit monter dans la même proportion|Le coupon nominal doit doubler|Le prix monte tandis que les flux fixes reçus restent les mêmes.
duration|Relier les achats à l’offre de duration|Quand la banque centrale achète des titres à échéance longue, qu’enlève-t-elle du portefeuille du secteur privé ?|Une partie de son exposition aux taux longs|Toutes ses obligations à court terme|Tout risque de crédit sur la dette privée|Un achat de titres à taux fixe transfère une partie de leur risque de taux.
`]),
  ...editorial("02", "decisions", [`
date|Lire une annonce monétaire|Quelle date indique quand une décision de taux est communiquée au public ?|La date d’annonce|La date de naissance du gouverneur|La dernière date du panier de prix|La date de communication désigne la publication de la décision.
decision|Reconnaître un maintien|La banque centrale garde son taux au niveau précédent. Quelle décision a-t-elle prise ?|Un maintien|Une baisse|Une hausse|Un maintien laisse le niveau du taux inchangé.
echeance|Repérer l’entrée en vigueur|Le nouveau taux est annoncé le lundi et s’applique le mercredi. Quand entre-t-il en vigueur ?|Mercredi|Lundi|À la fin de la semaine suivante|La date d’effet est donnée séparément de la date d’annonce.
projection|Reconnaître une prévision|Une banque centrale publie sa prévision d’inflation pour l’an prochain. Que publie-t-elle ?|Une estimation future|Une mesure déjà constatée de l’an prochain|Une règle fiscale votée|Une prévision est un scénario estimé.
agenda|Lire un calendrier|Que permet de connaître le calendrier des réunions monétaires ?|La date prévue de la réunion|Le résultat du vote avant qu’il ait lieu|Le taux à chaque échéance|Le calendrier indique les dates programmées de réunion.
vote|Comprendre un vote partagé|Le comité publie un vote non unanime. Que signifie ce détail ?|Certains membres ont exprimé un choix différent|Tous les membres avaient la même préférence|La décision est automatiquement annulée|Le résultat peut refléter des avis différents au sein du comité.
consensus|Distinguer attente et décision|Que désigne le consensus avant une réunion ?|L’attente dominante parmi les analystes|La décision déjà publiée par le comité|La taille du bilan|Le consensus résume ce qu’attendent les observateurs.
surprise|Reconnaître une surprise simple|Tout le monde attend un maintien et la banque baisse son taux. Quelle décision a surpris ?|La baisse|Le maintien|Une hausse|La décision observée diffère de l’attente de départ.
texte|Identifier le document à consulter|Où vérifier le motif donné par une banque centrale pour sa décision ?|Dans son communiqué officiel|Dans le dernier cours d’une action|Dans le programme électoral d’un parti|Le communiqué expose la décision et son raisonnement.
calendrier|Distinguer publication et décision|Un calendrier donne une date pour l’IPC et une pour le comité monétaire. Quel événement permet de connaître le nouveau taux décidé ?|La communication du comité|La parution de l’IPC|La clôture de la Bourse la veille|Le comité communique sa propre décision après sa réunion.
`]),
  ...editorial("03", "actualite", [`
source|Identifier une source primaire|Où vérifier qu’un accord commercial a bien été signé ?|Dans le communiqué officiel des signataires|Dans une capture sans source|Dans le seul cours de l’or|Les signataires publient des informations officielles sur la signature.
acteurs|Repérer les parties concernées|Quel détail identifie les parties à un accord ?|Les noms des gouvernements ou organisations signataires|Le nombre de commentaires sous l’article|Le prix d’un panier de consommation|Les signataires sont les parties qui concluent l’accord.
date|Vérifier la chronologie|Quel détail vérifier avant de présenter un événement comme récent ?|La date de l’événement|La taille de la photo|Le nombre de mots du titre|La date situe l’événement dans le temps.
projet|Distinguer une proposition|Un gouvernement propose un droit de douane pour le mois prochain. Quel est son statut décrit dans cette phrase ?|Une proposition|Une taxe déjà appliquée|Une suppression définitive|La phrase décrit un projet dont la mise en œuvre reste à vérifier.
publication|Repérer un changement officiel|Où vérifier le périmètre exact d’une sanction ?|Dans le texte de la décision officielle|Dans la réaction d’un seul investisseur|Dans le classement des PIB|Le texte précise les entités et opérations concernées.
condition|Distinguer scénario et constat|Un article dit « le prix pourrait monter ». Que décrit-il ?|Une possibilité|Une hausse déjà mesurée|Un cours de clôture publié|Le conditionnel signale un scénario possible.
vote|Vérifier un résultat|Quelle source utiliser pour connaître les résultats officiels d’une élection ?|L’autorité électorale qui publie les résultats|Un sondage de la veille|Un message anonyme|L’autorité électorale publie les résultats du scrutin.
pays|Déterminer la portée d’une mesure|Un accord concerne uniquement les exportations agricoles entre deux pays. Quel périmètre annoncer ?|Ces échanges agricoles entre les deux pays|Tout le commerce mondial|Les seules entreprises technologiques|Le périmètre reprend les secteurs et les parties concernés.
prix|Relier un événement à l’économie|Un port ferme temporairement. Quel effet immédiat faut-il surveiller ?|Les délais de transport|La définition du PIB|Le nombre de banques centrales|Une fermeture peut retarder les acheminements.
confirmer|Recouper une information|Deux articles recopient le même communiqué. Où vérifier le texte initial ?|Dans la publication de l’institution qui a annoncé la décision|Dans le titre du second article uniquement|Dans une publicité associée|La publication d’origine permet de vérifier la formulation.
`]),
  ...editorial("01", "finances", [`
solde|Identifier un excédent|Sur une période, les recettes publiques dépassent les dépenses. Quel est le solde ?|Un excédent|Un déficit|Une dette nulle|Sur cette période, le solde des recettes et dépenses est positif.
echeance|Reconnaître le refinancement|L’État emprunte pour rembourser une dette qui arrive à échéance. Que fait-il ?|Il refinance la dette|Il augmente automatiquement le PIB|Il annule tous ses intérêts futurs|Le nouvel emprunt remplace le montant de dette arrivé à échéance.
`]),
  ...editorial("01", "commerce", [`
serv|Reconnaître une exportation de service|Une entreprise française vend du conseil à un client canadien. Quel flux la France enregistre-t-elle ?|Une exportation de service|Une importation de marchandise|Une recette fiscale|Une vente de service à un non-résident est une exportation de service.
origine|Reconnaître une importation|Un détaillant français achète des produits finis à un fabricant étranger. Quel est le flux pour la France ?|Une importation|Une exportation|Un investissement intérieur automatique|L’achat fait entrer des produits étrangers dans le pays.
`, `
balance|Distinguer biens et services|Un pays est en déficit sur les biens et en excédent sur les services. Quelle information permet de trancher pour leur solde total ?|Les montants des deux soldes|Son taux directeur à lui seul|Le seul nombre de ses partenaires|Il faut additionner le déficit des biens et l’excédent des services.
`]),
  ...editorial("02", "institutions", ["", "", `
responsabilite|Distinguer mandat et indépendance|L’indépendance d’une banque centrale implique-t-elle qu’elle fixe librement le mandat légal qui lui est assigné ?|Elle dispose d’une autonomie dans ses décisions selon le mandat défini|Elle supprime tout contrôle institutionnel|Elle fixe systématiquement les impôts|L’autonomie des décisions s’exerce dans un cadre juridique.
coordination|Distinguer coordination et mandat commun|Deux banques centrales annoncent une coopération temporaire. Que faut-il vérifier pour connaître leurs obligations permanentes ?|Leurs mandats respectifs|Le seul titre du communiqué|La devise d’une entreprise|Un accord de coopération n’unifie pas les mandats institutionnels.
`]),
  ...editorial("02", "instruments", ["", `
taux|Comparer deux outils|Quel outil change directement un taux portant sur les dépôts des banques à la banque centrale ?|Une modification du taux de la facilité de dépôt|L’achat d’un titre particulier à prix fixé|Une variation du poids d’un indice d’actions|La facilité définit la rémunération des dépôts admissibles.
`]),
  ...editorial("05", "bases", ["", "", `
fourchette|Comparer deux carnets|Deux carnets affichent la même fourchette mais des quantités différentes au meilleur prix. Quoi vérifier pour exécuter un ordre important ?|La profondeur à plusieurs niveaux de prix|Le seul prix affiché en gros|Le dividende de l’année suivante|La taille de l’ordre peut dépasser les quantités affichées au meilleur prix.
cout|Mesurer un coût implicite|Une exécution se fait à un prix moins favorable que celui observé au moment de l’ordre. Quel coût cette différence représente-t-elle ?|Un coût d’exécution implicite|Le dividende de l’action|Une augmentation du prix de référence passé|Le glissement de prix traduit un écart entre prix attendu et prix obtenu.
`]),
  ...editorial("05", "contrats", [`
sens|Identifier la position acheteuse|Une société s’engage à acheter une quantité à un prix convenu pour le mois prochain. Quel côté du contrat prend-elle ?|Le côté acheteur|Le côté vendeur|Une position sans engagement de quantité|L’acheteur s’engage à recevoir ou régler selon les conditions du contrat.
livraison|Lire une échéance|Quel élément du contrat précise le jour prévu pour la livraison ou le règlement ?|L’échéance|Le dernier dividende|Le cours de la veille|L’échéance indique quand le contrat doit être réglé selon ses termes.
`]),
  ...editorial("06", "interets", [`
taux|Décomposer un intérêt simple|Quel intérêt simple produit un capital de 2 000 € à 5 % pendant un an ?|#100~€~0|||Prends 10 % de 2 000 €, soit 200 €. Divise par deux pour obtenir 5 %, soit 100 €.
`]),
];
