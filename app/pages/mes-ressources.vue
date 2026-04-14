<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
// Compatibilité : le composable peut exposer "authToken" ou "token" selon la version
const _auth = useAuth() as any
const user = _auth.user as Ref<any>
const authToken = computed<string | null>(() =>
  (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)
// Récupère l'id quel que soit le nom du champ (id ou idUtilisateur)
const userId = computed(() => (user.value as any)?.id ?? (user.value as any)?.idUtilisateur ?? null)

// --- État ---
const isLoading = ref(true)
const errorMessage = ref('')

const mesRessources = ref<Record<string, any>[]>([])
const ressourcesPartagees = ref<Record<string, any>[]>([])
const categories = ref<Record<string, any>[]>([])

// --- Filtres ---
const filtreType = ref('')
const filtreCategorie = ref('')
const filtreVisibilite = ref('')
const filtreStatut = ref('')

// --- Modal suppression ---
const showDeleteModal = ref(false)
const ressourceASupprimer = ref<Record<string, any> | null>(null)
const isDeleting = ref(false)

// --- Options ---
const typesRessource = [
  { value: '', label: 'Tous les types' },
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Vidéo' },
  { value: 'audio', label: 'Audio' },
  { value: 'exercice', label: 'Exercice' },
  { value: 'activite', label: 'Activité' },
  { value: 'jeu', label: 'Jeu' },
]

const visibilites = [
  { value: '', label: 'Toutes' },
  { value: 'privee', label: 'Privée' },
  { value: 'partagee', label: 'Partagée' },
  { value: 'publique', label: 'Publique' },
]

const statuts = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'valide', label: 'Validée' },
  { value: 'rejetee', label: 'Rejetée' },
]

// --- Chargement ---
async function fetchMesRessources() {
  if (!userId.value) return
  try {
    const data = await $fetch<Record<string, any>[]>(`/ressources/utilisateur/${userId.value}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    mesRessources.value = data
  } catch {
    errorMessage.value = 'Impossible de charger vos ressources.'
  }
}

async function fetchRessourcesPartagees() {
  if (!userId.value) return
  try {
    const data = await $fetch<Record<string, any>[]>(`/ressources/partagees/${userId.value}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    ressourcesPartagees.value = data
  } catch {
    // Silencieux — peut être vide
  }
}

async function fetchCategories() {
  try {
    const data = await $fetch<Record<string, any>[]>('/categories', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    categories.value = data
  } catch {
    categories.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchMesRessources(), fetchRessourcesPartagees(), fetchCategories()])
  isLoading.value = false
})

// --- Filtres calculés ---
function applyFilters(list: Record<string, any>[]) {
  return list.filter((r) => {
    if (filtreType.value && r.typeRessource !== filtreType.value) return false
    if (filtreCategorie.value && String(r.idCategorie) !== filtreCategorie.value) return false
    if (filtreVisibilite.value && r.visibilite !== filtreVisibilite.value) return false
    if (filtreStatut.value && r.statut !== filtreStatut.value) return false
    return true
  })
}

const mesRessourcesFiltrees = computed(() => applyFilters(mesRessources.value))
const ressourcesPartageesFilrees = computed(() => applyFilters(ressourcesPartagees.value))

function resetFiltres() {
  filtreType.value = ''
  filtreCategorie.value = ''
  filtreVisibilite.value = ''
  filtreStatut.value = ''
}

// --- Suppression ---
function demanderSuppression(ressource: Record<string, any>) {
  ressourceASupprimer.value = ressource
  showDeleteModal.value = true
}

function annulerSuppression() {
  showDeleteModal.value = false
  ressourceASupprimer.value = null
}

async function confirmerSuppression() {
  if (!ressourceASupprimer.value) return
  isDeleting.value = true
  try {
    await $fetch(`/ressources/${ressourceASupprimer.value.idRessource}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    mesRessources.value = mesRessources.value.filter(
      (r) => r.idRessource !== ressourceASupprimer.value!.idRessource,
    )
    ressourcesPartagees.value = ressourcesPartagees.value.filter(
      (r) => r.idRessource !== ressourceASupprimer.value!.idRessource,
    )
    showDeleteModal.value = false
    ressourceASupprimer.value = null
  } catch {
    errorMessage.value = 'La suppression a échoué. Veuillez réessayer.'
  } finally {
    isDeleting.value = false
  }
}

// --- Utilitaires ---
function labelStatut(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'Brouillon',
    en_attente: 'En attente',
    valide: 'Validée',
    rejetee: 'Rejetée',
  }
  return map[statut] ?? statut
}

function badgeStatut(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'fr-badge--blue-cumulus',
    en_attente: 'fr-badge--yellow-tournesol',
    valide: 'fr-badge--success',
    rejetee: 'fr-badge--error',
  }
  return map[statut] ?? ''
}

function labelType(type: string) {
  const map: Record<string, string> = {
    article: 'Article',
    video: 'Vidéo',
    audio: 'Audio',
    exercice: 'Exercice',
    activite: 'Activité',
    jeu: 'Jeu',
  }
  return map[type] ?? type
}

function iconType(type: string) {
  const map: Record<string, string> = {
    article: 'fr-icon-article-line',
    video: 'fr-icon-video-line',
    audio: 'fr-icon-sound-line',
    exercice: 'fr-icon-body-line',
    activite: 'fr-icon-calendar-event-line',
    jeu: 'fr-icon-gamepad-line',
  }
  return map[type] ?? 'fr-icon-file-line'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR')
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
          <li><NuxtLink class="fr-breadcrumb__link" to="/mon-compte">Mon compte</NuxtLink></li>
          <li><a class="fr-breadcrumb__link" aria-current="page">Mes ressources</a></li>
        </ol>
      </div>
    </nav>

    <!-- En-tête -->
    <div class="fr-grid-row fr-grid-row--middle fr-mb-4w rr-page-header">
      <div class="fr-col">
        <h1 class="fr-h3 fr-mb-1w">
          <span class="fr-icon-folder-2-line fr-mr-1w" aria-hidden="true"></span>
          Mes ressources
        </h1>
        <p class="fr-text--sm fr-text--grey fr-mb-0">
          Gérez vos ressources personnelles et partagées
        </p>
      </div>
      <div class="fr-col-auto">
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
          <span class="fr-ml-1w">Chargement de vos ressources…</span>
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

          <div class="fr-col-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-type">Type</label>
              <select id="filtre-type" v-model="filtreType" class="fr-select">
                <option v-for="opt in typesRessource" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="fr-col-6 fr-col-md-3">
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

          <div class="fr-col-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-visibilite">Visibilité</label>
              <select id="filtre-visibilite" v-model="filtreVisibilite" class="fr-select">
                <option v-for="opt in visibilites" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="fr-col-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-statut">Statut</label>
              <select id="filtre-statut" v-model="filtreStatut" class="fr-select">
                <option v-for="opt in statuts" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="fr-mt-2w">
          <button type="button" class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-close-circle-line" @click="resetFiltres">
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Section : Mes documents -->
      <section class="fr-mb-6w" aria-labelledby="titre-mes-ressources">
        <div class="fr-grid-row fr-grid-row--middle fr-mb-3w">
          <div class="fr-col">
            <h2 id="titre-mes-ressources" class="fr-h4 fr-mb-0">
              Mes ressources
              <span class="fr-badge fr-badge--blue-cumulus fr-ml-1w">{{ mesRessourcesFiltrees.length }}</span>
            </h2>
          </div>
        </div>

        <div v-if="mesRessourcesFiltrees.length === 0" class="fr-alert fr-alert--info">
          <h3 class="fr-alert__title">Aucune ressource trouvée</h3>
          <p>
            Vous n'avez pas encore créé de ressource, ou aucune ne correspond aux filtres.
          </p>
        </div>

        <div v-else class="fr-grid-row fr-grid-row--gutters">
          <div
            v-for="ressource in mesRessourcesFiltrees"
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
                    <button
                      type="button"
                      class="fr-btn--icon-only fr-icon-star-line rr-favori-btn"
                      :class="{ 'fr-icon-star-fill rr-favori-btn--active': ressource.estFavori }"
                      :aria-label="ressource.estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                      :title="ressource.estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                    ></button>
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

                  <!-- Badges -->
                  <div class="fr-tags-group fr-mb-2w">
                    <p class="fr-tag fr-tag--sm">{{ labelType(ressource.typeRessource) }}</p>
                    <p
                      class="fr-badge fr-badge--sm fr-ml-1w"
                      :class="badgeStatut(ressource.statut)"
                    >
                      {{ labelStatut(ressource.statut) }}
                    </p>
                  </div>

                  <!-- Métadonnées -->
                  <div class="rr-card-meta fr-text--sm fr-text--grey">
                    <span class="fr-icon-calendar-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    Créée le {{ formatDate(ressource.dateCreation) }}
                  </div>
                  <div v-if="ressource.nombreVues != null" class="rr-card-meta fr-text--sm fr-text--grey">
                    <span class="fr-icon-eye-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    {{ ressource.nombreVues }} vue{{ ressource.nombreVues > 1 ? 's' : '' }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
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
                  <li>
                    <NuxtLink
                      :to="`/ressources/${ressource.idRessource}/modifier`"
                      class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-edit-line"
                    >
                      Modifier
                    </NuxtLink>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line rr-btn-delete"
                      @click="demanderSuppression(ressource)"
                    >
                      Supprimer
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section : Ressources partagées avec moi -->
      <section aria-labelledby="titre-ressources-partagees">
        <div class="fr-grid-row fr-grid-row--middle fr-mb-3w">
          <div class="fr-col">
            <h2 id="titre-ressources-partagees" class="fr-h4 fr-mb-0">
              Ressources partagées avec moi
              <span class="fr-badge fr-badge--blue-cumulus fr-ml-1w">{{ ressourcesPartageesFilrees.length }}</span>
            </h2>
          </div>
        </div>

        <div v-if="ressourcesPartageesFilrees.length === 0" class="fr-alert fr-alert--info">
          <h3 class="fr-alert__title">Aucune ressource partagée</h3>
          <p>
            Aucune ressource ne vous a encore été partagée, ou aucune ne correspond aux filtres.
          </p>
        </div>

        <div v-else class="fr-grid-row fr-grid-row--gutters">
          <div
            v-for="ressource in ressourcesPartageesFilrees"
            :key="ressource.idRessource"
            class="fr-col-12 fr-col-md-6 fr-col-lg-4"
          >
            <div class="fr-card rr-resource-card rr-resource-card--shared">
              <div class="fr-card__body">
                <div class="fr-card__content">
                  <!-- Icône + Type -->
                  <div class="rr-card-type fr-mb-1w">
                    <span :class="[iconType(ressource.typeRessource), 'fr-mr-1w']" aria-hidden="true"></span>
                    <span class="fr-text--sm fr-text--grey">{{ labelType(ressource.typeRessource) }}</span>
                    <button
                      type="button"
                      class="fr-btn--icon-only fr-icon-star-line rr-favori-btn"
                      :class="{ 'fr-icon-star-fill rr-favori-btn--active': ressource.estFavori }"
                      :aria-label="ressource.estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'"
                    ></button>
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

                  <!-- Tags -->
                  <div class="fr-tags-group fr-mb-2w">
                    <p class="fr-tag fr-tag--sm">{{ labelType(ressource.typeRessource) }}</p>
                  </div>

                  <!-- Auteur -->
                  <div class="rr-card-meta fr-text--sm fr-text--grey fr-mb-1v">
                    <span class="fr-icon-user-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    Partagé par {{ ressource.auteur || 'un utilisateur' }}
                  </div>
                  <div class="rr-card-meta fr-text--sm fr-text--grey">
                    <span class="fr-icon-calendar-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    Le {{ formatDate(ressource.dateCreation) }}
                  </div>
                </div>
              </div>

              <!-- Actions -->
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
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-share-line"
                    >
                      Partager
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Modal confirmation suppression -->
    <dialog
      v-if="showDeleteModal"
      class="fr-modal fr-modal--opened"
      id="modal-suppression"
      aria-labelledby="modal-suppression-titre"
      role="dialog"
    >
      <div class="fr-container fr-container--fluid fr-container-md">
        <div class="fr-grid-row fr-grid-row--center">
          <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div class="fr-modal__body">
              <div class="fr-modal__header">
                <button
                  type="button"
                  class="fr-btn--close fr-btn"
                  :aria-controls="'modal-suppression'"
                  @click="annulerSuppression"
                >
                  Fermer
                </button>
              </div>
              <div class="fr-modal__content">
                <h1 id="modal-suppression-titre" class="fr-modal__title">
                  <span class="fr-icon-warning-line fr-mr-1w" aria-hidden="true"></span>
                  Supprimer la ressource
                </h1>
                <p>
                  Êtes-vous sûr de vouloir supprimer
                  <strong>« {{ ressourceASupprimer?.titre }} »</strong> ?
                  Cette action est irréversible.
                </p>
              </div>
              <div class="fr-modal__footer">
                <ul class="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--error fr-btn--icon-left fr-icon-delete-line"
                      :aria-busy="isDeleting ? 'true' : 'false'"
                      @click="confirmerSuppression"
                    >
                      {{ isDeleting ? 'Suppression…' : 'Confirmer la suppression' }}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--secondary"
                      @click="annulerSuppression"
                    >
                      Annuler
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Overlay modal -->
    <div v-if="showDeleteModal" class="fr-modal__overlay" @click="annulerSuppression"></div>
  </main>
</template>

<style scoped>
/* En-tête de page */
.rr-page-header {
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.5rem;
}

/* Bloc filtres */
.rr-filter-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

/* Cards ressources */
.rr-resource-card {
  height: 100%;
  border: 1px solid var(--border-default-grey);
  transition: box-shadow 0.2s ease;
}

.rr-resource-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 18, 0.12);
}

.rr-resource-card--shared {
  border-left: 4px solid var(--blue-france-sun-113-625);
}

/* Type de ressource en haut de card */
.rr-card-type {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Favori bouton */
.rr-favori-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-mention-grey);
  font-size: 1.1rem;
}

.rr-favori-btn--active {
  color: #f5a623;
}

/* Description tronquée */
.rr-card-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-mention-grey);
}

/* Métadonnées */
.rr-card-meta {
  display: flex;
  align-items: center;
}

/* Footer card */
.rr-card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-default-grey);
}

/* Bouton supprimer */
.rr-btn-delete {
  color: var(--error-425-625) !important;
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

/* Modal overlay */
.fr-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 18, 0.48);
  z-index: 1999;
}

.fr-modal--opened {
  display: flex;
  position: fixed;
  inset: 0;
  z-index: 2000;
  align-items: center;
  justify-content: center;
}
</style>