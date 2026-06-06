# Plan de déploiement — Frontend Ressources Relationnelles

## Architecture

Le frontend Ressources Relationnelles est une application **Nuxt 4 en mode SSR** (rendu côté serveur). Elle s'exécute dans un conteneur Node.js qui reçoit les requêtes HTTP des navigateurs et appelle l'API backend pour y répondre.

```
Navigateur
    │ HTTP(S)
    ▼
[Conteneur frontend : nuxt/node:20-alpine]  port 3000
    │ HTTP interne (réseau Docker rr-net)
    ▼
[Conteneur backend : api]                   port 3001
    │
    ▼
[Base de données PostgreSQL]
```

Le frontend ne connaît le backend qu'à travers la variable d'environnement `NUXT_PUBLIC_API_BASE`. En production Docker, cette valeur est `http://api:3001` — le nom `api` étant résolu par le réseau Docker `rr-net`.

---

## Environnements

| Environnement | Mode Nuxt | URL frontend | URL API |
|---|---|---|---|
| Dev local | `nuxt dev` | http://localhost:3000 | http://localhost:3001 |
| Build local | `nuxt build` + `node .output/server/index.mjs` | http://localhost:3000 | http://localhost:3001 |
| Docker production | conteneur node:20-alpine | http://\<hôte\>:3000 | http://api:3001 (réseau interne) |

---

## Prérequis

- **Node.js** 20 ou supérieur
- **npm** 10 ou supérieur
- **Backend Ressources Relationnelles** démarré et accessible
- **Docker** (pour le déploiement conteneurisé)
- Réseau Docker `rr-net` créé (`docker network create rr-net`)

---

## Démarrage rapide — développement local

```bash
cd frontend

# Copier le fichier d'environnement exemple
cp .env.example .env

# Éditer .env et définir l'URL de l'API backend
# NUXT_PUBLIC_API_BASE=http://localhost:3001

# Installer les dépendances
npm install

# Lancer le serveur de développement (hot-reload)
npm run dev
# → http://localhost:3000
```

---

## Build de production (sans Docker)

```bash
cd frontend

# Construire l'application
npm run build
# Sortie : .output/server/index.mjs

# Démarrer le serveur SSR
NUXT_PUBLIC_API_BASE=http://localhost:3001 node .output/server/index.mjs
# → http://localhost:3000
```

---

## Déploiement Docker

### Fichiers concernés

| Fichier | Rôle |
|---|---|
| `Dockerfile` | Image multi-stage node:20-alpine (build + runtime) |
| `docker-compose.prod.yml` | Orchestration du service `web` en production |
| `.env.production` | Variables d'environnement pour Docker |

### Procédure

```bash
# 1. Créer le réseau Docker partagé (si ce n'est pas déjà fait)
docker network create rr-net

# 2. S'assurer que le backend est démarré sur ce même réseau

# 3. Se placer dans le répertoire frontend
cd frontend

# 4. Copier et configurer le fichier d'environnement de production
cp .env.example .env.production
# Éditer .env.production :
#   NUXT_PUBLIC_API_BASE=http://api:3001

# 5. Construire et démarrer le conteneur
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Le conteneur `web` écoute sur le port **3000**. Pour l'exposer en HTTPS, placer un reverse-proxy (Nginx, Traefik, Caddy) devant lui.

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Super administrateur | superadmin@rr.local | Password123! |
| Administrateur | admin@rr.local | Password123! |
| Modérateur | moderateur@rr.local | Password123! |
| Citoyen | citoyen@rr.local | Password123! |

---

## Variables d'environnement

### `NUXT_PUBLIC_API_BASE`

URL de base de l'API backend, utilisée par le frontend pour construire toutes les requêtes HTTP.

| Contexte | Valeur |
|---|---|
| Dev local | `http://localhost:3001` |
| Docker production | `http://api:3001` |

**Important** : cette variable est préfixée `NUXT_PUBLIC_`, ce qui signifie qu'elle est intégrée dans le bundle JavaScript et **visible par les utilisateurs**. Ne jamais y stocker de clé secrète, mot de passe ou token.

La variable est lue via `nuxt.config.ts` :

```ts
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3001',
  },
},
```

### Tableau exhaustif des variables d'environnement

| Variable | Obligatoire | Défaut | Description |
|---|---|---|---|
| `NUXT_PUBLIC_API_BASE` | Oui | `http://localhost:3001` | URL de l'API backend |
| `NUXT_PUBLIC_APP_BASE_URL` | Non | `http://localhost:3000` | URL publique du frontend (pour les redirections et les liens absolus) |
| `NODE_ENV` | Non | `development` | Mode Node.js (`development`, `production`) |

---

## CI/CD

### Stratégie GitFlow

Le projet suit un GitFlow à **quatre branches d'intégration** :

```
feat/* | fix/* | chore/* | docs/*
        │
        ▼
     develop ──► preprod ──► main
```

| Branche | Rôle | Déploiement |
|---|---|---|
| `develop` | Intégration des fonctionnalités terminées | Environnement de test / QA |
| `preprod` | Stabilisation et validation finale avant production | Environnement de préproduction (déploiement automatique cible **roadmap V1.1**) |
| `main` | Version stable de production, taguée par release | Environnement de production |

Chaque fusion `develop → preprod` puis `preprod → main` passe par une pull request avec revue de code et validation des status checks.

### Pipeline CI

Le workflow `.github/workflows/ci.yml` s'exécute automatiquement à chaque push et pull request sur les branches `main`, `preprod` et `develop`.

Étapes du pipeline :

1. Checkout du code
2. Installation des dépendances (`npm ci`)
3. Lint (`npm run lint`)
4. Tests unitaires (`npm run test:unit:run`)
5. Build de production (`npm run build`)

Un build échoué bloque le merge de la pull request.

**Note** : les tests E2E Playwright ne sont **pas** intégrés en CI car ils nécessitent le backend lancé. Les exécuter en local avant commit.

```bash
npm run test:e2e        # Tests E2E (nécessite backend actif sur :3001)
```

---

## Hébergement statique vs. SSR

### Recommandation pour Ressources Relationnelles

Le frontend RR est déployé en **SSR (Server-Side Rendering)** pour :

1. **Accessibilité initiale** — le contenu HTML est livré dès le premier appel, sans attendre le JavaScript. Les lecteurs d'écran accèdent au contenu complet.
2. **SEO** — bien que RR ne soit pas public, certaines pages (présentation, aide) bénéficient du rendu côté serveur pour une indexation future.
3. **Performance initiale** — pas d'attente de chargement JavaScript avant affichage.

Un déploiement statique (Vercel, Netlify) ne conviendrait que si RR était entièrement public et statique, ce qui n'est pas le cas (authentification, données personnelles, base de données).

---

## Options de cloud

Bien que non exécutées, les options suivantes sont documentées pour une montée en charge future :

### Scaleway Serverless Containers

- **Avantage** : facturation à l'exécution, scaling automatique, DNS géré, certificat HTTPS automatique.
- **Déploiement** : `scw container deploy` après avoir configuré la credentials Scaleway.
- **Port** : le service expose automatiquement le port 3000 via HTTPS.
- **Coût** : ~€10–20/mois selon le trafic (comparé à un VPS fixe).

### OVH Web Hosting

- **Avantage** : hébergement classique, support français, certifiée HDS pour données sensibles.
- **Déploiement** : upload via FTP/Git, `npm install && npm run build` en ligne de commande SSH.
- **Limitation** : la plupart des plans ne supportent que le PHP. Les plans premium (VPS) sont nécessaires pour Node.js.
- **Coût** : VPS (~€10–30/mois).

### VPS (Digital Ocean, Linode, Scaleway Compute)

- **Avantage** : full control, peu cher, support des bases de données.
- **Déploiement** : SSH, git clone, `npm install && npm run build && pm2 start`, systemd service.
- **Monitoring** : UptimeRobot + Sentry pour erreurs applicatives.
- **Coût** : €5–15/mois pour une petite instance.

Pour RR, recommander un **VPS Scaleway Compute** ou **Digital Ocean Droplet** avec un reverse-proxy Nginx (gratuit) plutôt qu'une solution entièrement serverless.

---

## Rollback via git tags

En cas de problème critique en production, un rollback est possible en utilisant les tags git.

### Procédure

```bash
# 1. Lister les versions disponibles
git tag --list

# 2. Voir la description d'un tag
git tag -l -n1

# 3. Checkout vers la version stable (ex. v0.1.0)
git checkout v0.1.0

# 4. Reconstruire le frontend
npm install
npm run build

# 5. Redémarrer le conteneur Docker
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 6. Retour à main après stabilisation
git checkout main
```

Les tags suivent la convention Semantic Versioning : `v<MAJOR>.<MINOR>.<PATCH>`.

---

## Pages de l'application

| Route | Accès | Description |
|---|---|---|
| `/` | Public | Page d'accueil |
| `/presentation` | Public | Présentation de la plateforme |
| `/connexion` | Public | Connexion |
| `/inscription` | Public | Inscription |
| `/accueil` | Authentifié | Accueil connecté |
| `/tableau-de-bord` | Authentifié | Tableau de bord personnel |
| `/ressources` | Authentifié | Liste des ressources |
| `/ressources/:id` | Authentifié | Détail d'une ressource + commentaires |
| `/ajouter-ressource` | Authentifié | Créer une ressource |
| `/modifier-ressource/:id` | Authentifié | Modifier une ressource |
| `/messagerie` | Authentifié | Conversations et messages privés |
| `/mon-compte` | Authentifié | Gestion du compte et du profil |
| `/emotion_tracker` | Authentifié | Journal d'émotions |
| `/moderateur` | Modérateur+ | Back-office de modération |
| `/moderateur/:id` | Modérateur+ | Détail d'un élément à modérer |
| `/admin` | Administrateur+ | Administration (utilisateurs, rôles) |
| `/super-admin` | Super admin | Outils super administrateur |
| `/aide` | Public | Aide |
| `/accessibilite` | Public | Déclaration d'accessibilité |
| `/contact` | Public | Contact |
