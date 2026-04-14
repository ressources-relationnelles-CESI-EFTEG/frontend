<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const _auth = useAuth() as any
const authToken = computed<string | null>(() =>
  (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)

const normalizedRole = computed(() =>
  String(_auth.user?.value?.role ?? '').toLowerCase().trim(),
)
const isModo = computed(() =>
  ['moderateur', 'administrateur', 'super_admin'].includes(normalizedRole.value),
)

async function supprimerRessource() {
  if (!ressource.value) return
  if (!window.confirm(`Supprimer la ressource « ${ressource.value.titre} » ? Cette action est irréversible.`)) return
  await $fetch(`/ressources/${route.params.id}`, {
    baseURL: apiBase,
    method: 'DELETE',
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
  })
  navigateTo('/ressources')
}

const isLoading = ref(true)
const errorMessage = ref('')
const ressource = ref<Record<string, any> | null>(null)

async function fetchRessource() {
  try {
    const data = await $fetch<Record<string, any>>(`/ressources/${route.params.id}`, {
      baseURL: apiBase,
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
    })
    ressource.value = data
  } catch (error: any) {
    if (error?.statusCode === 404) {
      errorMessage.value = 'Cette ressource est introuvable.'
    } else {
      errorMessage.value = 'Impossible de charger cette ressource.'
    }
  }
}

onMounted(async () => {
  await fetchRessource()
  isLoading.value = false
})

function labelType(type: string) {
  const map: Record<string, string> = {
    ARTICLE: 'Article',
    VIDEO: 'Vidéo',
    AUDIO: 'Audio',
    EXERCICE: 'Exercice',
    ACTIVITE: 'Activité',
    JEU: 'Jeu',
  }
  return map[type] ?? type
}

function iconType(type: string) {
  const map: Record<string, string> = {
    ARTICLE: 'fr-icon-article-line',
    VIDEO: 'fr-icon-video-line',
    AUDIO: 'fr-icon-sound-line',
    EXERCICE: 'fr-icon-body-line',
    ACTIVITE: 'fr-icon-calendar-event-line',
    JEU: 'fr-icon-gamepad-line',
  }
  return map[type] ?? 'fr-icon-file-line'
}

function labelRelation(type: string) {
  const map: Record<string, string> = {
    FAMILLE: 'Famille',
    COUPLE: 'Couple',
    AMITIE: 'Amitié',
    PROFESSIONNEL: 'Professionnel',
    COMMUNAUTAIRE: 'Communautaire',
  }
  return map[type] ?? type
}

function labelNiveau(niveau: string) {
  const map: Record<string, string> = {
    DEBUTANT: 'Débutant',
    INTERMEDIAIRE: 'Intermédiaire',
    AVANCE: 'Avancé',
  }
  return map[niveau] ?? niveau
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function nomAuteur(u: Record<string, any> | null | undefined) {
  if (!u) return 'Anonyme'
  return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || 'Anonyme'
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <!-- Fil d'Ariane -->
    <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
      <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-detail">
        Voir le fil d'Ariane
      </button>
      <div class="fr-collapse" id="breadcrumb-detail">
        <ol class="fr-breadcrumb__list">
          <li><NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink></li>
          <li><NuxtLink class="fr-breadcrumb__link" to="/ressources">Ressources</NuxtLink></li>
          <li>
            <a class="fr-breadcrumb__link" aria-current="page">
              {{ ressource?.titre ?? 'Chargement…' }}
            </a>
          </li>
        </ol>
      </div>
    </nav>

    <!-- Chargement -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto rr-loader" role="status" aria-label="Chargement en cours…">
        <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
        <span class="fr-ml-1w">Chargement…</span>
      </div>
    </div>

    <!-- Erreur -->
    <div v-else-if="errorMessage" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
      <h2 class="fr-alert__title">Ressource indisponible</h2>
      <p>{{ errorMessage }}</p>
      <NuxtLink to="/ressources" class="fr-btn fr-btn--tertiary fr-mt-2w">
        Retour aux ressources
      </NuxtLink>
    </div>

    <!-- Contenu -->
    <template v-else-if="ressource">
      <div class="fr-grid-row fr-grid-row--gutters">

        <!-- Colonne principale -->
        <div class="fr-col-12 fr-col-lg-8">

          <!-- En-tête -->
          <div class="rr-detail-header fr-mb-4w">
            <div class="rr-type-row fr-mb-2w">
              <span :class="[iconType(ressource.typeRessource), 'fr-mr-1w rr-type-icon']" aria-hidden="true"></span>
              <span class="fr-text--sm fr-text--grey">{{ labelType(ressource.typeRessource) }}</span>
            </div>

            <h1 class="fr-h2 fr-mb-2w">{{ ressource.titre }}</h1>

            <p v-if="ressource.description" class="fr-text--lg fr-text--grey rr-description">
              {{ ressource.description }}
            </p>

            <!-- Chips -->
            <div class="fr-tags-group fr-mb-3w">
              <p v-if="ressource.categorie" class="fr-tag">
                <span class="fr-icon-folder-2-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                {{ ressource.categorie.nom }}
              </p>
              <p v-if="ressource.typeRelation" class="fr-tag">
                <span class="fr-icon-heart-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                {{ labelRelation(ressource.typeRelation) }}
              </p>
              <p v-if="ressource.niveauDifficulte" class="fr-tag">
                <span class="fr-icon-award-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                {{ labelNiveau(ressource.niveauDifficulte) }}
              </p>
            </div>
          </div>

          <!-- Corps du contenu -->
          <div class="fr-p-4w rr-contenu-block fr-mb-4w">
            <h2 class="fr-h5 fr-mb-2w">
              <span class="fr-icon-file-text-line fr-mr-1w" aria-hidden="true"></span>
              Contenu
            </h2>
            <div class="rr-contenu">{{ ressource.contenu }}</div>
          </div>

          <!-- Navigation retour + actions modération -->
          <div class="fr-btns-group fr-btns-group--inline fr-mt-2w">
            <NuxtLink to="/ressources" class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line">
              Retour aux ressources
            </NuxtLink>
            <button
              v-if="isModo"
              type="button"
              class="fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-delete-line"
              @click="supprimerRessource"
            >
              Supprimer
            </button>
          </div>
        </div>

        <!-- Colonne latérale -->
        <div class="fr-col-12 fr-col-lg-4">
          <aside class="fr-p-3w rr-side-info" aria-label="Informations sur la ressource">

            <!-- Auteur -->
            <h2 class="fr-h6 fr-mb-2w">
              <span class="fr-icon-user-line fr-mr-1w" aria-hidden="true"></span>
              Auteur
            </h2>
            <p class="fr-text--sm fr-mb-3w">{{ nomAuteur(ressource.utilisateur) }}</p>

            <hr class="fr-hr fr-my-2w" />

            <!-- Métadonnées -->
            <h2 class="fr-h6 fr-mb-2w">
              <span class="fr-icon-information-line fr-mr-1w" aria-hidden="true"></span>
              Informations
            </h2>
            <dl class="rr-meta-list">
              <div v-if="ressource.categorie" class="rr-meta-row">
                <dt>Catégorie</dt>
                <dd>{{ ressource.categorie.nom }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Type</dt>
                <dd>{{ labelType(ressource.typeRessource) }}</dd>
              </div>
              <div v-if="ressource.typeRelation" class="rr-meta-row">
                <dt>Relation</dt>
                <dd>{{ labelRelation(ressource.typeRelation) }}</dd>
              </div>
              <div v-if="ressource.niveauDifficulte" class="rr-meta-row">
                <dt>Niveau</dt>
                <dd>{{ labelNiveau(ressource.niveauDifficulte) }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Publié le</dt>
                <dd>{{ formatDate(ressource.dateCreation) }}</dd>
              </div>
            </dl>
          </aside>
        </div>

      </div>
    </template>
  </main>
</template>

<style scoped>
/* En-tête de la ressource */
.rr-detail-header {
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 2rem;
}

.rr-type-row {
  display: flex;
  align-items: center;
}

.rr-type-icon {
  font-size: 1.25rem;
}

.rr-description {
  font-style: italic;
}

/* Corps du contenu */
.rr-contenu-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

.rr-contenu {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 1rem;
}

/* Sidebar */
.rr-side-info {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
  position: sticky;
  top: 1rem;
}

/* Métadonnées */
.rr-meta-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rr-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.rr-meta-row dt {
  color: var(--text-mention-grey);
  flex-shrink: 0;
}

.rr-meta-row dd {
  font-weight: 600;
  text-align: right;
}

/* Loader */
.rr-loader {
  display: flex;
  align-items: center;
  color: var(--text-mention-grey);
}

.rr-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
