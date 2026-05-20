# Ressources Relationnelles — Frontend

Application web Nuxt 4 de la plateforme **Ressources (Re)lationnelles**. Permet aux citoyens de partager et consulter des ressources liées aux relations (famille, couple, amitié, professionnel, communautaire), d'échanger via une messagerie interne, et aux modérateurs / administrateurs de piloter la plateforme depuis un back-office. Design System de l'État Français (DSFR).

## Prérequis

- Node.js ≥ 20, npm ≥ 10
- Backend Ressources Relationnelles démarré sur le port 3001

## Installation

```bash
npm install
cp .env.example .env
# Éditer .env
```

### Variables d'environnement (`.env`)

```
NUXT_PUBLIC_API_BASE=http://localhost:3001
```

## Démarrage

```bash
npm run dev             # Mode développement — http://localhost:3000
npm run build           # Compiler pour la production
npm run preview         # Prévisualiser le build de production
```

## Tests

```bash
npm run test:unit       # Tests unitaires Vitest
npm run test:unit:run   # Une seule exécution (CI)
npm run test:e2e        # Tests E2E Playwright
npm run test:e2e:ui     # Mode UI interactif
npm run test            # Unit + E2E
```

## Pages disponibles

| Route | Accès | Description |
|-------|-------|-------------|
| `/` | Public | Page d'accueil |
| `/presentation` | Public | Présentation de la plateforme |
| `/connexion` | Public | Connexion |
| `/inscription` | Public | Inscription |
| `/sign-up` | Public | Inscription (variante) |
| `/accueil` | Authentifié | Accueil connecté |
| `/home` | Authentifié | Accueil alternatif |
| `/tableau-de-bord` | Authentifié | Tableau de bord personnel |
| `/ressources` | Authentifié | Liste des ressources |
| `/ressources/:id` | Authentifié | Détail d'une ressource + commentaires |
| `/ajouter-ressource` | Authentifié | Créer une ressource |
| `/modifier-ressource/:id` | Authentifié | Modifier une ressource |
| `/messagerie` | Authentifié | Conversations et messages privés |
| `/mon-compte` | Authentifié | Gestion du compte et du profil |
| `/profile` | Authentifié | Profil public |
| `/emotion_tracker` | Authentifié | Journal d'émotions |
| `/informations` | Public | Pages d'information |
| `/moderateur` | Modérateur+ | Back-office de modération (ressources / commentaires / signalements) |
| `/moderateur/:id` | Modérateur+ | Détail d'un élément à modérer |
| `/admin` | Administrateur+ | Administration (utilisateurs, rôles, statuts) |
| `/super-admin` | Super admin | Outils super administrateur |
| `/aide` | Public | Aide |
| `/accessibilite` | Public | Déclaration d'accessibilité |
| `/contact` | Public | Contact |

## Structure du projet

```
app/
  pages/         Vues (routage automatique Nuxt)
  components/    Composants réutilisables (DSFR)
  composables/   useApi, useAuth — état et appels API côté client
  services/      api-client, auth.service, utilisateur.service
  middleware/    auth, moderateur, admin, super-admin (guards de route)
  types/         Types TypeScript partagés
```

## Rôles et accès

| Rôle | Accès clé |
|------|-----------|
| Visiteur | Accueil, présentation, aide, contact |
| `CITOYEN` | Ressources, messagerie, favoris, commentaires, signalements, progressions |
| `MODERATEUR` | + back-office de modération |
| `ADMINISTRATEUR` | + gestion des utilisateurs, rôles, statuts |
| `SUPER_ADMIN` | + outils super admin |

## Comptes de démonstration

Tous les comptes utilisent le même mot de passe : **`Password123!`**

| Rôle | Email |
|------|-------|
| Super administrateur | superadmin@rr.local |
| Administrateur | admin@rr.local |
| Modérateur | moderateur@rr.local |
| Citoyen | citoyen@rr.local |
