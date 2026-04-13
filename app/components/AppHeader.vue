<script setup lang="ts">
const { isLoggedIn, logout } = useAuth()
</script>

<template>
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
              <NuxtLink class="fr-header__service-title" to="/accueil">
                Ressources relationnelles
              </NuxtLink>
            </div>
          </div>

          <div class="fr-header__tools rr-header-tools">
            <div class="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left rr-auth-buttons">
              <template v-if="isLoggedIn">
                <NuxtLink class="fr-btn fr-btn--secondary fr-icon-account-line" to="/mon-compte">
                  Mon compte
                </NuxtLink>

                <button
                  type="button"
                  class="fr-btn fr-icon-lock-line"
                  @click="logout"
                >
                  Déconnexion
                </button>
              </template>

              <template v-else>
                <NuxtLink class="fr-btn fr-btn--secondary fr-icon-lock-line" to="/connexion">
                  Connexion
                </NuxtLink>

                <NuxtLink class="fr-btn fr-icon-account-line" to="/inscription">
                  Inscription
                </NuxtLink>
              </template>
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
              <NuxtLink class="fr-nav__link" to="/accueil">Accueil</NuxtLink>
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
</template>

<style scoped>
.rr-header-tools {
  display: flex;
  justify-content: flex-end;
}

.rr-auth-buttons {
  justify-content: flex-end;
}
</style>