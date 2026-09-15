# LHBIB-Lunch

## Libellé de commit (convention Melko)

Chaque commit s'écrit `préfixe: type de livraison — objectif` :

- **préfixe** : `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`, `ci`, `build` ;
- **type de livraison**, l'un des dix du barème PayPlan, écrit tel quel : `création d'application`, `amélioration majeure`, `fonctionnalité`, `amélioration`, `interface`, `parcours`, `déploiement`, `correction technique`, `norme du métier`, `sans valeur` ;
- **objectif** : ce qui change pour l'utilisateur ou l'équipe, en français.

Exemples : `feat: fonctionnalité — ajoute l'annuaire RGE et sa page de gestion`, `fix: norme du métier — fermer le port au réseau local`.

PayPlan lit ce type pour classer et payer la livraison ; les managers le lisent dans la fiche. Un commit = une intention = un type. À la fin d'une intervention, un commit vide borne la livraison : `git commit --allow-empty -m "livraison"`.

La skill `atelier:libelle-de-commit` du plugin `melko` propose ce libellé à la fin de chaque réponse qui a changé du code. Elle propose, elle ne commite jamais.
