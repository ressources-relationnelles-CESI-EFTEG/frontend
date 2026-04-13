<script setup lang="ts">
</script>

<template>
  <div class="fr-skiplinks">
    <nav class="fr-container" aria-label="Accès rapide">
      <ul class="fr-skiplinks__list">
        <li><a class="fr-link" href="#contenu">Aller au contenu</a></li>
        <li><a class="fr-link" href="#navigation">Aller au menu</a></li>
        <li><a class="fr-link" href="#pied">Aller au pied de page</a></li>
      </ul>
    </nav>
  </div>


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
            Ressources relationnelles s’inscrit dans une démarche de conception accessible et de respect des bonnes pratiques du web public.
          </p>
        </header>

        <div class="fr-alert fr-alert--info fr-mb-4w">
          <h2 class="fr-alert__title">État de conformité</h2>
          <p>
            Le site est actuellement en cours d’amélioration continue sur les sujets liés à l’accessibilité numérique.
          </p>
        </div>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Nous contacter</h2>
          <p>
            Si vous rencontrez une difficulté d’accès à un contenu ou à une fonctionnalité, vous pouvez utiliser la page
            <NuxtLink class="fr-link" to="/contact">Contactez-nous</NuxtLink>
            pour nous signaler le problème.
          </p>
        </section>
      </div>
    </div>
  </main>

</template>

<style scoped>
.rr-header-tools {
  display: flex;
  justify-content: flex-end;
}

.rr-auth-buttons {
  justify-content: flex-end;
}

.rr-footer-body {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
}

.rr-footer-ministry-title {
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.1;
  font-size: 0.95rem;
}

.rr-footer-motto {
  margin-top: 0.5rem;
  font-style: italic;
  font-size: 0.8rem;
  line-height: 1.2;
}

.rr-footer-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rr-footer-text {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
}

.rr-footer-sites {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.rr-footer-sites--center {
  justify-content: center;
}

.rr-footer-bottom-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.rr-sep {
  opacity: 0.6;
}

.rr-footer-licence {
  margin-bottom: 0;
}

@media (max-width: 980px) {
  .rr-footer-body {
    grid-template-columns: 1fr;
  }

  .rr-footer-mid {
    align-items: flex-start;
  }

  .rr-footer-text {
    text-align: left;
  }

  .rr-footer-sites--center {
    justify-content: flex-start;
  }
}
</style>