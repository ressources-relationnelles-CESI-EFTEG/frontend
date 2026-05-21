# Security Policy

La sécurité de la plateforme **Ressources Relationnelles** est prioritaire. Si vous découvrez une faille de sécurité (XSS, vol de session, CSRF, fuite d'information côté client, etc.), **ne créez pas d'issue publique** : utilisez le canal privé suivant.

## Signaler une vulnérabilité

### Procédure de signalement

1. Ouvrir un **Security Advisory privé** :
   [https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/security/advisories/new](https://github.com/ressources-relationnelles-CESI-EFTEG/frontend/security/advisories/new)
2. Décrire :
   - Le type de vulnérabilité (XSS, CSRF, exposition de secret, mauvaise gestion de session, etc.)
   - L'URL ou le composant concerné (ex. `/ressources/:id`)
   - Les étapes de reproduction (navigateur, version, payload)
   - L'impact estimé (utilisateur, modérateur, administrateur)

### Délais de réponse

| Sévérité | Première réponse | Correctif visé |
|----------|------------------|----------------|
| Critique (XSS exploitable, vol de session, contournement d'authentification) | 24 h | 72 h |
| Élevée | 3 jours | 2 semaines |
| Modérée / faible | 1 semaine | Prochaine release |

### Versions supportées

Seule la branche `main` reçoit des correctifs de sécurité. Les versions taggées antérieures ne sont pas maintenues.

### Politique de divulgation

Nous suivons une **divulgation coordonnée** : la faille n'est rendue publique qu'après mise à disposition d'un correctif. Le déclarant est crédité dans l'avis publié, sauf demande contraire.

### Pour plus de détails

La matrice OWASP Top 10 (front), la conformité RGPD, la matrice des risques et la procédure de gestion d'incident sont documentées dans [`docs/SECURITY.md`](./docs/SECURITY.md) et [`docs/MAINTENANCE.md`](./docs/MAINTENANCE.md).
