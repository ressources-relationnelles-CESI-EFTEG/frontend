<script setup lang="ts">
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const _auth = useAuth() as any
const authToken = computed<string | null>(() =>
  (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)

// --- État ---
const isLoading = ref(true)
const errorMessage = ref('')
const ressources = ref<Record<string, any>[]>([])
const categories = ref<Record<string, any>[]>([])

// --- Filtres ---
const filtreType = ref('')
const filtreCategorie = ref('')

// --- Options ---
const typesRessource = [
  { value: '', label: 'Tous les types' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'EXERCICE', label: 'Exercice' },
  { value: 'ACTIVITE', label: 'Activité' },
  { value: 'JEU', label: 'Jeu' },
]

// --- Chargement ---
async function fetchRessources() {
  try {
    const data = await $fetch<Record<string, any>[]>('/ressources', {
      baseURL: apiBase,
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
    })
    ressources.value = data
  } catch {
    errorMessage.value = 'Impossible de charger les ressources.'
  }
}

async function fetchCategories() {
  try {
    const data = await $fetch<Record<string, any>[]>('/categories', {
      baseURL: apiBase,
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
    })
    categories.value = data
  } catch {
    categories.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchRessources(), fetchCategories()])
  isLoading.value = false
})

// --- Filtres calculés ---
const ressourcesFiltrees = computed(() =>
  ressources.value.filter((r) => {
    if (filtreType.value && r.typeRessource !== filtreType.value) return false
    if (filtreCategorie.value && String(r.categorie?.idCategorie) !== filtreCategorie.value) return false
    return true
  }),
)

function resetFiltres() {
  filtreType.value = ''
  filtreCategorie.value = ''
}

// --- Utilitaires ---
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
    VIDEO: 'fr-icon-film-line',
    AUDIO: 'fr-icon-sound-line',
    EXERCICE: 'fr-icon-body-line',
    ACTIVITE: 'fr-icon-calendar-event-line',
    JEU: 'fr-icon-gamepad-line',
  }
  return map[type] ?? 'fr-icon-file-line'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function nomAuteur(ressource: Record<string, any>) {
  const u = ressource.utilisateur
  if (!u) return 'Anonyme'
  return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || 'Anonyme'
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <!-- Fil d'Ariane -->
    <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
      <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-ressources">
        Voir le fil d'Ariane
      </button>
      <div class="fr-collapse" id="breadcrumb-ressources">
        <ol class="fr-breadcrumb__list">
          <li><NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink></li>
          <li><a class="fr-breadcrumb__link" aria-current="page">Ressources</a></li>
        </ol>
      </div>
    </nav>

    <!-- En-tête -->
    <div class="fr-grid-row fr-grid-row--middle fr-mb-4w rr-page-header">
      <div class="fr-col">
        <h1 class="fr-h3 fr-mb-1w">
          <span class="fr-icon-folder-2-line fr-mr-1w" aria-hidden="true"></span>
          Ressources
        </h1>
        <p class="fr-text--sm fr-text--grey fr-mb-0">
          Découvrez toutes les ressources publiées par la communauté
        </p>
      </div>
      <div v-if="authToken" class="fr-col-auto">
        <NuxtLink to="/ajouter-ressource" class="fr-btn fr-btn--icon-left fr-icon-add-circle-line">
          Créer une ressource
        </NuxtLink>
      </div>
    </div>

    <!-- Erreur globale -->
    <div v-if="errorMessage" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
      <h2 class="fr-alert__title">Une erreur est survenue</h2>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Chargement -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto">
        <div class="rr-loader" aria-label="Chargement en cours…" role="status">
          <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
          <span class="fr-ml-1w">Chargement des ressources…</span>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Bloc filtres -->
      <div class="fr-p-3w fr-mb-4w rr-filter-block">
        <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div class="fr-col-12">
            <p class="fr-text--sm fr-text--bold fr-mb-2w">
              <span class="fr-icon-filter-line fr-mr-1w" aria-hidden="true"></span>
              Filtrer :
            </p>
          </div>

          <div class="fr-col-6 fr-col-md-4">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-type">Type</label>
              <select id="filtre-type" v-model="filtreType" class="fr-select">
                <option v-for="opt in typesRessource" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="fr-col-6 fr-col-md-4">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-categorie">Catégorie</label>
              <select id="filtre-categorie" v-model="filtreCategorie" class="fr-select">
                <option value="">Toutes</option>
                <option v-for="cat in categories" :key="cat.idCategorie" :value="String(cat.idCategorie)">
                  {{ cat.nom }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="fr-mt-2w">
          <button
            type="button"
            class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-close-circle-line"
            @click="resetFiltres"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Résultats -->
      <section aria-labelledby="titre-ressources">
        <div class="fr-grid-row fr-grid-row--middle fr-mb-3w">
          <div class="fr-col">
            <h2 id="titre-ressources" class="fr-h4 fr-mb-0">
              Toutes les ressources
              <span class="fr-badge fr-badge--blue-cumulus fr-ml-1w">{{ ressourcesFiltrees.length }}</span>
            </h2>
          </div>
        </div>

        <div v-if="ressourcesFiltrees.length === 0" class="fr-alert fr-alert--info">
          <h3 class="fr-alert__title">Aucune ressource trouvée</h3>
          <p>Aucune ressource ne correspond aux filtres sélectionnés.</p>
        </div>

        <div v-else class="fr-grid-row fr-grid-row--gutters">
          <div
            v-for="ressource in ressourcesFiltrees"
            :key="ressource.idRessource"
            class="fr-col-12 fr-col-md-6 fr-col-lg-4"
          >
            <div class="fr-card rr-resource-card">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <!-- Icône + Type -->
                  <div class="rr-card-type fr-mb-1w">
                    <span :class="[iconType(ressource.typeRessource), 'fr-mr-1w']" aria-hidden="true"></span>
                    <span class="fr-text--sm fr-text--grey">{{ labelType(ressource.typeRessource) }}</span>
                  </div>

                  <!-- Titre -->
                  <h3 class="fr-card__title fr-mb-1w">
                    <NuxtLink :to="`/ressources/${ressource.idRessource}`" class="fr-card__link">
                      {{ ressource.titre }}
                    </NuxtLink>
                  </h3>

                  <!-- Description -->
                  <p class="fr-card__desc fr-text--sm rr-card-desc">
                    {{ ressource.description || 'Aucune description.' }}
                  </p>

                  <!-- Tags catégorie + type -->
                  <div class="fr-tags-group fr-mb-2w">
                    <p v-if="ressource.categorie" class="fr-tag fr-tag--sm">{{ ressource.categorie.nom }}</p>
                    <p class="fr-tag fr-tag--sm">{{ labelType(ressource.typeRessource) }}</p>
                  </div>

                  <!-- Métadonnées -->
                  <div class="rr-card-meta fr-text--sm fr-text--grey fr-mb-1v">
                    <span class="fr-icon-user-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    {{ nomAuteur(ressource) }}
                  </div>
                  <div class="rr-card-meta fr-text--sm fr-text--grey">
                    <span class="fr-icon-calendar-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    {{ formatDate(ressource.dateCreation) }}
                  </div>
                </div>

                <!-- Action -->
                <div class="fr-card__footer rr-card-footer">
                  <ul class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
                    <li>
                      <NuxtLink
                        :to="`/ressources/${ressource.idRessource}`"
                        class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                      >
                        Voir
                      </NuxtLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.rr-page-header {
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.5rem;
}

.rr-filter-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

.rr-resource-card {
  height: 100%;
  border: 1px solid var(--border-default-grey);
  transition: box-shadow 0.2s ease;
}

.rr-resource-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 18, 0.12);
}

.rr-card-type {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rr-card-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-mention-grey);
}

.rr-card-meta {
  display: flex;
  align-items: center;
}

.rr-card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-default-grey);
}

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
