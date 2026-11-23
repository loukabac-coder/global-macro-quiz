import { editorial } from "@/lib/curriculum/editorial";

export const mentalBank = [
  ...editorial("06", "pourcentages", [
`
direct|Décomposer un pourcentage|Quel est 15 % de 80 € ?|#12~€~0|||Prends 10 % = 8, puis 5 % = 4.
fraction|Convertir un quart|Quelle part en pourcentage représentent 25 actions sur 100 ?|#25~%~0|||Le total vaut 100, lis 25 directement.
ecart|Utiliser la valeur de départ|De 50 à 60, quelle hausse ?|#20~%~0|||La hausse de 10 vaut un cinquième de 50.
pb|Convertir des points de base|Combien de points de base représentent 0,5 point de pourcentage ?|#50~pb~0|||Un point vaut 100 pb. Prends la moitié.
part|Calculer un complément|80 % d’un panier sont des obligations. Quelle part n’est pas obligataire ?|#20~%~0|||100 − 80 = 20.
ecart|Calculer une baisse facile|De 200 à 180, quelle variation avec son signe ?|#-10~%~0|||−20 sur une base de 200 donne −10 %.
`,`
retour|Retrouver un prix avant remise|Une action vaut 80 € après −20 %. Quel était son prix ?|#100~€~0|||80 représente quatre cinquièmes. Un cinquième vaut 20.
suite|Appliquer deux variations simples|100 € augmentent de 10 %, puis baissent de 10 %. Solde en euros ?|#99~€~0|||À 110 €, retire 11 €. Les bases diffèrent.
ecart|Choisir le bon dénominateur|Un prix passe de 80 à 100. Quelle hausse ?|#25~%~0|||20 est un quart de 80.
relatif|Séparer points et variation|Un taux passe de 4 % à 5 %. Quelle est sa hausse relative ?|#25~%~0|||Le gain d’un point vaut un quart du taux initial de 4 %.
pb|Réunir deux unités|Un taux de 3 % baisse de 25 pb. Nouveau taux ?|#2.75~%~0|||25 pb valent 0,25 point, à retrancher de 3.
base|Nommer la bonne opération|Pour annuler une baisse de 20 %, quelle hausse permet le retour ?|#25~%~0|||Prends 100 → 80. Pour reprendre 20 sur 80, il faut un quart.
`,`
pondere|Calculer une variation pondérée|Deux lignes pèsent 75 % et 25 %. Elles font +4 % et −4 %. Performance totale ?|#2~%~0|||Trois quarts de 4 donnent +3, un quart donne −1.
retour|Retrouver un nombre sur l’autre base|Un montant final de 225 € correspond à un gain de 25 %. Montant de départ ?|#180~€~0|||225 correspondent à cinq quarts. Prends quatre fois 45.
suite|Calculer deux variations asymétriques|Une action monte de 50 %, puis baisse de 20 %. Variation totale ?|#20~%~0|||Prends 100 → 150 → 120.
pb|Appliquer un coût en points de base|12 M€ paient un spread annuel de 25 pb. Combien d’euros ?|#30000~€~0|||1 % vaut 120 000 €. Un quart donne 30 000 €.
ordre|Comparer deux variations pondérées|Une part de 20 % recule de 15 %. Contribution en points ?|#-3~points de pourcentage~0|||Divise −15 par cinq.
base|Choisir une base de comparaison inversée|Monter de 60 à 75 donne +25 %. Quelle baisse ramène à 60 ?|#-20~%~0|||Retire 15 sur 75, soit un cinquième.
`]),
  ...editorial("06", "unites", [
`
echelle|Passer des millions aux milliers|1,2 million d’euros représente combien de milliers d’euros ?|#1200~milliers d’€~0|||Un million contient mille milliers.
division|Utiliser trois demi-tours|Combien vaut 1 000 ÷ 8 ?|#125~~~|||Prends successivement la moitié : 500, 250, 125.
change|Lire une multiplication en change|À 1,20 $ par euro, combien donnent 100 € ?|#120~$~0|||100 fois la cotation déplace la virgule.
notionnel|Changer de grandeur|Combien de millions d’euros représentent 3 milliards d’euros ?|#3000~millions d’€~0|||Un milliard contient 1 000 millions.
ratio|Partager en parties égales|Un coût de 90 € est réparti sur 6 personnes. Coût par personne ?|#15~€~0|||6 × 15 = 90. Pense à 60 + 30.
unite|Calculer un prix total|4 billets de 25 € coûtent combien ?|#100~€~0|||Quatre quarts de 100 font 100.
`,`
croise|Diviser par un taux lisible|Avec 1,25 $ par euro, combien valent 250 $ en euros ?|#200~€~0|||125 $ valent 100 €, donc 250 $ valent 200 €.
net|Additionner dans la même unité|2 Md€ moins 350 M€ valent combien de millions d’euros ?|#1650~millions d’€~0|||2 Md = 2 000 M. Retire 350.
ratio|Simplifier des facteurs|8 lignes sur 40 représentent quelle part ?|#20~%~0|||Réduis 8/40 à 1/5.
arrondi|Estimer le produit d’intrants|En arrondissant mentalement, combien valent 49 × 21 ?|#1029~~5|||50 × 20 ≈ 1 000. Il suffit de voir que les corrections sont petites.
prix|Convertir une grandeur horaire|Un bureau dépense 2 400 € sur 8 jours d’activité. Combien par jour ?|#300~€~0|||24 ÷ 8 = 3, puis restitue les deux zéros.
unite|Réunir deux prix par portion|500 g d’un produit coûtent 3 €. Quel prix par kilo ?|#6~€~0|||Deux portions de 500 g font un kilo.
`,`
change|Lire une séquence de conversions|1 € vaut 1,25 $, 1 $ vaut 120 ¥. Combien de yens pour 1 € ?|#150~¥~0|||120 plus son quart, 30, donne 150.
ratio|Simplifier un ratio avec des milliards|250 M€ sur 2 Md€ représentent quelle part ?|#12.5~%~0|||250/2 000 = 1/8 = 12,5 %.
difference|Utiliser une identité remarquable|Calcule 48 × 52 de tête.|#2496~~0|||Encadre 50. 50² − 2² = 2 496.
mix|Faire une moyenne pondérée facile|Quatre biens de 50 € et un bien de 100 €. Prix moyen par bien ?|#60~€~0|||Total 300 € sur cinq biens.
inversion|Inverser un ratio de valorisation|Un résultat de 25 M€ pour une capitalisation de 500 M€. Quel multiple ?|#20~fois~0|||25 × 4 = 100. Multiplie encore par 5.
volume|Mettre volume et prix au même ordre|20 millions d’articles à 50 € représentent combien de milliards d’euros ?|#1~milliards d’€~0|||20 × 50 = 1 000 millions, soit un milliard.
`]),
  ...editorial("06", "interets", [
`
simple|Calculer une première année|100 € portent 10 % d’intérêt annuel simple. Intérêt d’un an ?|#10~€~0|||Un dixième de 100 donne 10.
duree|Ramener une année à six mois|1 000 € à 4 % simple pendant six mois. Intérêts en euros ?|#20~€~0|||L’intérêt annuel est de 40 €. Prends la moitié.
definition|Distinguer capital et intérêt|Un capital de 200 € rapporte 20 €. Quel montant est versé au total si le capital est rendu ?|#220~€~0|||Ajoute le capital et son intérêt.
compose|Calculer un intérêt composé sur un an|200 € à 5 % composés annuellement pendant un an. Montant final ?|#210~€~0|||5 % de 200 valent 10.
annuel|Interpréter deux ans simples|1 000 € à 3 % simples par an pendant deux ans. Intérêt cumulé ?|#60~€~0|||Chaque année rapporte 30 € sur le même capital.
concept|Reconnaître la composition|Qu’est-ce que capitaliser des intérêts ?|Les incorporer au capital portant intérêt|Retirer chaque année le capital initial|Payer le même montant à taux variable dans tous les cas|Les intérêts futurs sont calculés sur le capital augmenté.
`,`
compose|Appliquer 10 % deux fois|1 000 € à 10 % d’intérêts composés annuels pendant deux ans. Montant final ?|#1210~€~0|||1 000 → 1 100 → 1 210. Prends chaque fois un dixième.
simple|Retrouver un taux annuel simple|2 000 € rapportent 160 € après deux ans à intérêt simple. Quel taux annuel ?|#4~%~0|||80 € par an, soit 4 sur 100.
difference|Isoler l’intérêt sur les intérêts|1 000 € à 10 % annuels. De combien la composition sur deux ans dépasse-t-elle l’intérêt simple ?|#10~€~0|||Seul l’intérêt sur les 100 € de la première année change, soit 10 €.
convention|Choisir une convention de durée|1 200 € à 6 % simple par an pendant quatre mois. Intérêt ?|#24~€~0|||L’année donne 72 €. Prends un tiers.
capital|Retrouver le capital avec un taux simple|L’intérêt annuel simple à 5 % est de 25 €. Quel capital ?|#500~€~0|||5 % = 1/20. Multiplie 25 par 20.
compose|Retrancher le principal d’un montant composé|500 € à 20 % d’intérêts composés sur deux ans. Intérêts seuls ?|#220~€~0|||500 → 600 → 720. Retire les 500 € de départ.
`,`
compose|Utiliser un raccourci sur deux ans|10 000 € à 5 % d’intérêts composés annuels pendant deux ans. Montant final ?|#11025~€~0|||Deux intérêts de 500 €, plus 25 € d’intérêt sur le premier.
inverse|Inverser deux périodes faciles|Un placement à 20 % composés annuels sur deux ans vaut 1 440 €. Capital initial ?|#1000~€~0|||Divise deux fois par 1,2 : 1 440 → 1 200 → 1 000.
simple|Comparer deux prix de financement|Sur un même capital, 6 % simple sur six mois équivaut à quel taux annuel simple sur douze mois pour le même intérêt ?|#3~%~0|||Le premier contrat ne court qu’une demi-année.
cout|Comparer placements de durées différentes|Sur 2 000 €, combien rapporte en plus 6 % simple pendant un an par rapport à 4 % simple pendant six mois ?|#80~€~0|||Le premier donne 120 €, le second 40 €.
compose|Choisir le bon facteur de taux cumulé|Deux années à 10 % d’intérêts composés donnent quel rendement total ?|#21~%~0|||Deux fois 10 % du capital de départ, plus 1 % de composition.
regle|Isoler l’intérêt sur l’intérêt|3 000 € à 10 % annuels composés. La deuxième année rapporte combien de plus que la première ?|#30~€~0|||Le premier intérêt vaut 300 €. Prends-en 10 %.
`]),
  ...editorial("06", "estimations", [
`
menages|Décomposer une population|Une ville fictive a 120 000 habitants et 2,4 personnes par foyer. Estime le nombre de foyers.|#50000~foyers~15|||12 ÷ 2,4 = 5. Applique l’échelle.
frequence|Extrapoler une fréquence|Un cinéma vend environ 500 places par semaine. Prends 50 semaines. Combien de billets par an ?|#25000~billets~15|||5 × 5 = 25. Ajoute les trois zéros.
volume|Estimer des volumes par personne|2 millions de personnes boivent chacune 2 litres par jour. Volume quotidien ?|#4000000~litres~15|||Double 2 millions.
prix|Multiplier marché et panier|20 000 sacs se vendent autour de 50 € par an. Ordre de grandeur du chiffre d’affaires ?|#1000000~€~15|||20 000 × 100 = 2 M€. Prends la moitié.
cohorte|Utiliser une part familière|Une ville de 80 000 habitants compte environ un quart d’étudiants. Combien d’étudiants ?|#20000~personnes~15|||Prends le quart de 80 000.
temps|Annualiser un montant mensuel|En prenant 10 € par mois, estime la dépense annuelle d’une personne.|#120~€~15|||12 mois à 10 € donnent 120 €.
`,`
segmentation|Additionner deux segments|100 000 achats à 10 € et 50 000 achats à 20 €. Chiffre d’affaires estimé ?|#2000000~€~10|||Chaque segment vaut un million d’euros.
part|Estimer un marché adressable|200 000 foyers, environ 25 % intéressés, deux unités achetées par foyer intéressé. Combien d’unités ?|#100000~unités~10|||Le quart donne 50 000 foyers. Double pour les achats.
remplacement|Convertir un parc en ventes annuelles|1 million de vélos, remplacés tous les cinq ans en moyenne. Si le parc est stable, combien de ventes annuelles ?|#200000~vélos~10|||Une rotation de cinq ans correspond à un cinquième du parc par an.
occupation|Relier capacité et fréquentation|Un hôtel a 100 chambres et 80 % d’occupation chaque nuit. En 30 nuits, combien de nuitées en chambres occupées ?|#2400~nuitées~10|||80 chambres chaque nuit fois trois dizaines, soit 2 400.
budget|Évaluer une dépense agrégée|1 million d’abonnés dépensent environ 5 € par mois. Sur 12 mois, combien au total ?|#60000000~€~10|||5 M€ par mois multipliés par 12 donnent 60 M€.
densite|Ramener une grandeur par habitant|Une collectivité produit 4 000 tonnes de déchets pour 20 000 habitants en un an. Estime le nombre de kilos par personne.|#200~kg~10|||4 000 tonnes font 4 millions de kg, divisés par 20 000.
`,`
segmentation|Combiner segmentation et récurrence|Deux réseaux ont respectivement 20 000 clients à 10 € par mois et 10 000 à 20 € par mois. Recettes mensuelles totales ?|#400000~€~8|||Chaque réseau réalise environ 200 000 €.
sensibilite|Mesurer une hypothèse marginale|On vendrait 100 000 unités à 20 €. Si le panier augmente de 2 € à volume stable, estime la recette supplémentaire.|#200000~€~8|||Calcule directement 2 € × 100 000.
contrainte|Estimer la capacité effective|Quatre lignes produisent chacune 1 000 unités par jour à plein régime. Pendant 25 jours à 80 %, combien d’unités ?|#80000~unités~8|||À plein régime 4 000 × 25 vaut 100 000. Prends quatre cinquièmes.
fourchette|Construire une borne supérieure|Un marché a entre 10 et 20 millions de clients, chacun dépensant 50 € par an. Borne supérieure en millions d’euros ?|#1000~millions d’€~8|||Prends le maximum de clients : 20 millions × 50 = 1 000 millions.
deduction|Passer du volume brut au net|Une usine livre 50 000 unités puis reprend 10 % de retours. Estime les pièces gardées.|#45000~unités~8|||Retire un dixième puis vérifie que le résultat reste proche de 50 000.
population|Lire une hypothèse de population active|Un pays fictif a 20 millions d’habitants, dont la moitié active. 5 % des actifs sont au chômage. Estime le nombre de chômeurs.|#500000~personnes~8|||10 millions d’actifs. 5 % = un vingtième, soit un demi-million.
`]),
];
