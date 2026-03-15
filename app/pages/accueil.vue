<script setup lang="ts">
/**
 * Accès rapides = des "ressources" (dans le scope existant)
 * Tant qu'on n'a pas une page détail /ressource/:id, on pointe vers les pages existantes :
 * - /mes-ressources
 * - /ajouter-une-ressource
 */
const quickResources = [
  {
    id: 'r1',
    title: 'Découvrir mes ressources',
    to: '/mes-ressources',
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
    to: '/mes-ressources',
    icon: 'fr-icon-file-text-line',
  },
  {
    id: 'r4',
    title: 'Ressources recommandées',
    to: '/mes-ressources',
    icon: 'fr-icon-star-line',
  },
  {
    id: 'r5',
    title: 'Rechercher une ressource',
    to: '/mes-ressources',
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
  <!-- Skip links (RGAA / DSFR) -->
  <div class="fr-skiplinks">
    <nav class="fr-container" aria-label="Accès rapide">
      <ul class="fr-skiplinks__list">
        <li><a class="fr-link" href="#contenu">Aller au contenu</a></li>
        <li><a class="fr-link" href="#navigation">Aller au menu</a></li>
        <li><a class="fr-link" href="#pied">Aller au pied de page</a></li>
      </ul>
    </nav>
  </div>

  <!-- HEADER DSFR + NAV -->
  <header role="banner" class="fr-header">
    <div class="fr-header__body">
      <div class="fr-container">
        <div class="fr-header__body-row">
          <div class="fr-header__brand fr-enlarge-link">
            <div class="fr-header__brand-top">
              <div class="fr-header__logo">
                <p class="fr-logo">
                  Ministère<br />
                  des solidarités<br />
                  et de la santé
                </p>
              </div>

              <div class="fr-header__navbar">
                <button
                  class="fr-btn fr-btn--menu fr-btn--lg"
                  data-fr-opened="false"
                  aria-controls="menu-principal"
                  aria-haspopup="menu"
                  title="Menu"
                >
                  Menu
                </button>
              </div>
            </div>

            <div class="fr-header__service">
              <a class="fr-header__service-title" href="/accueil">
                Ressources relationnelles
              </a>
            </div>
          </div>

          <!-- ✅ Connexion/Inscription alignés à droite -->
          <div class="fr-header__tools rr-header-tools">
            <div class="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left rr-auth-buttons">
              <NuxtLink class="fr-btn fr-btn--secondary fr-icon-lock-line" to="/connexion">
                Connexion
              </NuxtLink>
              <NuxtLink class="fr-btn fr-icon-account-line" to="/inscription">
                Inscription
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fr-header__menu fr-modal" id="menu-principal" aria-label="Menu principal">
      <div class="fr-container">
        <button class="fr-btn--close fr-btn" aria-controls="menu-principal" title="Fermer">
          Fermer
        </button>

        <nav id="navigation" class="fr-nav" role="navigation" aria-label="Navigation principale">
          <ul class="fr-nav__list">
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/accueil" aria-current="page">Accueil</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/tableau-de-bord">Tableau de bord</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/mes-ressources">Mes ressources</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/messagerie">Messagerie</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/mon-compte">Mon compte</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/ajouter-une-ressource">Ajouter une ressource</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/contact">Contactez-nous</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/accessibilite">Accessibilité</NuxtLink>
            </li>

            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/aide">Aide</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <!-- MAIN -->
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <!-- HERO -->
    <section class="fr-grid-row fr-grid-row--gutters fr-align-items-center">
      <div class="fr-col-12 fr-col-md-8">
        <h1 class="fr-h1 fr-text-title--blue-france">
          Des ressources fiables pour accompagner vos relations personnelles et sociales
        </h1>

        <p class="fr-text--lg fr-mt-3w">
          Un service du Ministère des Solidarités et de la Santé pour vous aider à créer des liens plus sereins.
        </p>

        <div class="fr-mt-3w">
          <NuxtLink to="/mes-ressources" class="fr-btn">
            Découvrir les ressources
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Accès rapides = ressources -->
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

  <!-- FOOTER -->
  <footer id="pied" role="contentinfo" class="fr-footer">
    <div class="fr-container">
      <div class="fr-footer__body rr-footer-body">
        <div class="rr-footer-left">
          <div class="rr-footer-ministry">
            <div class="rr-footer-ministry-title">
              MINISTÈRE<br />DES SOLIDARITÉS<br />ET DE LA SANTÉ
            </div>
            <div class="rr-footer-motto">Liberté<br />Égalité<br />Fraternité</div>
          </div>
        </div>

        <div class="rr-footer-mid">
          <p class="rr-footer-text">
            Ce site est géré par le Ministère des solidarités et de la santé
          </p>

          <ul class="rr-footer-sites rr-footer-sites--center" aria-label="Liens officiels">
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://info.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                info.gouv.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.service-public.fr"
                target="_blank"
                rel="noopener"
              >
                service-public.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.legifrance.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                legifrance.gouv.fr
              </a>
            </li>
            <li>
              <a
                class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                href="https://www.data.gouv.fr"
                target="_blank"
                rel="noopener"
              >
                data.gouv.fr
              </a>
            </li>
          </ul>
        </div>
      </div>

      <hr class="fr-hr fr-mt-3w fr-mb-2w" />

      <div class="rr-footer-bottom-links">
        <ul class="rr-footer-bottom-list" aria-label="Liens de bas de page">
          <li>
            <NuxtLink class="fr-link fr-link--sm" to="/accessibilite">Accessibilité</NuxtLink>
          </li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Mentions légales</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Données personnelles</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Gestion des cookies</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Plan du site</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li>
            <a class="fr-link fr-link--sm fr-icon-settings-5-line fr-link--icon-left" href="#" @click.prevent>
              Paramètres d’affichage
            </a>
          </li>
        </ul>
      </div>

      <p class="fr-text--xs fr-mt-2w rr-footer-licence">
        Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence
        <a
          class="fr-link fr-link--xs fr-icon-external-link-line fr-link--icon-right"
          href="https://www.etalab.gouv.fr/licence-ouverte-open-licence"
          target="_blank"
          rel="noopener"
        >
          etalab-2.0
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
/* ✅ force boutons auth à droite */
.rr-header-tools {
  display: flex;
  justify-content: flex-end;
}

.rr-auth-buttons {
  justify-content: flex-end;
}

/* Carrousel */
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

/* Uniformiser icônes DSFR (render via ::before) */
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

/* Footer */
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