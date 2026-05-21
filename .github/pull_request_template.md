<!-- Merci pour ta contribution. Remplis chaque section avant de demander une review. -->

## Contexte

<!-- Pourquoi ce changement ? Quel problème il résout ou quelle fonctionnalité il apporte ? -->

## Changements apportés

<!-- Liste claire des modifications principales (1 puce par changement notable). -->

-
-

## Type de changement

- [ ] `fix` — correction d'une anomalie
- [ ] `feat` — nouvelle fonctionnalité
- [ ] `refactor` — refactorisation sans changement de comportement
- [ ] `style` — design / accessibilité uniquement
- [ ] `docs` — documentation uniquement
- [ ] `chore` / `ci` — tooling, CI, dépendances
- [ ] `BREAKING CHANGE` — casse un contrat avec l'API ou les routes

## Checklist

- [ ] Les tests unitaires passent (`npm run test:unit:run`)
- [ ] Les tests e2e Playwright passent localement (`npm run test:e2e`)
- [ ] Le build passe (`npm run build`)
- [ ] Les pages modifiées ont été testées manuellement **desktop ET mobile**
- [ ] Conformité DSFR / RGAA respectée (balises sémantiques, contrastes ≥ 4.5:1, focus clavier visible)
- [ ] Les routes (`<NuxtLink to="...">`, `navigateTo`) pointent vers des pages existantes
- [ ] Les guards de route (middleware `auth`, `moderateur`, `admin`, `super-admin`) sont appliqués si nécessaire
- [ ] La documentation est à jour si nécessaire (README, `docs/`)
- [ ] Pas de secret ni de credential commité (`.env` ignoré)

## Tickets liés

<!-- Closes #123, Refs #456 -->

## Captures d'écran

<!-- Avant / après pour les changements visuels. -->

## Notes pour le reviewer

<!-- Points d'attention particuliers, choix de conception à discuter. -->
