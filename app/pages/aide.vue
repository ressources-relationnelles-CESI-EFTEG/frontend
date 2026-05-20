<script setup lang="ts">
useHead({
  title: 'Aide',
})
</script>

<template>

  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--gutters">
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
                <a class="fr-breadcrumb__link" aria-current="page">Aide</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Aide</h1>
          <p class="fr-text--lg fr-mb-0">
            Cette page rassemble les principales informations pour vous aider à utiliser la plateforme Ressources relationnelles.
          </p>
        </header>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">À quoi sert la plateforme ?</h2>
          <p>
            Ressources relationnelles permet d’accéder à des contenus utiles pour accompagner les relations personnelles et sociales,
            retrouver ses ressources, gérer son compte et utiliser une messagerie dédiée.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Comment se connecter ?</h2>
          <p>
            Si vous disposez déjà d’un compte, vous pouvez utiliser la page
            <NuxtLink class="fr-link" to="/connexion">Connexion</NuxtLink>.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Comment créer un compte ?</h2>
          <p>
            Utilisez la page
            <NuxtLink class="fr-link" to="/inscription">Inscription</NuxtLink>.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Que faire en cas de problème ?</h2>
          <p>
            Utilisez la page
            <NuxtLink class="fr-link" to="/contact">Contactez-nous</NuxtLink>.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>