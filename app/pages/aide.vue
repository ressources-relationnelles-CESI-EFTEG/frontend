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
              <NuxtLink class="fr-nav__link" to="/aide" aria-current="page">Aide</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

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
            <NuxtLink class="fr-link" to="/connexion">Connexion</NuxtLink>
            en renseignant votre adresse e-mail et votre mot de passe.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Comment créer un compte ?</h2>
          <p>
            Si vous n’avez pas encore de compte, vous pouvez utiliser la page
            <NuxtLink class="fr-link" to="/inscription">Inscription</NuxtLink>
            pour créer votre espace personnel.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Où retrouver mes ressources ?</h2>
          <p>
            Une fois connecté, vous pouvez consulter vos contenus depuis la page
            <NuxtLink class="fr-link" to="/mes-ressources">Mes ressources</NuxtLink>.
          </p>
        </section>

        <section class="fr-mb-5w">
          <h2 class="fr-h4">Que faire en cas de problème ?</h2>
          <p>
            Si vous rencontrez une difficulté technique ou une question sur l’utilisation du service,
            vous pouvez utiliser la page
            <NuxtLink class="fr-link" to="/contact">Contactez-nous</NuxtLink>.
          </p>
        </section>
      </div>

      <div class="fr-col-12 fr-col-lg-4">
        <aside class="fr-p-3w rr-side-card">
          <h2 class="fr-h4">Accès rapides</h2>
          <ul class="fr-text--sm fr-mb-0">
            <li><NuxtLink class="fr-link" to="/connexion">Connexion</NuxtLink></li>
            <li><NuxtLink class="fr-link" to="/inscription">Inscription</NuxtLink></li>
            <li><NuxtLink class="fr-link" to="/mes-ressources">Mes ressources</NuxtLink></li>
            <li><NuxtLink class="fr-link" to="/contact">Contactez-nous</NuxtLink></li>
            <li><NuxtLink class="fr-link" to="/accessibilite">Accessibilité</NuxtLink></li>
          </ul>
        </aside>
      </div>
    </div>
  </main>

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
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://info.gouv.fr" target="_blank" rel="noopener">
                info.gouv.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.service-public.fr" target="_blank" rel="noopener">
                service-public.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener">
                legifrance.gouv.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.data.gouv.fr" target="_blank" rel="noopener">
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
        <a class="fr-link fr-link--xs fr-icon-external-link-line fr-link--icon-right" href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" target="_blank" rel="noopener">
          etalab-2.0
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.rr-header-tools {
  display: flex;
  justify-content: flex-end;
}

.rr-auth-buttons {
  justify-content: flex-end;
}

.rr-side-card {
  border: 1px solid var(--border-default-grey);
  background: var(--background-alt-grey);
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