# Plan de maintenance — Frontend Ressources Relationnelles

## 1. Gestion des tickets et des demandes

### Outil

**GitHub Issues** associées au dépôt `ressources-relationnelles-CESI-EFTEG/frontend`, pilotée via **GitHub Projects** (tableau Kanban).

Dépôt : https://github.com/ressources-relationnelles-CESI-EFTEG/frontend

### Labels recommandés

| Label | Usage |
|---|---|
| `bug` | Comportement inattendu, régression |
| `feature` | Nouvelle fonctionnalité |
| `a11y` | Non-conformité WCAG / accessibilité |
| `dsfr` | Question/amélioration Design System |
| `security` | Vulnérabilité ou fuite de données |
| `dependencies` | Mise à jour de dépendances (Dependabot) |
| `priority:critical` | Bloquant critique |
| `priority:high` | Majeur |
| `priority:medium` | Mineur |
| `priority:low` | Amélioration |
| `page:ressources` | Concerne la page ressources |
| `page:messagerie` | Concerne la messagerie |
| `page:tableau-de-bord` | Concerne le tableau de bord |
| `page:moderation` | Concerne l'interface de modération |
| `page:admin` | Concerne l'interface d'administration |

### Workflow Kanban

```
Backlog → À faire → En cours → En révision (PR) → Terminé
```

Chaque issue doit contenir :
- Une description claire du problème ou de la demande
- Les étapes de reproduction (pour les bugs)
- Le ou les critères d'acceptation
- La priorité (voir SLA ci-dessous)

### Templates GitHub

Les templates suivants sont disponibles dans `.github/ISSUE_TEMPLATE/` :
- `bug.md` — signalement de bug
- `feature.md` — demande de feature
- `a11y.md` — signalement de non-conformité accessibilité

---

## 2. Niveaux de priorité et SLA

| Priorité | Définition | Délai de prise en charge | Délai de résolution |
|---|---|---|---|
| **Bloquant critique** | Page inaccessible, erreur 500 globale, faille de sécurité active, perte de données | 1 heure | 4 heures |
| **Majeur** | Fonctionnalité principale dégradée (ressources, messagerie, connexion, inscription) | 4 heures | 1 jour ouvré |
| **Mineur** | Anomalie cosmétique, texte incorrect, lien cassé, performance dégradée | 1 jour ouvré | 1 semaine |
| **Amélioration** | Feature request, amélioration UX non bloquante | Best effort | Planification au sprint suivant |

Les délais courent à partir de la création de l'issue ou de la réception de l'alerte de monitoring.

---

## 3. Procédure de gestion des incidents

### Étape 1 — Détection

Les incidents peuvent être détectés par :
- Un utilisateur qui ouvre une issue GitHub ou contacte via `/contact`
- Un outil de monitoring externe (UptimeRobot, Uptime Kuma) qui détecte une indisponibilité sur le port 3000
- Le `HEALTHCHECK` Docker intégré dans le Dockerfile (sonde `GET /`)
- Un rapport Sentry (erreurs JavaScript côté client)
- Un audit Lighthouse ou un audit d'accessibilité

### Étape 2 — Diagnostic

```bash
# Consulter les logs du conteneur frontend en temps réel
docker compose -f docker-compose.prod.yml logs -f web

# Vérifier l'état des conteneurs
docker compose -f docker-compose.prod.yml ps

# Tester l'API backend directement (depuis l'hôte)
curl http://localhost:3001/health

# Tester le frontend (depuis l'hôte)
curl -I http://localhost:3000

# Vérifier Sentry pour les erreurs client
# → https://sentry.io (tableau de bord Ressources Relationnelles)
```

Questions à se poser :
- Le conteneur `web` est-il en cours d'exécution ?
- Le backend répond-il sur le port 3001 ?
- Le réseau `rr-net` est-il actif (`docker network inspect rr-net`) ?
- Y a-t-il une erreur de build dans les logs ?
- Sentry montre-t-il une vague d'erreurs JavaScript ?

### Étape 3 — Correction

```bash
# 1. Créer une branche de correction
git checkout -b hotfix/description-courte

# 2. Appliquer le correctif
# (ex. fix typo, rollback dépendance, patch CSS)

# 3. Valider le build localement avant de pousser
npm run build

# 4. Pousser et ouvrir une Pull Request vers main
git push origin hotfix/description-courte
```

Ne jamais pousser directement sur `main` sans pull request.

### Étape 4 — Post-mortem

Ajouter un commentaire dans l'issue GitHub fermée contenant :
- **Cause racine** : qu'est-ce qui a provoqué l'incident ?
- **Impact** : durée d'indisponibilité, pages ou fonctionnalités affectées, utilisateurs impactés estimés
- **Résolution** : ce qui a été fait pour corriger
- **Mesures préventives** : que met-on en place pour éviter la récurrence ?

Exemple de post-mortem :
```
## Post-mortem — Incident X

**Cause racine** : mise à jour Nuxt 4.0.2 qui a cassé la compilation des routes.

**Impact** : 2 h d'indisponibilité, 15 utilisateurs affectés (page /ressources inaccessible).

**Résolution** : downgrade vers Nuxt 4.0.1 en attendant le patch officiel.

**Mesures** : ajouter des tests e2e critiques en CI pour détecter les régressions de compile, valider localement les upgrades majeures.
```

---

## 4. Calendrier de maintenance préventive

### Hebdomadaire

- [ ] Exécuter `npm audit` et traiter les vulnérabilités de sévérité haute ou critique
- [ ] Vérifier les alertes Dependabot ouvertes sur GitHub et merger les PRs de mise à jour mineures
- [ ] Consulter les logs Sentry pour détecter des erreurs client récurrentes

### Mensuel

- [ ] Tester le build Docker complet : `docker compose -f docker-compose.prod.yml up --build`
- [ ] Exécuter un audit Lighthouse (Performance, Accessibilité, Bonnes pratiques, SEO) sur les pages principales (`/`, `/ressources`, `/connexion`, `/tableau-de-bord`)
- [ ] Vérifier que les comptes de démonstration fonctionnent (tous les rôles)
- [ ] Contrôler les logs du mois écoulé dans Sentry pour détecter des erreurs récurrentes
- [ ] Vérifier les alertes UptimeRobot / Uptime Kuma (taux de disponibilité, latence)

### Trimestriel

- [ ] Mettre à jour les composants DSFR (`@gouvfr/dsfr`) vers la dernière version stable
- [ ] Mettre à jour les dépendances majeures (Nuxt, Vue, TypeScript, Vite, etc.) après lecture des notes de version
- [ ] Réaliser un audit WCAG complet (tests manuels avec lecteur d'écran NVDA / VoiceOver sur pages clés)
- [ ] Exécuter Lighthouse CI en local pour vérifier que les budgets de perf sont respectés
- [ ] Revoir la liste des issues fermées et mettre à jour la documentation si nécessaire

### Annuel

- [ ] Revue complète des composants Vue : supprimer les composants inutilisés, refactoriser ceux qui ne respectent plus les conventions
- [ ] Mettre à jour l'image de base Docker vers la dernière version Node LTS
- [ ] Revoir la politique de sécurité (CSP, RGPD) à la lumière des évolutions légales et techniques
- [ ] Vérifier la conformité DSFR avec la version courante du Système de Design de l'État
- [ ] Planifier les mises à jour majeures Nuxt/Vue pour l'année suivante

---

## 5. Monitoring et observabilité

### HEALTHCHECK Docker

Le `Dockerfile` intègre une sonde de santé qui effectue un `GET /` toutes les 30 secondes. Si trois sondes consécutives échouent, le conteneur passe à l'état `unhealthy` et peut être redémarré automatiquement par Docker.

```bash
# Vérifier l'état de santé du conteneur
docker inspect --format='{{.State.Health.Status}}' <nom_conteneur>
```

### Sentry — Erreurs applicatives

Sentry collecte les erreurs JavaScript côté client en production. Configuration via `nuxt.config.ts` :

```ts
modules: ['@sentry/nuxt/module'],
sentry: {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
},
```

Vérifier régulièrement le tableau de bord Sentry pour :
- Les nouvelles erreurs applicatives (versioning)
- Les erreurs récurrentes (cibles prioritaires)
- La performance (error rate, transaction duration)

Lien : https://sentry.io (si configuré)

### Monitoring externe (recommandé en production)

| Outil | Type | Coût | Usage |
|---|---|---|---|
| UptimeRobot | SaaS — sonde HTTP toutes les 5 min, alertes email/SMS/Slack | Gratuit (plan basique) | Disponibilité globale |
| Uptime Kuma | Self-hosted — Docker, interface web, alertes multiples | Gratuit | Alternative self-hosted |

Configurer une sonde HTTP sur `http://<hôte>:3000` (ou l'URL de production) avec une alerte en cas de non-réponse pendant plus de 5 minutes.

### Logs applicatifs

En mode Docker, les logs Nuxt sont accessibles via :

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

Pour un archivage long terme, configurer un driver de logs Docker :
- `json-file` avec rotation : `--log-driver json-file --log-opt max-size=10m --log-opt max-file=5`
- Ou envoi vers un agrégateur (Loki, ELK Stack)

---

## 6. Procédure de mise à jour de l'application

### Mise à jour mineure (patch / dépendances)

```bash
# Mettre à jour les dépendances
npm update

# Vérifier l'absence de régression
npm run lint
npm run test:unit:run
npm run build

# Redéployer le conteneur
docker compose -f docker-compose.prod.yml up -d --build
```

### Mise à jour majeure (Nuxt, Vue, DSFR)

1. Lire les notes de version et le guide de migration officiel
2. Créer une branche `chore/upgrade-<paquet>-<version>`
3. Appliquer les changements requis (`npm install <paquet>@<version>`)
4. Tester manuellement les pages critiques :
   - `/` (accueil)
   - `/connexion` (authentification)
   - `/ressources` (liste et détail)
   - `/messagerie` (fonctionnalité clé)
   - `/moderateur` (modération)
   - `/admin` (administration)
5. Lancer `npm run build` pour valider la compilation
6. Lancer `npm run test:e2e` si le backend est disponible
7. Ouvrir une pull request et faire réviser par un pair
8. Merger et redéployer

### Rollback en cas de problème

Si une mise à jour cause une régression critique :

```bash
# Revert le dernier commit
git revert HEAD

# Ou retour à un tag antérieur
git checkout v0.1.0

# Reconstruire et redéployer
npm install
npm run build
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 7. Gestion des dépendances

### Dépendances critiques

| Paquet | Rôle | Fréquence de vérification |
|---|---|---|
| `nuxt` | Framework principal | Mensuel |
| `vue` | Framework UI | Mensuel |
| `@gouvfr/dsfr` | Design System | Trimestriel |
| `typescript` | Typage | Mensuel |
| `vite` | Bundler | Mensuel |
| `vitest` | Tests unitaires | Mensuel |
| `@playwright/test` | Tests E2E | Mensuel |

### Procédure de mise à jour

```bash
# Vérifier les versions disponibles
npm outdated

# Mettre à jour une dépendance spécifique
npm install <paquet>@latest

# Mettre à jour toutes les dépendances (sauf majeures)
npm update

# Vérifier la sécurité
npm audit
```

---

## 8. Checklist de performance (Lighthouse)

Exécuter `npm run build && npm run preview` puis ouvrir Lighthouse sur chaque page critique.

### Budgets recommandés

| Métrique | Objectif | Page |
|---|---|---|
| Largest Contentful Paint (LCP) | < 2.5 s | Toutes |
| First Input Delay (FID) | < 100 ms | Toutes |
| Cumulative Layout Shift (CLS) | < 0.1 | Toutes |
| First Contentful Paint (FCP) | < 1.8 s | Toutes |

Si les budgets ne sont pas respectés, analyser via Lighthouse Performance et identifier le goulot (JavaScript, CSS, images, requêtes réseau).

---

## 9. Conformité d'accessibilité

### Checklist WCAG 2.1 AA

- Tous les formulaires utilisent les labels DSFR associées
- Les images ont un `alt` descriptif
- Les couleurs ne sont pas le seul moyen de transmettre l'information
- Le contraste minimum 4.5:1 est respecté (testé via Lighthouse)
- La navigation au clavier fonctionne (Tab, Enter, Echap)
- Les erreurs de formulaire sont associées au champ via `aria-describedby`

### Outils de test

```bash
# Audit Lighthouse local
npm run preview
# → Ouvrir dans le navigateur et lancer Lighthouse

# Test avec @axe-core/playwright (si intégré)
npm run test:e2e -- --grep "accessibility"

# Test manuel avec NVDA (Windows)
# → https://www.nvaccess.org/

# Test manuel avec VoiceOver (macOS)
# Cmd + F5 pour activer/désactiver
```

---

## 10. Incidents connus et contournements

### Si le backend n'est pas accessible

**Symptôme** : erreurs 502 Bad Gateway ou timeouts API.

**Action** :
1. Vérifier que le backend est en cours d'exécution : `curl http://localhost:3001/health`
2. Vérifier la variable d'env `NUXT_PUBLIC_API_BASE`
3. Vérifier le réseau Docker : `docker network inspect rr-net`
4. Si persistant, redémarrer le backend et le frontend : `docker compose restart`

### Si les tests E2E échouent

**Symptôme** : `npm run test:e2e` échoue avec "Cannot reach server".

**Action** :
1. Vérifier que le backend est lancé sur le port 3001
2. Lancer en mode non-headless : `npm run test:e2e:ui`
3. Vérifier les logs Sentry et console du navigateur pour les erreurs

### Si le build Nuxt échoue

**Symptôme** : `npm run build` retourne une erreur de compilation.

**Action** :
1. Vider le cache : `rm -rf .nuxt node_modules && npm install`
2. Vérifier la version Node (doit être 20+) : `node --version`
3. Consulter la sortie d'erreur pour l'import/export défaillant
4. Tester la compilation locale avant de pousser

