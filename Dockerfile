# syntax=docker/dockerfile:1.7

# -----------------------------------------------------------------------------
# Stage 1 — Builder
# Compile l'application Nuxt 4 en mode SSR (Nitro server output).
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances en exploitant le cache Docker
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copier le reste du code source et builder
COPY nuxt.config.ts tsconfig.json ./
COPY app ./app
COPY public ./public

# Le postinstall lance `nuxt prepare` qui génère .nuxt/tsconfig.app.json,
# nécessaire avant `nuxt build`. nuxt build produit `.output/server/index.mjs`
# et `.output/public/` (assets statiques).
RUN npx nuxt build


# -----------------------------------------------------------------------------
# Stage 2 — Runtime
# Image minimale qui sert l'application en SSR via Nitro.
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

# dumb-init : propage correctement les signaux SIGTERM/SIGINT à Node
RUN apk add --no-cache dumb-init

# Le serveur Nitro est autonome — `.output/` contient tout ce qu'il faut.
# Pas besoin de copier node_modules : Nitro bundle les dépendances utiles.
COPY --from=builder /app/.output ./.output

# Exécution en utilisateur non-root
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Healthcheck : la racine /  rend 200 OK quand Nuxt est prêt
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
