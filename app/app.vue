<template>
  <div>
    <div class="fr-skiplinks">
      <nav class="fr-container" aria-label="Accès rapide">
        <ul class="fr-skiplinks__list">
          <li><a class="fr-link" href="#contenu">Aller au contenu</a></li>
          <li><a class="fr-link" href="#navigation">Aller au menu</a></li>
          <li><a class="fr-link" href="#pied">Aller au pied de page</a></li>
        </ul>
      </nav>
    </div>

    <AppHeader />
    <NuxtPage />
    <AppFooter />
  </div>
</template>