<script setup lang="ts">
definePageMeta({
  middleware: 'moderateur',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const _auth = useAuth() as any
const authToken = computed<string | null>(
  () => (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)
const authHeaders = computed(() =>
  authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StatutSignalement = 'EN_ATTENTE' | 'TRAITE' | 'IGNORE'
type TypeSignalement = 'RESSOURCE' | 'COMMENTAIRE'

interface Signalement {
  idSignalement: number
  typeSignalement: TypeSignalement
  idRessource?: number
  idCommentaire?: number
  motif: string
  statut: StatutSignalement
  actionPrise?: string
  dateCreation: string
  dateTraitement?: string
  utilisateur?: { idUtilisateur: number; prenom?: string; nom?: string; email?: string }
}

interface RessourceAValider {
  idRessource: number
  titre: string
  description?: string
  typeRessource: string
  statut: string
  motifRejet?: string
  dateCreation: string
  utilisateur?: { prenom?: string; nom?: string }
  categorie?: { nom: string }
}

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------
const onglet = ref<'signalements' | 'ressources'>('signalements')

// ---------------------------------------------------------------------------
// Signalements
// ---------------------------------------------------------------------------
const isLoadingSignalements = ref(true)
const signalements = ref<Signalement[]>([])
const filtreStatut = ref<'' | StatutSignalement>('')
const filtreType = ref<'' | TypeSignalement>('')

const signalementsFiltres = computed(() =>
  signalements.value.filter((s) => {
    if (filtreStatut.value && s.statut !== filtreStatut.value) return false
    if (filtreType.value && s.typeSignalement !== filtreType.value) return false
    return true
  }),
)

const nbEnAttente = computed(
  () => signalements.value.filter((s) => s.statut === 'EN_ATTENTE').length,
)

async function fetchSignalements() {
  try {
    signalements.value = await $fetch<Signalement[]>('/signalements', {
      baseURL: apiBase,
      headers: authHeaders.value,
    })
  } catch {
    signalements.value = []
  } finally {
    isLoadingSignalements.value = false
  }
}

// ---------------------------------------------------------------------------
// Ressources à valider
// ---------------------------------------------------------------------------
const isLoadingRessources = ref(false)
const ressourcesAValider = ref<RessourceAValider[]>([])
const filtreStatutRessource = ref('')

const ressourcesFiltrees = computed(() =>
  ressourcesAValider.value.filter((r) =>
    filtreStatutRessource.value ? r.statut === filtreStatutRessource.value : true,
  ),
)

const nbRessourcesEnAttente = computed(
  () => ressourcesAValider.value.filter((r) => r.statut === 'EN_ATTENTE').length,
)

async function fetchRessourcesModeration() {
  isLoadingRessources.value = true
  try {
    ressourcesAValider.value = await $fetch<RessourceAValider[]>('/ressources/moderation', {
      baseURL: apiBase,
      headers: authHeaders.value,
    })
  } catch {
    ressourcesAValider.value = []
  } finally {
    isLoadingRessources.value = false
  }
}

// ---------------------------------------------------------------------------
// Actions sur ressource
// ---------------------------------------------------------------------------
const actionEnCours = ref<number | null>(null)
const motifRejetMap = ref<Record<number, string>>({})

async function validerRessource(id: number) {
  actionEnCours.value = id
  try {
    await $fetch(`/ressources/${id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authHeaders.value,
      body: { statut: 'VALIDEE' },
    })
    const r = ressourcesAValider.value.find((x) => x.idRessource === id)
    if (r) r.statut = 'VALIDEE'
  } finally {
    actionEnCours.value = null
  }
}

async function rejeterRessource(id: number) {
  const motif = motifRejetMap.value[id]?.trim()
  if (!motif) {
    alert('Veuillez saisir un motif de rejet.')
    return
  }
  actionEnCours.value = id
  try {
    await $fetch(`/ressources/${id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authHeaders.value,
      body: { statut: 'REJETEE', motifRejet: motif },
    })
    const r = ressourcesAValider.value.find((x) => x.idRessource === id)
    if (r) { r.statut = 'REJETEE'; r.motifRejet = motif }
  } finally {
    actionEnCours.value = null
  }
}

async function supprimerRessource(id: number) {
  if (!confirm('Supprimer cette ressource définitivement ?')) return
  actionEnCours.value = id
  try {
    await $fetch(`/ressources/${id}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: authHeaders.value,
    })
    ressourcesAValider.value = ressourcesAValider.value.filter((r) => r.idRessource !== id)
  } finally {
    actionEnCours.value = null
  }
}

// ---------------------------------------------------------------------------
// Watch onglet
// ---------------------------------------------------------------------------
watch(onglet, (val) => {
  if (val === 'ressources') fetchRessourcesModeration()
})

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
onMounted(() => {
  fetchSignalements()
  fetchRessourcesModeration()
})

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function nomUtilisateur(u: any) {
  if (!u) return 'Inconnu'
  return `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || u.email || 'Inconnu'
}

function badgeStatut(statut: string) {
  const map: Record<string, string> = {
    EN_ATTENTE: 'fr-badge--warning',
    TRAITE: 'fr-badge--success',
    IGNORE: 'fr-badge--info',
    VALIDEE: 'fr-badge--success',
    REJETEE: 'fr-badge--error',
    BROUILLON: 'fr-badge--blue-cumulus',
  }
  return map[statut] ?? ''
}

function labelStatut(statut: string) {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    TRAITE: 'Traité',
    IGNORE: 'Ignoré',
    VALIDEE: 'Validée',
    REJETEE: 'Rejetée',
    BROUILLON: 'Brouillon',
  }
  return map[statut] ?? statut
}

function labelType(type: string) {
  return type === 'COMMENTAIRE' ? 'Commentaire' : 'Ressource'
}

function labelTypeRessource(type: string) {
  const map: Record<string, string> = {
    ARTICLE: 'Article', VIDEO: 'Vidéo', AUDIO: 'Audio',
    EXERCICE: 'Exercice', ACTIVITE: 'Activité', JEU: 'Jeu',
  }
  return map[type] ?? type
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">

    <!-- Fil d'Ariane -->
    <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
      <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-modo">
        Voir le fil d'Ariane
      </button>
      <div class="fr-collapse" id="breadcrumb-modo">
        <ol class="fr-breadcrumb__list">
          <li><NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink></li>
          <li><a class="fr-breadcrumb__link" aria-current="page">Modération</a></li>
        </ol>
      </div>
    </nav>

    <!-- En-tête -->
    <div class="rr-mod-header fr-mb-5w">
      <div>
        <h1 class="fr-h3 fr-mb-1w">
          <span class="fr-icon-shield-line fr-mr-1w" aria-hidden="true"></span>
          Interface de modération
        </h1>
        <p class="fr-text--sm fr-text--grey fr-mb-0">
          Gérez les signalements et validez les ressources soumises.
        </p>
      </div>
      <div class="fr-badges-group">
        <p v-if="nbEnAttente > 0" class="fr-badge fr-badge--warning fr-badge--sm">
          {{ nbEnAttente }} signalement{{ nbEnAttente > 1 ? 's' : '' }} en attente
        </p>
        <p v-if="nbRessourcesEnAttente > 0" class="fr-badge fr-badge--warning fr-badge--sm">
          {{ nbRessourcesEnAttente }} ressource{{ nbRessourcesEnAttente > 1 ? 's' : '' }} à valider
        </p>
      </div>
    </div>

    <!-- Onglets -->
    <div class="fr-tabs rr-tabs fr-mb-5w">
      <ul class="fr-tabs__list" role="tablist" aria-label="Sections de modération">

        <li role="presentation">
          <button
            id="tab-signalements"
            class="fr-tabs__tab"
            :class="{ 'fr-tabs__tab--active': onglet === 'signalements' }"
            role="tab"
            :aria-selected="onglet === 'signalements'"
            aria-controls="panel-signalements"
            @click="onglet = 'signalements'"
          >
            <span class="fr-icon-alert-line fr-mr-1v" aria-hidden="true"></span>
            Signalements
            <span v-if="nbEnAttente > 0" class="rr-tab-badge">{{ nbEnAttente }}</span>
          </button>
        </li>

        <li role="presentation">
          <button
            id="tab-ressources"
            class="fr-tabs__tab"
            :class="{ 'fr-tabs__tab--active': onglet === 'ressources' }"
            role="tab"
            :aria-selected="onglet === 'ressources'"
            aria-controls="panel-ressources"
            @click="onglet = 'ressources'"
          >
            <span class="fr-icon-file-line fr-mr-1v" aria-hidden="true"></span>
            Ressources à valider
            <span v-if="nbRessourcesEnAttente > 0" class="rr-tab-badge">{{ nbRessourcesEnAttente }}</span>
          </button>
        </li>

      </ul>

      <!-- =====================================================================
           Panel Signalements
           ===================================================================== -->
      <div
        id="panel-signalements"
        class="fr-tabs__panel"
        :class="{ 'fr-tabs__panel--selected': onglet === 'signalements' }"
        role="tabpanel"
        aria-labelledby="tab-signalements"
      >
        <div v-if="isLoadingSignalements" class="fr-grid-row fr-grid-row--center fr-py-6w">
          <div class="fr-col-auto rr-loader" role="status">
            <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span class="fr-ml-1w fr-text--grey">Chargement…</span>
          </div>
        </div>

        <template v-else>
          <!-- Filtres -->
          <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
            <div class="fr-col-12 fr-col-md-4">
              <div class="fr-select-group fr-mb-0">
                <label class="fr-label fr-text--sm" for="filtre-statut">Statut</label>
                <select id="filtre-statut" v-model="filtreStatut" class="fr-select">
                  <option value="">Tous</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="TRAITE">Traité</option>
                  <option value="IGNORE">Ignoré</option>
                </select>
              </div>
            </div>
            <div class="fr-col-12 fr-col-md-4">
              <div class="fr-select-group fr-mb-0">
                <label class="fr-label fr-text--sm" for="filtre-type">Type</label>
                <select id="filtre-type" v-model="filtreType" class="fr-select">
                  <option value="">Tous</option>
                  <option value="RESSOURCE">Ressource</option>
                  <option value="COMMENTAIRE">Commentaire</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Vide -->
          <div v-if="signalementsFiltres.length === 0" class="fr-alert fr-alert--info">
            <h2 class="fr-alert__title">Aucun signalement</h2>
            <p>Aucun signalement ne correspond aux filtres sélectionnés.</p>
          </div>

          <!-- Tableau -->
          <div v-else class="fr-table fr-table--bordered">
            <table>
              <caption class="fr-sr-only">Liste des signalements</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Motif</th>
                  <th scope="col">Signalé par</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in signalementsFiltres" :key="s.idSignalement">
                  <td>{{ formatDate(s.dateCreation) }}</td>
                  <td>
                    <span
                      :class="s.typeSignalement === 'COMMENTAIRE' ? 'fr-icon-chat-3-line' : 'fr-icon-file-line'"
                      class="fr-icon--sm fr-mr-1v"
                      aria-hidden="true"
                    ></span>
                    {{ labelType(s.typeSignalement) }}
                  </td>
                  <td class="rr-motif-cell">{{ s.motif }}</td>
                  <td>{{ nomUtilisateur(s.utilisateur) }}</td>
                  <td>
                    <p :class="['fr-badge fr-badge--sm', badgeStatut(s.statut)]">
                      {{ labelStatut(s.statut) }}
                    </p>
                  </td>
                  <td>
                    <NuxtLink
                      :to="`/moderateur/${s.idSignalement}`"
                      class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                    >
                      Consulter
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>

      <!-- =====================================================================
           Panel Ressources à valider
           ===================================================================== -->
      <div
        id="panel-ressources"
        class="fr-tabs__panel"
        :class="{ 'fr-tabs__panel--selected': onglet === 'ressources' }"
        role="tabpanel"
        aria-labelledby="tab-ressources"
      >
        <div v-if="isLoadingRessources" class="fr-grid-row fr-grid-row--center fr-py-6w">
          <div class="fr-col-auto rr-loader" role="status">
            <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span class="fr-ml-1w fr-text--grey">Chargement…</span>
          </div>
        </div>

        <template v-else>
          <!-- Filtre statut -->
          <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">
            <div class="fr-col-12 fr-col-md-4">
              <div class="fr-select-group fr-mb-0">
                <label class="fr-label fr-text--sm" for="filtre-statut-ressource">Statut</label>
                <select id="filtre-statut-ressource" v-model="filtreStatutRessource" class="fr-select">
                  <option value="">Tous</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="REJETEE">Rejetée</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="ressourcesFiltrees.length === 0" class="fr-alert fr-alert--info">
            <h2 class="fr-alert__title">Aucune ressource</h2>
            <p>Aucune ressource ne correspond aux filtres sélectionnés.</p>
          </div>

          <!-- Cartes ressources -->
          <div v-else class="fr-grid-row fr-grid-row--gutters">
            <div
              v-for="r in ressourcesFiltrees"
              :key="r.idRessource"
              class="fr-col-12 fr-col-md-6 fr-col-lg-4"
            >
              <div class="fr-card rr-resource-card">
                <div class="fr-card__body">
                  <div class="fr-card__content">

                    <!-- Statut + type -->
                    <div class="fr-grid-row fr-grid-row--gutters fr-mb-1w">
                      <div class="fr-col-auto">
                        <p :class="['fr-badge fr-badge--sm', badgeStatut(r.statut)]">
                          {{ labelStatut(r.statut) }}
                        </p>
                      </div>
                      <div class="fr-col-auto">
                        <p class="fr-badge fr-badge--sm fr-badge--blue-cumulus">
                          {{ labelTypeRessource(r.typeRessource) }}
                        </p>
                      </div>
                    </div>

                    <!-- Titre -->
                    <h3 class="fr-card__title fr-mb-1w fr-h6">{{ r.titre }}</h3>

                    <!-- Description -->
                    <p v-if="r.description" class="fr-text--sm fr-text--grey rr-card-desc fr-mb-2w">
                      {{ r.description }}
                    </p>

                    <!-- Meta -->
                    <p class="fr-text--sm fr-text--grey fr-mb-1v">
                      <span class="fr-icon-user-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                      {{ nomUtilisateur(r.utilisateur) }}
                    </p>
                    <p class="fr-text--sm fr-text--grey fr-mb-2w">
                      <span class="fr-icon-calendar-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                      {{ formatDate(r.dateCreation) }}
                    </p>

                    <!-- Motif rejet (si rejetée) -->
                    <div v-if="r.statut === 'REJETEE' && r.motifRejet" class="fr-alert fr-alert--error fr-alert--sm fr-mb-2w">
                      <p>Motif : {{ r.motifRejet }}</p>
                    </div>

                    <!-- Motif rejet (saisie pour rejeter) -->
                    <div v-if="r.statut !== 'REJETEE' && r.statut !== 'VALIDEE'" class="fr-input-group fr-mb-2w">
                      <label :for="`motif-${r.idRessource}`" class="fr-label fr-text--sm">
                        Motif de rejet <span class="fr-text--grey">(requis si rejet)</span>
                      </label>
                      <input
                        :id="`motif-${r.idRessource}`"
                        v-model="motifRejetMap[r.idRessource]"
                        type="text"
                        class="fr-input"
                        placeholder="Ex : contenu inapproprié"
                      />
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="fr-card__footer rr-card-footer">
                    <ul class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
                      <li>
                        <NuxtLink
                          :to="`/ressources/${r.idRessource}?from=moderateur`"
                          class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                        >
                          Voir
                        </NuxtLink>
                      </li>
                      <li v-if="r.statut !== 'VALIDEE'">
                        <button
                          type="button"
                          class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-check-line"
                          :disabled="actionEnCours === r.idRessource"
                          @click="validerRessource(r.idRessource)"
                        >
                          Valider
                        </button>
                      </li>
                      <li v-if="r.statut !== 'REJETEE'">
                        <button
                          type="button"
                          class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-close-line"
                          :disabled="actionEnCours === r.idRessource"
                          @click="rejeterRessource(r.idRessource)"
                        >
                          Rejeter
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line"
                          :disabled="actionEnCours === r.idRessource"
                          @click="supprimerRessource(r.idRessource)"
                        >
                          Supprimer
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </main>
</template>

<style scoped>
.rr-mod-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.5rem;
}

.fr-badges-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.rr-tabs .fr-tabs__list {
  border-bottom: 2px solid var(--border-default-grey);
}

.rr-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--background-flat-warning);
  color: var(--text-inverted-warning);
  border-radius: 50%;
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  margin-left: 0.375rem;
}

.rr-motif-cell {
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rr-resource-card {
  height: 100%;
  border: 1px solid var(--border-default-grey);
  transition: box-shadow 0.2s ease;
}

.rr-card-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rr-card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-default-grey);
}

.rr-loader {
  display: flex;
  align-items: center;
}

.rr-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
