# Plan de sécurisation — Frontend Ressources Relationnelles

## 1. Gestion des variables d'environnement

### Règle : aucun secret dans le bundle

Toutes les variables préfixées `NUXT_PUBLIC_` sont **intégrées dans le bundle JavaScript** livré au navigateur. Elles sont lisibles par n'importe quel utilisateur via les outils de développement.

| Variable | Valeur | Nature |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | URL de l'API | Publique — acceptable |

Ne jamais placer dans une variable `NUXT_PUBLIC_*` :
- Clé d'API tierce
- Secret JWT ou clé de signature
- Mot de passe ou token d'accès
- Données sensibles de modération ou d'administration

Les secrets qui doivent rester côté serveur sont gérés exclusivement dans le backend (NestJS), jamais dans le frontend.

---

## 2. Authentification

Le frontend échange un **token JWT** avec le backend pour authentifier les requêtes.

- Le token est transmis dans l'en-tête HTTP `Authorization: Bearer <token>` à chaque appel API.
- Stockage recommandé : cookie `httpOnly` (inaccessible au JavaScript, protège contre le vol par XSS) ou `localStorage` avec vigilance renforcée contre XSS.
- Les pages protégées (ressources, messagerie, tableau de bord, administration, modération) vérifient la présence et la validité du token via les middlewares Nuxt avant le rendu.
- Les tokens ont une durée de vie limitée (expiration 1 h). Le renouvellement automatique (refresh token) est prévu en roadmap V1.1 côté composable `useAuth`.
- À la déconnexion, le token est supprimé du stockage et ne doit pas être réutilisé.

---

## 3. Protection contre les attaques XSS

Vue 3 (et donc Nuxt 4) **échappe automatiquement** le contenu inséré via les interpolations `{{ variable }}` et les directives `:attr`. Ce mécanisme bloque la grande majorité des attaques XSS réfléchies et stockées.

Bonnes pratiques complémentaires :

- Ne pas utiliser `v-html` avec un contenu provenant d'une source externe ou d'un utilisateur (commentaires, ressources modifiables, messages). Si `v-html` est indispensable, passer le contenu par une bibliothèque de sanitisation (`DOMPurify`) avant insertion.
- Le Design System de l'État (DSFR) ne charge aucun script externe. Toutes les polices et icônes sont servies localement depuis le bundle npm.
- Lors de l'affichage de ressources ou de commentaires créés par les utilisateurs, l'échappement est automatique. Aucune action supplémentaire requise.
- Ne pas construire de requêtes SQL ou de chemins de fichiers à partir de données utilisateur côté frontend (validation côté backend systématiquement).

---

## 4. Protection contre les attaques CSRF

L'API backend repose sur une authentification par **JWT Bearer token** transmis dans l'en-tête `Authorization`. Ce mécanisme est **naturellement résistant au CSRF** : un site tiers ne peut pas injecter cet en-tête dans une requête cross-origin, contrairement à un cookie de session.

Aucune mesure CSRF spécifique n'est donc requise côté frontend.

---

## 5. Content Security Policy (CSP)

La CSP est définie par le **backend** (via le middleware `helmet` de NestJS) dans les en-têtes HTTP de réponse. Le frontend DSFR est conçu pour fonctionner sans scripts inline (`eval`, `inline script`), ce qui facilite l'application d'une politique stricte.

Points de vigilance lors de la configuration de la CSP :

| Directive | Valeur recommandée |
|---|---|
| `default-src` | `'self'` |
| `script-src` | `'self'` (pas de `'unsafe-inline'` ni `'unsafe-eval'`) |
| `style-src` | `'self'` |
| `img-src` | `'self' data:` |
| `font-src` | `'self'` |
| `connect-src` | `'self' <URL_API>` |

Tester la CSP avec l'outil [CSP Evaluator](https://csp-evaluator.withgoogle.com/) et l'onglet Réseau des outils de développement du navigateur.

---

## 6. Transmission des données (HTTPS)

En développement local, le frontend tourne en HTTP (`http://localhost:3000`). En production, **toutes les communications doivent transiter en HTTPS**.

Responsabilité : le reverse-proxy placé devant le conteneur frontend (Nginx, Traefik, Caddy) doit :

1. Écouter sur le port 443 avec un certificat TLS valide (Let's Encrypt recommandé).
2. Rediriger automatiquement le port 80 vers 443.
3. Transmettre les requêtes au conteneur frontend sur le réseau interne en HTTP.

Le conteneur lui-même n'a pas à gérer TLS.

---

## 7. Sécurité des dépendances

- Exécuter `npm audit` régulièrement (au moins à chaque release) pour détecter les vulnérabilités connues dans les dépendances.
- Activer les alertes **Dependabot** sur le dépôt GitHub pour recevoir des pull requests automatiques de mise à jour.
- Les composants DSFR (`@gouvfr/dsfr`) sont maintenus par le Service d'Information du Gouvernement (SIG) — suivre les releases officielles.
- Ne jamais installer de paquet npm sans vérifier sa provenance (typosquatting).

---

## 8. Conformité RGPD côté client

### Données collectées via le formulaire frontend

| Donnée | Page | Base légale |
|---|---|---|
| Prénom, nom, email | `/inscription` | Contrat (compte utilisateur) |
| Catégories de ressources consultées | `/ressources` | Consentement (amélioration du service) |
| Entrées du journal d'émotions | `/emotion_tracker` | Consentement |
| Conversations privées | `/messagerie` | Contrat (fonctionnement du service) |

### Transmission et stockage

- Les données sont envoyées **uniquement** vers le backend Ressources Relationnelles via l'API (`NUXT_PUBLIC_API_BASE`).
- Aucune donnée personnelle n'est envoyée à des services tiers (Google Analytics, Hotjar, Facebook Pixel, etc.).
- En production, la transmission doit se faire exclusivement en **HTTPS** (voir section 6).
- Les données sont stockées côté backend/base de données — la durée de conservation et les mesures de sécurité sont documentées dans le plan de sécurisation backend.

### Droits des utilisateurs

| Droit | Implémentation frontend |
|---|---|
| Accès et rectification | Page `/mon-compte` — modification du prénom, nom, email, photo de profil |
| Suppression | Bouton de suppression du compte sur `/mon-compte` → `DELETE /users/:id` |
| Portabilité | À implémenter si requis (export des ressources créées, conversations, journal d'émotions) |

### Cookies et traceurs

- Le frontend Ressources Relationnelles n'intègre **aucun traceur tiers** (pas de Google Analytics, Facebook Pixel, Hotjar, etc.).
- Les polices et icônes DSFR sont servies **localement** depuis le bundle npm — aucune requête vers des CDN externes.
- Si la gestion de session repose uniquement sur `localStorage` (pas de cookie déposé), l'obligation légale d'afficher un bandeau de consentement aux cookies ne s'applique pas.
- Si des cookies de session ou de préférence sont déposés, un **bandeau de consentement RGPD** conforme (choix granulaire, refus aussi simple que l'acceptation) doit être affiché.

---

## 9. Matrice OWASP Top 10 2021 — Frontend

| Risque | Statut | Mesures appliquées |
|---|---|---|
| **A01:2021 — Injection** | Atténué | Validation backend systématique, pas de `v-html` avec données externes, échappement Vue automatique |
| **A02:2021 — Broken Authentication** | Atténué | JWT + expiration 1 h, middleware auth sur routes protégées (refresh token en roadmap V1.1) |
| **A03:2021 — Broken Access Control** | Atténué | Middlewares Nuxt (auth, moderateur, admin, super-admin) bloquent l'accès par rôle |
| **A04:2021 — Insecure Design** | Géré | Authentification par token Bearer (CSRF-proof), HTTPS enforced en prod |
| **A05:2021 — Security Misconfiguration** | Géré | Variables d'env séparées par environnement, pas de secrets en bundle public |
| **A06:2021 — Vulnerable Components** | Mitigué | `npm audit` hebdomadaire, Dependabot activé, mise à jour Nuxt/Vue/DSFR maintenue |
| **A07:2021 — Identification and Authentication Failures** | Atténué | JWT valide, pas de session côté client, token stocké sécurisé |
| **A08:2021 — Software and Data Integrity Failures** | Géré | CI/CD avec lint + build validé, dépôt GitHub protégé (branch protection) |
| **A09:2021 — Logging and Monitoring Failures** | Implémenté en prod | Sentry pour erreurs runtime, UptimeRobot pour indisponibilité |
| **A10:2021 — SSRF** | N/A | Pas de requête SSRF côté frontend (toutes via API backend) |

---

## 10. Matrice des risques — Probabilité × Impact

Échelle : Probabilité et Impact notés de 1 à 5. Criticité = Probabilité × Impact. Bandes : 1–5 Faible · 6–9 Moyen · 10–15 Élevé · 16–25 Critique.

| Risque | Probabilité | Impact | Criticité | Mitigation |
|---|:---:|:---:|:---:|---|
| **Fuite de token JWT** | 3 | 5 | 15 — Élevé | Stockage en mémoire JS (non persistant entre rechargements), expiration 1 h, rotation `AUTH_TOKEN_SECRET` |
| **XSS reflété via URL** | 4 | 3 | 12 — Élevé | Échappement Vue auto, validation backend, CSP stricte |
| **XSS stocké (commentaires/ressources)** | 4 | 3 | 12 — Élevé | Échappement auto Vue, pas de `v-html`, sanitisation backend |
| **CSRF** | 2 | 3 | 6 — Moyen | Authentification Bearer token (naturellement CSRF-proof) |
| **Clickjacking** | 2 | 2 | 4 — Faible | CSP frame-ancestors, X-Frame-Options header |
| **Dépendance npm vulnérable** | 3 | 3 | 9 — Moyen | `npm audit` hebdo, Dependabot activé, mise à jour régulière |
| **Fuite d'info via console** | 2 | 4 | 8 — Moyen | Pas de log de token, pas d'info sensible, review code |
| **Indisponibilité (backend down)** | 2 | 4 | 8 — Moyen | UptimeRobot, health check Docker, alertes email |
| **Accessibilité dégradée** | 2 | 2 | 4 — Faible | Tests WCAG réguliers, composants DSFR seuls, Lighthouse CI |
| **Vol de session (logout partiel)** | 1 | 4 | 4 — Faible | Déconnexion complète (token + state), SameSite cookie |

> Les risques de criticité ≥ 10 (Élevé et Critique) sont traités en priorité et réévalués lors de la revue de sécurité annuelle (voir `MAINTENANCE.md`).

---

## 11. Bonnes pratiques DSFR et accessibilité

- Utiliser exclusivement les composants natifs du DSFR. Ils implémentent les exigences **WCAG 2.1 niveau AA** (rôles ARIA, gestion du focus, contrastes) sans configuration supplémentaire.
- Valider les formulaires à deux niveaux :
  - **Côté client** : validation HTML5 native (`required`, `type="email"`, etc.) et retours d'erreur via les composants DSFR (champ en erreur, message associé).
  - **Côté serveur** : validation via les DTOs NestJS (ne jamais faire confiance au seul frontend).
- Ne pas exposer de données personnelles dans les URLs (pas d'email, pas d'identifiant en clair dans les query strings).
- Tester régulièrement avec un lecteur d'écran (NVDA sur Windows, VoiceOver sur macOS) et l'outil Lighthouse (onglet Accessibilité).

---

## 12. Checklist de rotation des secrets côté frontend

| Secret | Gestion | Rotation |
|---|---|---|
| Token JWT | Backend (NestJS) | Expiration 1 h (user re-login) |
| Refresh token (si implémenté) | Backend | Rotation automatique côté API |
| Clés API tierces (future) | Backend uniquement | Jamais en `NUXT_PUBLIC_*` |
| Certificat TLS (HTTPS) | Reverse-proxy / Let's Encrypt | Automatique (90 jours) |

Aucun secret n'est stocké côté frontend en production. Le frontend ne contient que des URLs et des configurations publiques.
