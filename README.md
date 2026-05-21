# Ressources Relationnelles — Frontend

[![CI](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/actions/workflows/github-code-scanning/codeql)
[![Latest Release](https://img.shields.io/github/v/release/ressources-relationnelles-CESI-EFTEG/frontend?label=release&color=blue)](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/releases)
[![Licence Ouverte 2.0](https://img.shields.io/badge/Licence-Ouverte_2.0_(Etalab)-000091)](./LICENSE)

![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt.js&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js&logoColor=white)
![DSFR](https://img.shields.io/badge/DSFR-1.14-000091)
![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white)

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

## Licence

Ce projet est distribué sous **[Licence Ouverte 2.0 (Etalab)](./LICENSE)** — la licence officielle de l'État français pour les codes sources et données publiques, conçue pour le secteur public et compatible avec les licences CC-BY, ODC-BY et OGL.

Vous pouvez librement réutiliser, modifier, redistribuer et exploiter ce code, y compris à des fins commerciales, sous la seule condition de mentionner la paternité (source : *Ressources Relationnelles — CESI EFTEG*) et la date de dernière mise à jour de l'information réutilisée.

Choix motivé par le contexte ministériel du projet : la Licence Ouverte est notamment retenue par `data.gouv.fr`, Etalab, beta.gouv.fr et le SocialGouv.
