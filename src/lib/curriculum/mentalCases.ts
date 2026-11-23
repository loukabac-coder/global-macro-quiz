import { editorial } from "@/lib/curriculum/editorial";

export const mentalCases = [
  ...editorial("06", "pourcentages", [
`
ristourne|Appliquer une remise simple|Un prix de 60 € baisse de 25 %. Quel est le prix payé ?|#45~€~0|||Un quart de 60 vaut 15. Retire-le.
point|Compter les points de pourcentage|Le taux de réussite passe de 60 % à 65 %. Combien de points gagne-t-il ?|#5~points de pourcentage~0|||Les points se calculent par soustraction.
symetrie|Inverser mentalement les deux facteurs|Combien font 4 % de 50 ?|#2~~0|||Prendre 4 % de 50 revient à prendre la moitié de 4.
fraction|Utiliser 12,5 % comme un huitième|Quel montant représente 12,5 % de 240 € ?|#30~€~0|||Divise 240 par deux trois fois.
reste|Interpréter le complément pondéré|Une équipe effectue 70 % des 300 tâches. Combien de tâches restent ?|#90~unités~0|||Il reste 30 %, soit trois fois 30.
`,`
plafond|Combiner une marge et un objectif|Un lot de 80 produits comprend 10 % de rebuts. Combien de produits utilisables ?|#72~unités~0|||Enlève un dixième, soit 8 produits.
addition|Reconnaître deux mouvements en points|Un taux de 2,75 % gagne 50 pb puis perd 25 pb. Quel taux final ?|#3~%~0|||Le net est +25 pb, donc +0,25 point.
donnee|Retrouver le total avec une part|Une part de 20 % représente 12 M€. Quel total en millions d’euros ?|#60~millions d’€~0|||20 % = un cinquième. Multiplie 12 par cinq.
somme|Additionner les parts de deux sous-groupes|Sur 400 actions, un quart et un cinquième appartiennent à deux groupes distincts. Combien de titres au total dans ces groupes ?|#180~unités~0|||Un quart vaut 100 et un cinquième vaut 80.
applique|Calculer une variation en valeur|Un résultat passe de 500 à 475. De quel pourcentage diminue-t-il ? Donne la baisse en positif.|#5~%~0|||25 est un vingtième de 500, donc 5 %.
`,`
approx|Encadrer une variation|Un indicateur passe de 198 à 221. En arrondissant, estime la hausse avec une marge relative de 15 %.|#11.6162~%~15|||Arrondis l’écart à 22 et le départ à 200. Deux cents fois 11 % valent 22.
pondere|Trouver une contribution qui compense une perte|Une moitié d’un portefeuille perd 6 %. Quel gain de l’autre moitié compense exactement ?|#6~%~0|||Les deux moitiés ont le même poids.
composition|Raisonner en points sur une base négative|Un taux de −0,25 % gagne 75 pb. Nouveau taux ?|#0.5~%~0|||Ajoute 0,75 point à −0,25.
bascule|Comparer deux trajets de prix|Un prix baisse de 50 % puis remonte de 50 %. Quel est le résultat à partir de 80 € ?|#60~€~0|||80 → 40 → 60. La seconde hausse porte sur 40.
seuil|Associer hausse nécessaire et seuil de perte|À 120 €, une prime nette coûte 15 €. Quel pourcentage du montant représente la prime ?|#12.5~%~0|||120 = 8 × 15. La prime vaut un huitième.
spread|Chiffrer un surcoût sur une fraction d’année|Un spread de 50 pb s’applique à 8 M€ pendant six mois au prorata. Quel coût ?|#20000~€~0|||50 pb valent 0,5 %. Le coût annuel est 40 000 €, la moitié vaut 20 000 €.
`]),
  ...editorial("06", "unites", [
`
conversion|Convertir des centimes en euros|Combien d’euros représentent 350 centimes ?|#3.5~€~0|||Cent centimes font un euro.
lot|Doubler une quantité simple|Un colis contient 125 pièces. Combien dans huit colis ?|#1000~unités~0|||Double trois fois. 125 → 250 → 500 → 1 000.
portions|Lire des quarts d’heure|Combien de quarts d’heure dans deux heures ?|#8~~0|||Une heure contient quatre quarts d’heure.
monnaie|Distinguer prix et quantité|Une part coûte 8 € et tu disposes de 80 €. Combien de parts, hors frais ?|#10~unités~0|||80 ÷ 8 donne dix.
distance|Calculer une vitesse proportionnelle|Un véhicule fait 120 km en deux heures à vitesse constante. Combien de kilomètres en une demi-heure ?|#30~km~0|||Une demi-heure est un quart de deux heures.
`,`
conversion|Convertir une durée en minutes|1,5 heure correspond à combien de minutes ?|#90~minutes~0|||Une heure donne 60 et une demi-heure 30.
base|Mettre la bonne unité avant de diviser|60 000 € répartis sur 3 000 comptes donnent quel montant par compte ?|#20~€~0|||Supprime trois zéros en haut et en bas, puis divise 60 par 3.
conso|Diviser un prix de lot non décimal|Douze bouteilles coûtent 30 €. Quel prix unitaire ?|#2.5~€~0|||Quatre bouteilles coûtent 10 €. Un quart de 10 vaut 2,50 €.
estimation|Arrondir avant un produit court|48 articles à 19 € chacun. Estime le total en euros avec une marge de 10 %.|#912~€~10|||50 × 20 donne 1 000. Les deux facteurs arrondis vers le haut indiquent un résultat réel un peu inférieur.
conversion|Éviter une confusion entre million et milliard|0,025 milliard d’euros correspond à combien de millions d’euros ?|#25~millions d’€~0|||Multiplie le nombre de milliards par mille.
`,`
strategie|Appliquer un écart autour d’un nombre rond|Calcule 99 × 38.|#3762~~0|||100 × 38 − 38 = 3 800 − 38 = 3 762.
carre|Déterminer le carré d’un nombre finissant par cinq|Combien vaut 35² ?|#1225~~0|||Multiplie 3 par 4 puis écris 25 à droite.
inversion|Contrôler une conversion croisée|À 120 yens par dollar et 150 yens par euro, combien de dollars pour un euro ?|#1.25~$~0|||150 pour 120, soit 5/4 : 1,25.
ratio|Exploiter un diviseur commun|Des frais de 24 000 € sur une base de 800 000 € représentent quel pourcentage ?|#3~%~0|||24/800 = 3/100.
calcul|Multiplier en déplaçant un facteur deux|Combien font 16 × 35 ?|#560~~0|||Divise 16 par deux et double 35 deux fois. 4 × 140 donne 560.
perte|Raisonner sur la variation moyenne par part|Un portefeuille comprend 200 parts et perd 1 000 € au total. Combien perd-il par part ?|#5~€~0|||Un millier divisé par deux centaines vaut cinq.
`]),
  ...editorial("06", "interets", [
`
jour|Comprendre le calcul à la période|Un dépôt rémunère 5 € de manière simple chaque mois. Combien après quatre mois ?|#20~€~0|||Quatre mois à 5 € donnent 20 €.
inverse|Identifier un montant d’intérêt|Un dépôt de 300 € vaut 315 € après un an. Combien d’intérêts ont été gagnés ?|#15~€~0|||Soustrais le capital initial de la valeur finale.
convention|Identifier des intérêts simples dans un contrat|La banque calcule l’intérêt de la deuxième année sur le capital initial, sans ajouter le premier intérêt. Quelle méthode ?|Intérêts simples|Intérêts composés annuels|Aucune rémunération|En intérêts simples, le capital servant de base ne change pas.
`,`
compare|Comparer deux taux pondérés|Combien rapporte en un an 200 € à 5 % et 300 € à 10 %, intérêts simples ?|#40~€~0|||10 € sur le premier placement, 30 € sur le second.
inversion|Déduire la durée simple d’un intérêt|Sur 1 000 € rémunérés à 6 % simple, 15 € d’intérêts représentent combien de mois ?|#3~mois~0|||Sur un an l’intérêt vaut 60 €. 15 est un quart, soit trois mois.
compose|Distinguer versement et réinvestissement|2 000 € sont placés à 10 % composés pendant deux ans. Quel est l’intérêt de la seule deuxième année ?|#220~€~0|||Le premier intérêt est de 200. Le nouveau capital vaut 2 200. Son dixième vaut 220.
`,`
compose|Définir le gain dû à la seule composition|Un placement de 800 € rapporte 25 % par an. Quelle différence d’intérêts entre composé et simple au bout de deux ans ?|#50~€~0|||Le quart de 800 donne 200. La différence est le quart de ces 200.
mix|Suivre un apport intermédiaire|Un placement composé commence à 1 000 € à 10 % annuel. À la fin de l’an 1, après crédit des intérêts, tu ajoutes 100 €. Montant à la fin de l’an 2 ?|#1320~€~0|||1 000 devient 1 100. Avec l’ajout, calcule 10 % de 1 200 et ajoute 120.
retrait|Suivre un retrait après intérêt|Un placement composé commence à 2 000 € à 10 % annuel. Après le premier intérêt, tu retires 200 €. Quel solde à la fin de l’an 2 ?|#2200~€~0|||Tu reviens à 2 000 après le retrait. Ils rapportent ensuite 200 €.
taux|Comparer deux taux successifs faciles|Un placement composé vaut 300 € au départ. Il rapporte 20 % la première année et 25 % la seconde. Valeur après deux ans ?|#450~€~0|||20 % de 300 valent 60. Le quart de 360 vaut 90.
regle|Inverser la capitalisation sur une seule année|Un placement vaut 1 100 € au bout d’un an à 10 %. Quelle part du total est le capital initial en euros ?|#1000~€~0|||Le total vaut 11 dixièmes du départ, 100 € par dixième.
simple|Déduire un écart de taux de deux intérêts|Sur 5 000 € pendant un an, une offre rapporte 100 € de plus. Quel écart de taux en points de pourcentage ?|#2~points de pourcentage~0|||1 % représente 50 €. Double pour 100 €.
segmente|Ramener un intérêt à un taux moyen|Deux placements à intérêt simple d’un an, 100 € à 10 % et 300 € à 6 %. Quel est le taux moyen sur 400 € ?|#7~%~0|||10 € + 18 € = 28 €. Puis 28/400 = 7/100.
`]),
  ...editorial("06", "estimations", [
`
rotation|Simplifier un calcul hebdomadaire|Une bibliothèque prête environ 200 livres par semaine. En prenant 50 semaines, estime les prêts annuels. Marge de ±15 %.|#10000~unités~15|||200 × 5 valent 1 000, puis × 10.
occupation|Interpréter une part d’utilisation|Une salle de 200 places est environ à moitié pleine. Estime le public. Marge de ±15 %.|#100~personnes~15|||La moitié de 200 est 100.
litres|Multiplier un nombre de contenants par leur volume|100 bidons contiennent chacun environ 20 litres. Quel volume total ? Marge de ±15 %.|#2000~litres~15|||Un zéro de plus sur 20 par facteur dix, deux zéros pour cent.
`,`
trajet|Annualiser des trajets hebdomadaires|500 abonnés font 4 trajets par semaine. Prends 50 semaines. Estime les trajets annuels. Marge de ±10 %.|#100000~trajets~10|||500 × 4 = 2 000. 2 000 × 50 = 100 000.
net|Décomposer production et pertes|Une usine fabrique 40 000 pièces et environ un quart est écarté. Estime les pièces vendables. Marge de ±10 %.|#30000~unités~10|||Le quart est de 10 000. Retire-le du total.
segmentation|Construire un total en parts distinctes|Une ville a 100 000 foyers. Un sur cinq possède deux vélos et les autres aucun, dans cet exemple simplifié. Combien de vélos ? Marge de ±10 %.|#40000~vélos~10|||20 000 foyers concernés, deux vélos chacun.
`,`
temps|Combiner débit, temps et utilisation|Un atelier coupe 600 pièces par heure et tourne 5 heures à 80 % de sa cadence nominale. Estime sa production. Marge de ±8 %.|#2400~unités~8|||600 × 5 = 3 000. Retire un cinquième, soit 600.
cohorte|Regrouper trois segments sans grand produit|Trois points de vente réalisent environ 50, 100 et 150 ventes par jour. Chaque vente vaut environ 20 €. Recette quotidienne ? Marge de ±8 %.|#6000~€~8|||Regroupe d’abord les volumes : 300 × 20 = 6 000 €.
incertitude|Propager une marge par un ratio|Un panier moyen vaut entre 15 et 25 €. 2 000 clients achètent une fois. Estime la borne basse de recette. Marge de ±8 %.|#30000~€~8|||La borne basse prend 15 € par client. 15 × 2 000 = 30 000.
facteur|Estimer un coût rapporté à une semaine|20 000 ménages consomment 10 unités par semaine au prix de 2 € l’unité. Estime le coût hebdomadaire total. Marge de ±8 %.|#400000~€~8|||Chaque foyer dépense 20 €, donc 20 000 × 20.
deriv|Comparer deux scénarios d’estimation|Une usine vend environ 50 000 pièces à 20 €. À quantité stable, ses prix gagnent 10 %. Estime la hausse du revenu. Marge de ±8 %.|#100000~€~8|||La recette initiale est 1 M€. Prends son dixième.
rotation|Transformer un parc et une croissance en ventes|Un parc de 100 000 machines remplace un dixième de ses unités et ajoute 5 000 unités neuves sur un an. Combien d’achats ? Marge de ±8 %.|#15000~unités~8|||Il faut 10 000 remplacements et 5 000 machines pour l’expansion.
`]),
];
