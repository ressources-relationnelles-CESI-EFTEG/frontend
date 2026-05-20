<script setup lang="ts">
const { isLoggedIn, logout } = useAuth()


const quickResources = [
  {
    id: 'r1',
    title: 'Découvrir mes ressources',
    to: '/ressources',
    icon: 'fr-icon-book-2-line',
  },
  {
    id: 'r2',
    title: 'Ajouter une ressource',
    to: '/ajouter-une-ressource',
    icon: 'fr-icon-add-circle-line',
  },
  {
    id: 'r3',
    title: 'Dernières ressources',
    to: '/ressources',
    icon: 'fr-icon-file-text-line',
  },
  {
    id: 'r4',
    title: 'Ressources recommandées',
    to: '/ressources',
    icon: 'fr-icon-star-line',
  },
  {
    id: 'r5',
    title: 'Rechercher une ressource',
    to: '/ressources',
    icon: 'fr-icon-search-line',
  },
]

const listEl = ref<HTMLElement | null>(null)

function scrollLeft() {
  listEl.value?.scrollBy({ left: -320, behavior: 'smooth' })
}

function scrollRight() {
  listEl.value?.scrollBy({ left: 320, behavior: 'smooth' })
}
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
    <section class="fr-grid-row fr-grid-row--gutters fr-align-items-center">
      <div class="fr-col-12 fr-col-md-8">
        <h1 class="fr-h1 fr-text-title--blue-france">
          Des ressources fiables pour accompagner vos relations personnelles et sociales
        </h1>

        <p class="fr-text--lg fr-mt-3w">
          Un service du Ministère des Solidarités et de la Santé pour vous aider à créer des liens plus sereins.
        </p>

        <div class="fr-mt-3w">
          <NuxtLink to="/ressources" class="fr-btn">
            Découvrir les ressources
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="fr-mt-8w" aria-labelledby="acces-rapides-title">
      <h2 id="acces-rapides-title" class="fr-h2">Accès rapides</h2>

      <div class="rr-carousel-wrapper">
        <button
          class="fr-btn fr-btn--secondary fr-icon-arrow-left-line"
          type="button"
          @click="scrollLeft"
          aria-label="Faire défiler vers la gauche"
        />

        <ul
          ref="listEl"
          class="rr-carousel"
          tabindex="0"
          aria-label="Accès rapides vers les ressources (défilement horizontal)"
        >
          <li v-for="item in quickResources" :key="item.id" class="rr-carousel-item">
            <NuxtLink class="fr-tile fr-enlarge-link" :to="item.to">
              <div class="fr-tile__body">
                <h3 class="fr-tile__title">
                  <span class="fr-tile__link">{{ item.title }}</span>
                </h3>
              </div>

              <div class="fr-tile__img">
                <span class="rr-icon" :class="item.icon" aria-hidden="true"></span>
              </div>
            </NuxtLink>
          </li>
        </ul>

        <button
          class="fr-btn fr-btn--secondary fr-icon-arrow-right-line"
          type="button"
          @click="scrollRight"
          aria-label="Faire défiler vers la droite"
        />
      </div>
    </section>
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

.rr-carousel-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rr-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0;
  list-style: none;
}

.rr-carousel:focus {
  outline: 3px solid var(--focus);
  outline-offset: 4px;
}

.rr-carousel-item {
  flex: 0 0 auto;
  width: 260px;
}

.rr-carousel-item .fr-tile__img {
  display: flex;
  align-items: center;
  justify-content: center;
}

.rr-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rr-icon::before {
  font-size: 2.5rem;
  line-height: 1;
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