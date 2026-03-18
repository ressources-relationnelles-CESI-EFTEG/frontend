<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const { user, logout, isLoggedIn, authToken, refreshToken } = useAuth()
</script>

<template>
  <main id="contenu" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-lg-10">
        <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
          <button
            class="fr-breadcrumb__button"
            aria-expanded="false"
            aria-controls="breadcrumb-dashboard"
          >
            Voir le fil d’Ariane
          </button>
          <div id="breadcrumb-dashboard" class="fr-collapse">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink to="/accueil" class="fr-breadcrumb__link">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Tableau de bord</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Tableau de bord</h1>
          <p class="fr-text--lg fr-mb-0">
            Bienvenue sur votre espace personnel.
          </p>
        </header>

        <div class="fr-alert fr-alert--success fr-mb-4w" aria-live="polite">
          <h2 class="fr-alert__title">Connexion active</h2>
          <p>
            Vous êtes bien connecté à l’application.
          </p>
        </div>

        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12 fr-col-md-6">
            <div class="fr-card fr-enlarge-link">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <h2 class="fr-card__title">
                    <a href="#">Informations utilisateur</a>
                  </h2>

                  <div class="fr-mt-2w">
                    <p class="fr-mb-1w">
                      <strong>Connecté :</strong>
                      {{ isLoggedIn ? 'Oui' : 'Non' }}
                    </p>

                    <p class="fr-mb-1w">
                      <strong>Prénom :</strong>
                      {{ user?.firstname || 'Non renseigné' }}
                    </p>

                    <p class="fr-mb-1w">
                      <strong>Nom :</strong>
                      {{ user?.lastname || 'Non renseigné' }}
                    </p>

                    <p class="fr-mb-1w">
                      <strong>Email :</strong>
                      {{ user?.email || 'Non renseigné' }}
                    </p>

                    <p class="fr-mb-1w">
                      <strong>Rôle :</strong>
                      {{ user?.role || 'Non renseigné' }}
                    </p>

                    <p class="fr-mb-0">
                      <strong>ID :</strong>
                      {{ user?.id || 'Non renseigné' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="fr-col-12 fr-col-md-6">
            <div class="fr-card fr-enlarge-link">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <h2 class="fr-card__title">
                    <a href="#">État de l’authentification</a>
                  </h2>

                  <div class="fr-mt-2w">
                    <p class="fr-mb-1w">
                      <strong>auth_token :</strong>
                      {{ authToken ? 'Présent' : 'Absent' }}
                    </p>

                    <p class="fr-mb-1w">
                      <strong>refresh_token :</strong>
                      {{ refreshToken ? 'Présent' : 'Absent' }}
                    </p>

                    <p class="fr-mb-0">
                      Cette carte permet de vérifier rapidement que la session
                      reste active après rechargement de la page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="fr-col-12">
            <div class="fr-card">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <h2 class="fr-card__title">Actions de test</h2>

                  <div class="fr-btns-group fr-btns-group--inline-md fr-mt-2w">
                    <NuxtLink to="/mon-compte" class="fr-btn fr-btn--secondary">
                      Aller à mon compte
                    </NuxtLink>

                    <NuxtLink to="/mes-ressources" class="fr-btn fr-btn--secondary">
                      Aller à mes ressources
                    </NuxtLink>

                    <NuxtLink to="/messagerie" class="fr-btn fr-btn--secondary">
                      Aller à la messagerie
                    </NuxtLink>

                    <button class="fr-btn fr-btn--tertiary" type="button" @click="logout">
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="fr-col-12">
            <div class="fr-alert fr-alert--info fr-mt-4w">
              <h2 class="fr-alert__title">Test conseillé</h2>
              <p class="fr-mb-0">
                Connectez-vous, arrivez sur cette page, puis faites un F5 pour vérifier
                que vous restez bien connecté.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>