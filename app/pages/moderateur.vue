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

// ---------------------------------------------------------------------------
// Types (issus du MCD)
// ---------------------------------------------------------------------------
interface Signalement {
  idSignalement: number
  idUtilisateur: number
  nomUtilisateur: string
  typeSignalement: 'ressource' | 'commentaire'
  idRessource?: number
  titreRessource?: string
  idCommentaire?: number
  contenuCommentaire?: string
  motif: string
  dateCreation: string
  statut: 'en_attente' | 'traite' | 'ignore'
  idModerateur?: number
  actionPrise?: string
  dateTraitement?: string
}

interface Commentaire {
  idCommentaire: number
  idUtilisateur: number
  nomUtilisateur: string
  idRessource: number
  titreRessource: string
  contenu: string
  dateCreation: string
  dateModification?: string
  statut: 'visible' | 'masque' | 'supprime'
  nbSignalements: number
}

interface Ressource {
  idRessource: number
  idUtilisateur: number
  nomAuteur: string
  titre: string
  description?: string
  typeRessource: string
  typeRelation?: string
  niveauDifficulte?: string
  visibilite: string
  dateCreation: string
  statut: 'brouillon' | 'en_attente' | 'valide' | 'rejetee'
  motifRejet?: string
  nbVues: number
}

interface StatsModeration {
  signalementsEnAttente: number
  commentairesSignales: number
  ressourcesEnAttente: number
  traitementsAujourdhui: number
}

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------
const ongletActif = ref<'apercu' | 'signalements' | 'commentaires' | 'ressources'>('apercu')

function setOnglet(o: typeof ongletActif.value) {
  ongletActif.value = o
}

// ---------------------------------------------------------------------------
// État global
// ---------------------------------------------------------------------------
const isLoading = ref(true)
const stats = ref<StatsModeration>({
  signalementsEnAttente: 0,
  commentairesSignales: 0,
  ressourcesEnAttente: 0,
  traitementsAujourdhui: 0,
})

// ---------------------------------------------------------------------------
// Signalements
// ---------------------------------------------------------------------------
const signalements = ref<Signalement[]>([])
const isLoadingSignalements = ref(false)
const filtreStatutSignalement = ref<'' | 'en_attente' | 'traite' | 'ignore'>('')
const filtreTypeSignalement = ref<'' | 'ressource' | 'commentaire'>('')

const signalementModal = ref<Signalement | null>(null)
const actionSignalement = ref('')
const isTraitant = ref(false)

const signalementsFiltres = computed(() => {
  return signalements.value.filter((s) => {
    if (filtreStatutSignalement.value && s.statut !== filtreStatutSignalement.value) return false
    if (filtreTypeSignalement.value && s.typeSignalement !== filtreTypeSignalement.value) return false
    return true
  })
})

async function fetchSignalements() {
  isLoadingSignalements.value = true
  try {
    const data = await $fetch<Signalement[]>('/signalements', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    signalements.value = data
    stats.value.signalementsEnAttente = data.filter((s) => s.statut === 'en_attente').length
  } catch {
    signalements.value = []
  } finally {
    isLoadingSignalements.value = false
  }
}

async function traiterSignalement(statut: 'traite' | 'ignore') {
  if (!signalementModal.value) return

  isTraitant.value = true
  try {
    await $fetch(`/signalements/${signalementModal.value.idSignalement}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        statut,
        actionPrise: actionSignalement.value.trim() || undefined,
        idModerateur: userId.value,
      },
    })
    const idx = signalements.value.findIndex((s) => s.idSignalement === signalementModal.value!.idSignalement)
    const signal = idx !== -1 ? signalements.value[idx] : undefined
    if (signal) {
      signal.statut = statut
      signal.actionPrise = actionSignalement.value.trim()
      signal.dateTraitement = new Date().toISOString()
    }
    stats.value.signalementsEnAttente = signalements.value.filter((s) => s.statut === 'en_attente').length
    fermerModalSignalement()
  } catch {
    //
  } finally {
    isTraitant.value = false
  }
}

function ouvrirModalSignalement(s: Signalement) {
  signalementModal.value = s
  actionSignalement.value = s.actionPrise ?? ''
}

function fermerModalSignalement() {
  signalementModal.value = null
  actionSignalement.value = ''
}

// ---------------------------------------------------------------------------
// Commentaires
// ---------------------------------------------------------------------------
const commentaires = ref<Commentaire[]>([])
const isLoadingCommentaires = ref(false)
const filtreStatutCommentaire = ref<'' | 'visible' | 'masque' | 'supprime'>('')
const rechercheCommentaire = ref('')

const nouveauCommentaire = ref('')
const idRessourceComment = ref('')
const isAjoutantCommentaire = ref(false)
const successCommentaire = ref('')
const erreurCommentaire = ref('')

const commentairesFiltres = computed(() => {
  return commentaires.value.filter((c) => {
    if (filtreStatutCommentaire.value && c.statut !== filtreStatutCommentaire.value) return false
    if (rechercheCommentaire.value.trim()) {
      const q = rechercheCommentaire.value.toLowerCase()
      if (!c.contenu.toLowerCase().includes(q) && !c.nomUtilisateur.toLowerCase().includes(q)) return false
    }
    return true
  })
})

async function fetchCommentaires() {
  isLoadingCommentaires.value = true
  try {
    const data = await $fetch<Commentaire[]>('/commentaires/moderation', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    commentaires.value = data
    stats.value.commentairesSignales = data.filter((c) => c.nbSignalements > 0).length
  } catch {
    commentaires.value = []
  } finally {
    isLoadingCommentaires.value = false
  }
}

async function changerStatutCommentaire(idCommentaire: number, statut: 'visible' | 'masque' | 'supprime') {
  try {
    await $fetch(`/commentaires/${idCommentaire}/statut`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: { statut },
    })
    const idx = commentaires.value.findIndex((c) => c.idCommentaire === idCommentaire)
    const item = idx !== -1 ? commentaires.value[idx] : undefined
    if (item) item.statut = statut
  } catch {
    //
  }
}

async function ajouterCommentaire() {
  if (!nouveauCommentaire.value.trim() || !idRessourceComment.value) return
  isAjoutantCommentaire.value = true
  erreurCommentaire.value = ''
  successCommentaire.value = ''
  try {
    await $fetch('/commentaires', {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idUtilisateur: userId.value,
        idRessource: Number(idRessourceComment.value),
        contenu: nouveauCommentaire.value.trim(),
      },
    })
    successCommentaire.value = 'Commentaire ajouté avec succès.'
    nouveauCommentaire.value = ''
    idRessourceComment.value = ''
    await fetchCommentaires()
  } catch {
    erreurCommentaire.value = "L'ajout du commentaire a échoué. Veuillez réessayer."
  } finally {
    isAjoutantCommentaire.value = false
  }
}

// ---------------------------------------------------------------------------
// Ressources
// ---------------------------------------------------------------------------
const ressources = ref<Ressource[]>([])
const isLoadingRessources = ref(false)
const filtreStatutRessource = ref<'' | 'en_attente' | 'valide' | 'rejetee'>('')
const rechercheRessource = ref('')

const ressourceModal = ref<Ressource | null>(null)
const motifRejet = ref('')
const isValidating = ref(false)

const ressourcesFiltrees = computed(() => {
  return ressources.value.filter((r) => {
    if (filtreStatutRessource.value && r.statut !== filtreStatutRessource.value) return false
    if (rechercheRessource.value.trim()) {
      const q = rechercheRessource.value.toLowerCase()
      if (!r.titre.toLowerCase().includes(q) && !r.nomAuteur.toLowerCase().includes(q)) return false
    }
    return true
  })
})

async function fetchRessources() {
  isLoadingRessources.value = true
  try {
    const data = await $fetch<Ressource[]>('/ressources/moderation', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    ressources.value = data
    stats.value.ressourcesEnAttente = data.filter((r) => r.statut === 'en_attente').length
  } catch {
    ressources.value = []
  } finally {
    isLoadingRessources.value = false
  }
}

async function changerStatutRessource(idRessource: number, statut: 'valide' | 'rejetee') {
  isValidating.value = true
  try {
    await $fetch(`/ressources/${idRessource}/statut`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        statut,
        motifRejet: statut === 'rejetee' ? motifRejet.value.trim() : undefined,
      },
    })
    const idx = ressources.value.findIndex((r) => r.idRessource === idRessource)
    const res = idx !== -1 ? ressources.value[idx] : undefined
    if (res) {
      res.statut = statut
      if (statut === 'rejetee') res.motifRejet = motifRejet.value.trim()
    }
    stats.value.ressourcesEnAttente = ressources.value.filter((r) => r.statut === 'en_attente').length
    fermerModalRessource()
  } catch {
    //
  } finally {
    isValidating.value = false
  }
}

function ouvrirModalRessource(r: Ressource) {
  ressourceModal.value = r
  motifRejet.value = r.motifRejet ?? ''
}

function fermerModalRessource() {
  ressourceModal.value = null
  motifRejet.value = ''
}

// ---------------------------------------------------------------------------
// Chargement initial
// ---------------------------------------------------------------------------
onMounted(async () => {
  await Promise.allSettled([
    fetchSignalements(),
    fetchCommentaires(),
    fetchRessources(),
  ])
  stats.value.traitementsAujourdhui = signalements.value.filter((s) => {
    if (!s.dateTraitement) return false
    return new Date(s.dateTraitement).toDateString() === new Date().toDateString()
  }).length
  isLoading.value = false
})

// Chargement à la demande selon l'onglet
watch(ongletActif, (val) => {
  if (val === 'signalements' && signalements.value.length === 0) fetchSignalements()
  if (val === 'commentaires' && commentaires.value.length === 0) fetchCommentaires()
  if (val === 'ressources' && ressources.value.length === 0) fetchRessources()
})

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function badgeStatutSignalement(statut: string) {
  const map: Record<string, string> = {
    en_attente: 'fr-badge--warning',
    traite: 'fr-badge--success',
    ignore: 'fr-badge--info',
  }
  return map[statut] ?? ''
}

function labelStatutSignalement(statut: string) {
  const map: Record<string, string> = { en_attente: 'En attente', traite: 'Traité', ignore: 'Ignoré' }
  return map[statut] ?? statut
}

function badgeStatutCommentaire(statut: string) {
  const map: Record<string, string> = {
    visible: 'fr-badge--success',
    masque: 'fr-badge--warning',
    supprime: 'fr-badge--error',
  }
  return map[statut] ?? ''
}

function labelStatutCommentaire(statut: string) {
  const map: Record<string, string> = { visible: 'Visible', masque: 'Masqué', supprime: 'Supprimé' }
  return map[statut] ?? statut
}

function badgeStatutRessource(statut: string) {
  const map: Record<string, string> = {
    en_attente: 'fr-badge--warning',
    valide: 'fr-badge--success',
    rejetee: 'fr-badge--error',
    brouillon: 'fr-badge--blue-cumulus',
  }
  return map[statut] ?? ''
}

function labelStatutRessource(statut: string) {
  const map: Record<string, string> = {
    brouillon: 'Brouillon', en_attente: 'En attente', valide: 'Validée', rejetee: 'Rejetée',
  }
  return map[statut] ?? statut
}

function labelTypeRessource(type: string) {
  const map: Record<string, string> = {
    article: 'Article', video: 'Vidéo', audio: 'Audio',
    exercice: 'Exercice', activite: 'Activité', jeu: 'Jeu',
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
          Gérez les signalements, commentaires et ressources soumis à validation.
        </p>
      </div>
      <p class="fr-badge fr-badge--blue-cumulus fr-badge--sm rr-mod-badge-role">
        <span class="fr-icon-user-star-line fr-mr-1v" aria-hidden="true"></span>
        Modérateur
      </p>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto rr-loader">
        <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
        <span class="fr-ml-1w fr-text--grey">Chargement du tableau de bord…</span>
      </div>
    </div>

    <template v-else>

      <!-- ===========================================================
           Statistiques
           =========================================================== -->
      <div class="fr-grid-row fr-grid-row--gutters fr-mb-5w">
        <div class="fr-col-6 fr-col-md-3">
          <div class="rr-stat-card rr-stat-card--warning">
            <span class="fr-icon-alert-line rr-stat-card__icon" aria-hidden="true"></span>
            <p class="rr-stat-card__count">{{ stats.signalementsEnAttente }}</p>
            <p class="rr-stat-card__label">Signalement{{ stats.signalementsEnAttente > 1 ? 's' : '' }} en attente</p>
          </div>
        </div>
        <div class="fr-col-6 fr-col-md-3">
          <div class="rr-stat-card rr-stat-card--info">
            <span class="fr-icon-chat-3-line rr-stat-card__icon" aria-hidden="true"></span>
            <p class="rr-stat-card__count">{{ stats.commentairesSignales }}</p>
            <p class="rr-stat-card__label">Commentaire{{ stats.commentairesSignales > 1 ? 's' : '' }} signalé{{ stats.commentairesSignales > 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div class="fr-col-6 fr-col-md-3">
          <div class="rr-stat-card rr-stat-card--purple">
            <span class="fr-icon-file-line rr-stat-card__icon" aria-hidden="true"></span>
            <p class="rr-stat-card__count">{{ stats.ressourcesEnAttente }}</p>
            <p class="rr-stat-card__label">Ressource{{ stats.ressourcesEnAttente > 1 ? 's' : '' }} à valider</p>
          </div>
        </div>
        <div class="fr-col-6 fr-col-md-3">
          <div class="rr-stat-card rr-stat-card--success">
            <span class="fr-icon-check-line rr-stat-card__icon" aria-hidden="true"></span>
            <p class="rr-stat-card__count">{{ stats.traitementsAujourdhui }}</p>
            <p class="rr-stat-card__label">Traitement{{ stats.traitementsAujourdhui > 1 ? 's' : '' }} aujourd'hui</p>
          </div>
        </div>
      </div>

      <!-- ===========================================================
           Onglets
           =========================================================== -->
      <div class="fr-tabs rr-tabs fr-mb-5w">
        <ul class="fr-tabs__list" role="tablist" aria-label="Sections de modération">

          <li role="presentation">
            <button
              id="tab-apercu"
              class="fr-tabs__tab"
              :class="{ 'fr-tabs__tab--active': ongletActif === 'apercu' }"
              tabindex="0"
              role="tab"
              :aria-selected="ongletActif === 'apercu'"
              aria-controls="panel-apercu"
              @click="setOnglet('apercu')"
            >
              <span class="fr-icon-dashboard-3-line fr-mr-1v" aria-hidden="true"></span>
              Aperçu
            </button>
          </li>

          <li role="presentation">
            <button
              id="tab-signalements"
              class="fr-tabs__tab"
              :class="{ 'fr-tabs__tab--active': ongletActif === 'signalements' }"
              tabindex="-1"
              role="tab"
              :aria-selected="ongletActif === 'signalements'"
              aria-controls="panel-signalements"
              @click="setOnglet('signalements')"
            >
              <span class="fr-icon-alert-line fr-mr-1v" aria-hidden="true"></span>
              Signalements
              <span v-if="stats.signalementsEnAttente > 0" class="rr-tab-badge">
                {{ stats.signalementsEnAttente }}
              </span>
            </button>
          </li>

          <li role="presentation">
            <button
              id="tab-commentaires"
              class="fr-tabs__tab"
              :class="{ 'fr-tabs__tab--active': ongletActif === 'commentaires' }"
              tabindex="-1"
              role="tab"
              :aria-selected="ongletActif === 'commentaires'"
              aria-controls="panel-commentaires"
              @click="setOnglet('commentaires')"
            >
              <span class="fr-icon-chat-3-line fr-mr-1v" aria-hidden="true"></span>
              Commentaires
            </button>
          </li>

          <li role="presentation">
            <button
              id="tab-ressources"
              class="fr-tabs__tab"
              :class="{ 'fr-tabs__tab--active': ongletActif === 'ressources' }"
              tabindex="-1"
              role="tab"
              :aria-selected="ongletActif === 'ressources'"
              aria-controls="panel-ressources"
              @click="setOnglet('ressources')"
            >
              <span class="fr-icon-file-line fr-mr-1v" aria-hidden="true"></span>
              Ressources
              <span v-if="stats.ressourcesEnAttente > 0" class="rr-tab-badge">
                {{ stats.ressourcesEnAttente }}
              </span>
            </button>
          </li>
        </ul>

        <!-- =====================================================
             PANNEAU — Aperçu
             ===================================================== -->
        <div
          id="panel-apercu"
          class="fr-tabs__panel"
          :class="{ 'fr-tabs__panel--selected': ongletActif === 'apercu' }"
          role="tabpanel"
          aria-labelledby="tab-apercu"
        >
          <div class="fr-grid-row fr-grid-row--gutters">

            <!-- Derniers signalements -->
            <div class="fr-col-12 fr-col-md-6">
              <h2 class="fr-h5 fr-mb-2w">
                <span class="fr-icon-alert-line fr-mr-1v" aria-hidden="true"></span>
                Derniers signalements
              </h2>
              <div v-if="signalements.filter(s => s.statut === 'en_attente').length === 0" class="fr-alert fr-alert--success fr-alert--sm">
                <p>Aucun signalement en attente. 🎉</p>
              </div>
              <ul v-else class="rr-apercu-list">
                <li
                  v-for="s in signalements.filter(s => s.statut === 'en_attente').slice(0, 4)"
                  :key="s.idSignalement"
                  class="rr-apercu-item"
                >
                  <div class="rr-apercu-item__left">
                    <span
                      :class="s.typeSignalement === 'ressource' ? 'fr-icon-file-line' : 'fr-icon-chat-3-line'"
                      class="rr-apercu-item__icon"
                      aria-hidden="true"
                    ></span>
                    <div>
                      <p class="fr-text--sm fr-text--bold fr-mb-0">{{ s.motif }}</p>
                      <p class="fr-text--sm fr-text--grey fr-mb-0">Par {{ s.nomUtilisateur }} · {{ formatDate(s.dateCreation) }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="fr-btn fr-btn--tertiary fr-btn--sm"
                    @click="setOnglet('signalements'); ouvrirModalSignalement(s)"
                  >
                    Traiter
                  </button>
                </li>
              </ul>
              <button type="button" class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-mt-2w" @click="setOnglet('signalements')">
                Voir tous les signalements →
              </button>
            </div>

            <!-- Dernières ressources en attente -->
            <div class="fr-col-12 fr-col-md-6">
              <h2 class="fr-h5 fr-mb-2w">
                <span class="fr-icon-file-line fr-mr-1v" aria-hidden="true"></span>
                Ressources à valider
              </h2>
              <div v-if="ressources.filter(r => r.statut === 'en_attente').length === 0" class="fr-alert fr-alert--success fr-alert--sm">
                <p>Aucune ressource en attente. 🎉</p>
              </div>
              <ul v-else class="rr-apercu-list">
                <li
                  v-for="r in ressources.filter(r => r.statut === 'en_attente').slice(0, 4)"
                  :key="r.idRessource"
                  class="rr-apercu-item"
                >
                  <div class="rr-apercu-item__left">
                    <span class="fr-icon-file-line rr-apercu-item__icon" aria-hidden="true"></span>
                    <div>
                      <p class="fr-text--sm fr-text--bold fr-mb-0">{{ r.titre }}</p>
                      <p class="fr-text--sm fr-text--grey fr-mb-0">Par {{ r.nomAuteur }} · {{ labelTypeRessource(r.typeRessource) }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="fr-btn fr-btn--tertiary fr-btn--sm"
                    @click="setOnglet('ressources'); ouvrirModalRessource(r)"
                  >
                    Examiner
                  </button>
                </li>
              </ul>
              <button type="button" class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-mt-2w" @click="setOnglet('ressources')">
                Voir toutes les ressources →
              </button>
            </div>
          </div>
        </div>

        <!-- =====================================================
             PANNEAU — Signalements
             ===================================================== -->
        <div
          id="panel-signalements"
          class="fr-tabs__panel"
          :class="{ 'fr-tabs__panel--selected': ongletActif === 'signalements' }"
          role="tabpanel"
          aria-labelledby="tab-signalements"
        >
          <!-- Filtres -->
          <div class="rr-filter-row fr-mb-3w">
            <div class="fr-select-group fr-mb-0 rr-filter-select">
              <label class="fr-label fr-text--sm" for="filtre-statut-signal">Statut</label>
              <select id="filtre-statut-signal" v-model="filtreStatutSignalement" class="fr-select">
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="traite">Traité</option>
                <option value="ignore">Ignoré</option>
              </select>
            </div>
            <div class="fr-select-group fr-mb-0 rr-filter-select">
              <label class="fr-label fr-text--sm" for="filtre-type-signal">Type</label>
              <select id="filtre-type-signal" v-model="filtreTypeSignalement" class="fr-select">
                <option value="">Tous</option>
                <option value="ressource">Ressource</option>
                <option value="commentaire">Commentaire</option>
              </select>
            </div>
            <p class="fr-text--sm fr-text--grey fr-mb-0 rr-filter-count">
              {{ signalementsFiltres.length }} résultat{{ signalementsFiltres.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Loader -->
          <div v-if="isLoadingSignalements" class="rr-loader fr-py-4w">
            <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span class="fr-ml-1w">Chargement…</span>
          </div>

          <!-- Vide -->
          <div v-else-if="signalementsFiltres.length === 0" class="fr-alert fr-alert--info">
            <h3 class="fr-alert__title">Aucun signalement</h3>
            <p>Aucun signalement ne correspond aux filtres sélectionnés.</p>
          </div>

          <!-- Table -->
          <div v-else class="rr-table-wrapper">
            <table class="fr-table fr-table--sm fr-table--bordered rr-table">
              <caption class="fr-sr-only">Liste des signalements</caption>
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Contenu signalé</th>
                  <th scope="col">Motif</th>
                  <th scope="col">Signalé par</th>
                  <th scope="col">Date</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in signalementsFiltres" :key="s.idSignalement">
                  <td>
                    <span
                      class="fr-badge fr-badge--sm"
                      :class="s.typeSignalement === 'ressource' ? 'fr-badge--blue-cumulus' : 'fr-badge--purple-glycine'"
                    >
                      <span :class="s.typeSignalement === 'ressource' ? 'fr-icon-file-line' : 'fr-icon-chat-3-line'" class="fr-icon--xs fr-mr-1v" aria-hidden="true"></span>
                      {{ s.typeSignalement === 'ressource' ? 'Ressource' : 'Commentaire' }}
                    </span>
                  </td>
                  <td class="rr-td-truncate">
                    <span v-if="s.titreRessource" class="fr-text--sm fr-text--bold">{{ s.titreRessource }}</span>
                    <span v-else-if="s.contenuCommentaire" class="fr-text--sm rr-text-truncate">{{ s.contenuCommentaire }}</span>
                    <span v-else class="fr-text--sm fr-text--grey">—</span>
                  </td>
                  <td class="rr-td-truncate">
                    <span class="fr-text--sm">{{ s.motif }}</span>
                  </td>
                  <td><span class="fr-text--sm">{{ s.nomUtilisateur }}</span></td>
                  <td><span class="fr-text--sm">{{ formatDate(s.dateCreation) }}</span></td>
                  <td>
                    <p class="fr-badge fr-badge--sm" :class="badgeStatutSignalement(s.statut)">
                      {{ labelStatutSignalement(s.statut) }}
                    </p>
                  </td>
                  <td>
                    <div class="fr-btns-group fr-btns-group--inline fr-btns-group--sm">
                      <button
                        type="button"
                        class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                        @click="ouvrirModalSignalement(s)"
                      >
                        Traiter
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- =====================================================
             PANNEAU — Commentaires
             ===================================================== -->
        <div
          id="panel-commentaires"
          class="fr-tabs__panel"
          :class="{ 'fr-tabs__panel--selected': ongletActif === 'commentaires' }"
          role="tabpanel"
          aria-labelledby="tab-commentaires"
        >

          <!-- Ajouter un commentaire -->
          <div class="rr-section-block fr-mb-4w">
            <h2 class="fr-h5 fr-mb-3w">
              <span class="fr-icon-add-circle-line fr-mr-1v" aria-hidden="true"></span>
              Ajouter un commentaire
            </h2>
            <div class="fr-grid-row fr-grid-row--gutters">
              <div class="fr-col-12 fr-col-md-4">
                <div class="fr-input-group fr-mb-0">
                  <label class="fr-label" for="id-ressource-comment">
                    ID de la ressource
                    <span class="fr-hint-text">Identifiant de la ressource à commenter</span>
                  </label>
                  <input
                    id="id-ressource-comment"
                    v-model="idRessourceComment"
                    type="number"
                    class="fr-input"
                    placeholder="Ex : 42"
                    min="1"
                  />
                </div>
              </div>
              <div class="fr-col-12 fr-col-md-8">
                <div class="fr-input-group fr-mb-0">
                  <label class="fr-label" for="nouveau-commentaire">Contenu du commentaire</label>
                  <textarea
                    id="nouveau-commentaire"
                    v-model="nouveauCommentaire"
                    class="fr-input"
                    rows="3"
                    placeholder="Rédigez votre commentaire de modération…"
                  ></textarea>
                </div>
              </div>
            </div>
            <div v-if="erreurCommentaire" class="fr-alert fr-alert--error fr-alert--sm fr-mt-2w">
              <p>{{ erreurCommentaire }}</p>
            </div>
            <div v-if="successCommentaire" class="fr-alert fr-alert--success fr-alert--sm fr-mt-2w">
              <p>{{ successCommentaire }}</p>
            </div>
            <div class="fr-mt-2w">
              <button
                type="button"
                class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-send-plane-line"
                :disabled="!nouveauCommentaire.trim() || !idRessourceComment || isAjoutantCommentaire"
                :aria-busy="isAjoutantCommentaire ? 'true' : 'false'"
                @click="ajouterCommentaire"
              >
                {{ isAjoutantCommentaire ? 'Envoi…' : 'Publier le commentaire' }}
              </button>
            </div>
          </div>

          <!-- Contrôle des commentaires -->
          <h2 class="fr-h5 fr-mb-2w">
            <span class="fr-icon-chat-3-line fr-mr-1v" aria-hidden="true"></span>
            Contrôle des commentaires
          </h2>

          <!-- Filtres -->
          <div class="rr-filter-row fr-mb-3w">
            <div class="fr-search-bar fr-search-bar--sm rr-filter-search">
              <label class="fr-label" for="search-comment"><span class="fr-sr-only">Rechercher</span></label>
              <input id="search-comment" v-model="rechercheCommentaire" class="fr-input" type="search" placeholder="Rechercher par contenu ou auteur…" />
              <button class="fr-btn fr-btn--sm" type="button"><span class="fr-sr-only">Rechercher</span></button>
            </div>
            <div class="fr-select-group fr-mb-0 rr-filter-select">
              <label class="fr-label fr-text--sm" for="filtre-statut-comment">Statut</label>
              <select id="filtre-statut-comment" v-model="filtreStatutCommentaire" class="fr-select">
                <option value="">Tous</option>
                <option value="visible">Visible</option>
                <option value="masque">Masqué</option>
                <option value="supprime">Supprimé</option>
              </select>
            </div>
            <p class="fr-text--sm fr-text--grey fr-mb-0 rr-filter-count">
              {{ commentairesFiltres.length }} résultat{{ commentairesFiltres.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Loader -->
          <div v-if="isLoadingCommentaires" class="rr-loader fr-py-4w">
            <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span class="fr-ml-1w">Chargement…</span>
          </div>

          <!-- Vide -->
          <div v-else-if="commentairesFiltres.length === 0" class="fr-alert fr-alert--info">
            <h3 class="fr-alert__title">Aucun commentaire</h3>
            <p>Aucun commentaire ne correspond aux filtres sélectionnés.</p>
          </div>

          <!-- Liste commentaires -->
          <ul v-else class="rr-comment-list">
            <li
              v-for="c in commentairesFiltres"
              :key="c.idCommentaire"
              class="rr-comment-item"
              :class="{ 'rr-comment-item--signale': c.nbSignalements > 0 }"
            >
              <div class="rr-comment-item__header">
                <div class="rr-comment-item__meta">
                  <span class="fr-text--bold fr-text--sm">{{ c.nomUtilisateur }}</span>
                  <span class="fr-text--sm fr-text--grey fr-mx-1w">·</span>
                  <NuxtLink :to="`/ressources/${c.idRessource}`" class="fr-text--sm fr-link">
                    {{ c.titreRessource }}
                  </NuxtLink>
                  <span class="fr-text--sm fr-text--grey fr-mx-1w">·</span>
                  <span class="fr-text--sm fr-text--grey">{{ formatDate(c.dateCreation) }}</span>
                </div>
                <div class="rr-comment-item__badges">
                  <p class="fr-badge fr-badge--sm" :class="badgeStatutCommentaire(c.statut)">
                    {{ labelStatutCommentaire(c.statut) }}
                  </p>
                  <p v-if="c.nbSignalements > 0" class="fr-badge fr-badge--sm fr-badge--error fr-ml-1w">
                    <span class="fr-icon-alert-line fr-icon--xs fr-mr-1v" aria-hidden="true"></span>
                    {{ c.nbSignalements }} signalement{{ c.nbSignalements > 1 ? 's' : '' }}
                  </p>
                </div>
              </div>

              <p class="fr-text--sm rr-comment-content fr-my-1w">{{ c.contenu }}</p>

              <div class="rr-comment-item__actions">
                <button
                  v-if="c.statut !== 'visible'"
                  type="button"
                  class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                  @click="changerStatutCommentaire(c.idCommentaire, 'visible')"
                >
                  Rendre visible
                </button>
                <button
                  v-if="c.statut !== 'masque'"
                  type="button"
                  class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-off-line"
                  @click="changerStatutCommentaire(c.idCommentaire, 'masque')"
                >
                  Masquer
                </button>
                <button
                  v-if="c.statut !== 'supprime'"
                  type="button"
                  class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line rr-btn-danger"
                  @click="changerStatutCommentaire(c.idCommentaire, 'supprime')"
                >
                  Supprimer
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- =====================================================
             PANNEAU — Ressources
             ===================================================== -->
        <div
          id="panel-ressources"
          class="fr-tabs__panel"
          :class="{ 'fr-tabs__panel--selected': ongletActif === 'ressources' }"
          role="tabpanel"
          aria-labelledby="tab-ressources"
        >
          <!-- Filtres -->
          <div class="rr-filter-row fr-mb-3w">
            <div class="fr-search-bar fr-search-bar--sm rr-filter-search">
              <label class="fr-label" for="search-ressource"><span class="fr-sr-only">Rechercher</span></label>
              <input id="search-ressource" v-model="rechercheRessource" class="fr-input" type="search" placeholder="Rechercher par titre ou auteur…" />
              <button class="fr-btn fr-btn--sm" type="button"><span class="fr-sr-only">Rechercher</span></button>
            </div>
            <div class="fr-select-group fr-mb-0 rr-filter-select">
              <label class="fr-label fr-text--sm" for="filtre-statut-res">Statut</label>
              <select id="filtre-statut-res" v-model="filtreStatutRessource" class="fr-select">
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="valide">Validée</option>
                <option value="rejetee">Rejetée</option>
              </select>
            </div>
            <p class="fr-text--sm fr-text--grey fr-mb-0 rr-filter-count">
              {{ ressourcesFiltrees.length }} résultat{{ ressourcesFiltrees.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Loader -->
          <div v-if="isLoadingRessources" class="rr-loader fr-py-4w">
            <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span class="fr-ml-1w">Chargement…</span>
          </div>

          <!-- Vide -->
          <div v-else-if="ressourcesFiltrees.length === 0" class="fr-alert fr-alert--info">
            <h3 class="fr-alert__title">Aucune ressource</h3>
            <p>Aucune ressource ne correspond aux filtres sélectionnés.</p>
          </div>

          <!-- Cards ressources -->
          <ul v-else class="rr-resource-list">
            <li
              v-for="r in ressourcesFiltrees"
              :key="r.idRessource"
              class="rr-resource-item"
              :class="{ 'rr-resource-item--priority': r.statut === 'en_attente' }"
            >
              <div class="rr-resource-item__header">
                <div class="rr-resource-item__info">
                  <div class="rr-resource-item__badges fr-mb-1w">
                    <p class="fr-badge fr-badge--sm" :class="badgeStatutRessource(r.statut)">
                      {{ labelStatutRessource(r.statut) }}
                    </p>
                    <p class="fr-badge fr-badge--sm fr-badge--blue-cumulus fr-ml-1w">
                      {{ labelTypeRessource(r.typeRessource) }}
                    </p>
                    <p v-if="r.niveauDifficulte" class="fr-badge fr-badge--sm fr-badge--green-archipel fr-ml-1w">
                      {{ r.niveauDifficulte }}
                    </p>
                  </div>
                  <h3 class="fr-h6 fr-mb-1v">{{ r.titre }}</h3>
                  <p class="fr-text--sm fr-text--grey fr-mb-0">
                    Par <strong>{{ r.nomAuteur }}</strong>
                    · Soumis le {{ formatDate(r.dateCreation) }}
                    <template v-if="r.nbVues"> · {{ r.nbVues }} vue{{ r.nbVues > 1 ? 's' : '' }}</template>
                  </p>
                </div>

                <div class="rr-resource-item__actions">
                  <NuxtLink
                    :to="`/ressources/${r.idRessource}`"
                    class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
                    target="_blank"
                  >
                    Voir
                  </NuxtLink>
                  <button
                    type="button"
                    class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-check-line"
                    :disabled="r.statut === 'valide'"
                    @click="changerStatutRessource(r.idRessource, 'valide')"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-close-line rr-btn-danger"
                    :disabled="r.statut === 'rejetee'"
                    @click="ouvrirModalRessource(r)"
                  >
                    Rejeter
                  </button>
                </div>
              </div>

              <div v-if="r.description" class="rr-resource-item__desc fr-text--sm fr-text--grey fr-mt-1w">
                {{ r.description }}
              </div>

              <div v-if="r.statut === 'rejetee' && r.motifRejet" class="fr-alert fr-alert--error fr-alert--sm fr-mt-2w">
                <p><strong>Motif du rejet :</strong> {{ r.motifRejet }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <!-- ===========================================================
         MODAL — Traiter un signalement
         =========================================================== -->
    <dialog
      v-if="signalementModal"
      class="fr-modal fr-modal--opened"
      aria-labelledby="modal-signal-titre"
      role="dialog"
    >
      <div class="fr-container fr-container--fluid fr-container-md">
        <div class="fr-grid-row fr-grid-row--center">
          <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div class="fr-modal__body">
              <div class="fr-modal__header">
                <button type="button" class="fr-btn--close fr-btn" @click="fermerModalSignalement">Fermer</button>
              </div>
              <div class="fr-modal__content">
                <h1 id="modal-signal-titre" class="fr-modal__title">
                  <span class="fr-icon-alert-line fr-mr-1w" aria-hidden="true"></span>
                  Traiter le signalement
                </h1>

                <dl class="rr-modal-details">
                  <div class="rr-modal-row">
                    <dt>Type</dt>
                    <dd>{{ signalementModal.typeSignalement === 'ressource' ? 'Ressource' : 'Commentaire' }}</dd>
                  </div>
                  <div class="rr-modal-row">
                    <dt>Contenu</dt>
                    <dd>{{ signalementModal.titreRessource || signalementModal.contenuCommentaire || '—' }}</dd>
                  </div>
                  <div class="rr-modal-row">
                    <dt>Motif</dt>
                    <dd>{{ signalementModal.motif }}</dd>
                  </div>
                  <div class="rr-modal-row">
                    <dt>Signalé par</dt>
                    <dd>{{ signalementModal.nomUtilisateur }}</dd>
                  </div>
                  <div class="rr-modal-row">
                    <dt>Date</dt>
                    <dd>{{ formatDate(signalementModal.dateCreation) }}</dd>
                  </div>
                </dl>

                <div class="fr-input-group fr-mt-3w">
                  <label class="fr-label" for="action-prise">
                    Action prise
                    <span class="fr-hint-text">Optionnel — décrivez l'action effectuée</span>
                  </label>
                  <textarea
                    id="action-prise"
                    v-model="actionSignalement"
                    class="fr-input"
                    rows="3"
                    placeholder="Ex : Ressource supprimée, avertissement envoyé à l'utilisateur…"
                  ></textarea>
                </div>
              </div>

              <div class="fr-modal__footer">
                <ul class="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--icon-left fr-icon-check-line"
                      :aria-busy="isTraitant ? 'true' : 'false'"
                      :disabled="isTraitant"
                      @click="traiterSignalement('traite')"
                    >
                      {{ isTraitant ? 'En cours…' : 'Marquer comme traité' }}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-close-line"
                      :disabled="isTraitant"
                      @click="traiterSignalement('ignore')"
                    >
                      Ignorer
                    </button>
                  </li>
                  <li>
                    <button type="button" class="fr-btn fr-btn--tertiary" @click="fermerModalSignalement">
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

    <!-- ===========================================================
         MODAL — Rejeter une ressource
         =========================================================== -->
    <dialog
      v-if="ressourceModal"
      class="fr-modal fr-modal--opened"
      aria-labelledby="modal-rejet-titre"
      role="dialog"
    >
      <div class="fr-container fr-container--fluid fr-container-md">
        <div class="fr-grid-row fr-grid-row--center">
          <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
            <div class="fr-modal__body">
              <div class="fr-modal__header">
                <button type="button" class="fr-btn--close fr-btn" @click="fermerModalRessource">Fermer</button>
              </div>
              <div class="fr-modal__content">
                <h1 id="modal-rejet-titre" class="fr-modal__title">
                  <span class="fr-icon-close-circle-line fr-mr-1w" aria-hidden="true"></span>
                  Rejeter la ressource
                </h1>
                <p>
                  Vous êtes sur le point de rejeter <strong>« {{ ressourceModal.titre }} »</strong>
                  de <strong>{{ ressourceModal.nomAuteur }}</strong>.
                </p>
                <div class="fr-input-group">
                  <label class="fr-label" for="motif-rejet">
                    Motif du rejet
                    <span class="fr-hint-text">Ce motif sera transmis à l'auteur de la ressource</span>
                  </label>
                  <textarea
                    id="motif-rejet"
                    v-model="motifRejet"
                    class="fr-input"
                    rows="4"
                    placeholder="Expliquez pourquoi la ressource est rejetée…"
                  ></textarea>
                </div>
              </div>

              <div class="fr-modal__footer">
                <ul class="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                  <li>
                    <button
                      type="button"
                      class="fr-btn fr-btn--error fr-btn--icon-left fr-icon-close-circle-line"
                      :aria-busy="isValidating ? 'true' : 'false'"
                      :disabled="isValidating"
                      @click="changerStatutRessource(ressourceModal!.idRessource, 'rejetee')"
                    >
                      {{ isValidating ? 'En cours…' : 'Confirmer le rejet' }}
                    </button>
                  </li>
                  <li>
                    <button type="button" class="fr-btn fr-btn--secondary" @click="fermerModalRessource">
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

    <!-- Overlays modals -->
    <div v-if="signalementModal || ressourceModal" class="fr-modal__overlay" @click="fermerModalSignalement(); fermerModalRessource()"></div>

  </main>
</template>

<style scoped>
/* En-tête modération */
.rr-mod-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.rr-mod-badge-role {
  display: inline-flex;
  align-items: center;
}

/* ============================================================
   Cartes statistiques
   ============================================================ */
.rr-stat-card {
  border: 1px solid var(--border-default-grey);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  border-left: 4px solid transparent;
}

.rr-stat-card--warning { border-left-color: #b34000; background: #fff8f5; }
.rr-stat-card--info    { border-left-color: var(--blue-france-sun-113-625); background: var(--background-alt-blue-france); }
.rr-stat-card--purple  { border-left-color: #6a0dad; background: #f8f0ff; }
.rr-stat-card--success { border-left-color: #18753c; background: #dffee6; }

.rr-stat-card__icon {
  font-size: 1.5rem;
  opacity: 0.6;
}

.rr-stat-card__count {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  margin: 0;
}

.rr-stat-card__label {
  font-size: 0.8rem;
  color: var(--text-mention-grey);
  margin: 0;
}

/* ============================================================
   Onglets custom
   ============================================================ */
.rr-tabs .fr-tabs__list {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 2px solid var(--border-default-grey);
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 0;
}

.fr-tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-label-grey);
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -2px;
}

.fr-tabs__tab:hover {
  color: var(--blue-france-sun-113-625);
  background: var(--background-alt-grey);
}

.fr-tabs__tab--active {
  color: var(--blue-france-sun-113-625);
  border-bottom-color: var(--blue-france-sun-113-625);
  font-weight: 700;
}

.rr-tab-badge {
  background: var(--error-425-625);
  color: #fff;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.05rem 0.4rem;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
}

.fr-tabs__panel {
  display: none;
  padding: 1.5rem 0;
}

.fr-tabs__panel--selected {
  display: block;
}

/* ============================================================
   Filtres
   ============================================================ */
.rr-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.rr-filter-select {
  min-width: 160px;
}

.rr-filter-search {
  min-width: 240px;
  flex: 1;
}

.rr-filter-count {
  margin-left: auto;
}

/* ============================================================
   Table
   ============================================================ */
.rr-table-wrapper {
  overflow-x: auto;
}

.rr-table {
  width: 100%;
  min-width: 700px;
}

.rr-td-truncate {
  max-width: 200px;
}

.rr-text-truncate {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* ============================================================
   Aperçu — liste rapide
   ============================================================ */
.rr-apercu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rr-apercu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-default-grey);
}

.rr-apercu-item:last-child { border-bottom: none; }

.rr-apercu-item__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.rr-apercu-item__icon {
  color: var(--blue-france-sun-113-625);
  flex-shrink: 0;
}

/* ============================================================
   Section block (ajouter commentaire)
   ============================================================ */
.rr-section-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
  padding: 1.5rem;
}

/* ============================================================
   Commentaires
   ============================================================ */
.rr-comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rr-comment-item {
  padding: 1.25rem;
  border: 1px solid var(--border-default-grey);
  margin-bottom: 0.75rem;
  background: var(--background-default-grey);
  transition: box-shadow 0.15s;
}

.rr-comment-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,18,.06);
}

.rr-comment-item--signale {
  border-left: 4px solid var(--error-425-625);
}

.rr-comment-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rr-comment-item__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.1rem;
}

.rr-comment-item__badges {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.rr-comment-content {
  color: var(--text-label-grey);
  white-space: pre-wrap;
  word-break: break-word;
}

.rr-comment-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-default-grey);
}

/* ============================================================
   Ressources
   ============================================================ */
.rr-resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rr-resource-item {
  padding: 1.25rem;
  border: 1px solid var(--border-default-grey);
  margin-bottom: 0.75rem;
  background: var(--background-default-grey);
}

.rr-resource-item--priority {
  border-left: 4px solid #b34000;
}

.rr-resource-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.rr-resource-item__info {
  flex: 1;
  min-width: 0;
}

.rr-resource-item__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.rr-resource-item__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: flex-start;
  flex-shrink: 0;
}

.rr-resource-item__desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============================================================
   Bouton danger
   ============================================================ */
.rr-btn-danger {
  color: var(--error-425-625) !important;
}

/* ============================================================
   Modal
   ============================================================ */
.fr-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,18,.48);
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

/* ============================================================
   Détails modal signalement
   ============================================================ */
.rr-modal-details {
  background: var(--background-alt-grey);
  padding: 1rem;
  border: 1px solid var(--border-default-grey);
}

.rr-modal-row {
  display: flex;
  gap: 1rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border-default-grey);
  font-size: 0.875rem;
}

.rr-modal-row:last-child { border-bottom: none; }

.rr-modal-row dt {
  flex: 0 0 100px;
  font-weight: 600;
  color: var(--text-mention-grey);
}

.rr-modal-row dd {
  flex: 1;
  margin: 0;
  word-break: break-word;
}

/* ============================================================
   Loader / spinner
   ============================================================ */
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
  to   { transform: rotate(360deg); }
}
</style>