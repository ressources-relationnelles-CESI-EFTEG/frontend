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