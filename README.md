# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## DSFR Installation

Install the official French government Design System (DSFR):

```bash
# npm
npm install @gouvfr/dsfr

# pnpm
pnpm add @gouvfr/dsfr

# yarn
yarn add @gouvfr/dsfr

# bun
bun add @gouvfr/dsfr
```

Copy DSFR assets to the public folder:

```bash
# npm
npx cpy "node_modules/@gouvfr/dsfr/dist/**/*" public/dsfr

# pnpm
pnpm dlx cpy-cli "node_modules/@gouvfr/dsfr/dist/**/*" public/dsfr

# yarn
yarn dlx cpy-cli "node_modules/@gouvfr/dsfr/dist/**/*" public/dsfr
```

Make sure the following files are loaded in `nuxt.config.ts`:

```ts
app: {
  head: {
    link: [
      { rel: 'stylesheet', href: '/dsfr/dsfr/dsfr.min.css' },
      { rel: 'stylesheet', href: '/dsfr/utility/utility.min.css' },
      { rel: 'stylesheet', href: '/dsfr/utility/icons/icons.min.css' }
    ],
    script: [
      { src: '/dsfr/dsfr/dsfr.module.min.js', type: 'module' }
    ]
  }
}
```

## Development Server

Start the development server on `http://localhost:3001`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.