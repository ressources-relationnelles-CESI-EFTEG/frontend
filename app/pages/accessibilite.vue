<script setup lang="ts">
useHead({
  title: 'Accessibilité',
})
</script>

<template>

  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-lg-8">
        <nav class="fr-breadcrumb" aria-label="Vous êtes ici :">
          <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
            Voir le fil d’Ariane
          </button>
          <div class="fr-collapse" id="breadcrumb-1">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Accessibilité</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Accessibilité</h1>
          <p class="fr-text--lg fr-mb-0">
            Le site est en cours d’amélioration continue sur les sujets liés à l’accessibilité.
          </p>
        </header>

        <div class="fr-alert fr-alert--info fr-mb-4w">
          <h2 class="fr-alert__title">État de conformité</h2>
          <p>
            Certaines fonctionnalités sont encore en cours d’amélioration.
          </p>
        </div>

        <section>
          <h2 class="fr-h4">Nous contacter</h2>
          <p>
            Utilisez la page
            <NuxtLink class="fr-link" to="/contact">Contactez-nous</NuxtLink>
            pour signaler un problème.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>