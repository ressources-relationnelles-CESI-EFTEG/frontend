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
const userId = computed<number | null>(() => {
  if (!authToken.value) return null
  try {
    const payloadB64 = authToken.value.split('.')[0]
    const payload = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const id = Number(payload.split(':')[0])
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
})
const isLoggedIn = computed(() => !!authToken.value && !!userId.value)

// --- Commentaires ---
const commentaires = ref<Record<string, any>[]>([])
const isLoadingCommentaires = ref(false)
const nouveauCommentaire = ref('')
const commentaireErreur = ref('')
const commentaireSucces = ref(false)
const reponseOuverte = ref<number | null>(null)
const texteReponses = ref<Record<number, string>>({})

async function fetchCommentaires() {
  isLoadingCommentaires.value = true
  try {
    const data = await $fetch<Record<string, any>[]>(`/commentaires/ressource/${route.params.id}`, {
      baseURL: apiBase,
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
    })
    commentaires.value = Array.isArray(data) ? data : []
  } catch {
    commentaires.value = []
  } finally {
    isLoadingCommentaires.value = false
  }
}

async function posterCommentaire() {
  const contenu = nouveauCommentaire.value.trim()
  if (!contenu || !userId.value) return
  try {
    await $fetch('/commentaires', {
      baseURL: apiBase,
      method: 'POST',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
      body: { idUtilisateur: userId.value, idRessource: Number(route.params.id), contenu },
    })
    nouveauCommentaire.value = ''
    commentaireSucces.value = true
    setTimeout(() => (commentaireSucces.value = false), 3000)
    await fetchCommentaires()
  } catch {
    commentaireErreur.value = 'Impossible de publier le commentaire.'
    setTimeout(() => (commentaireErreur.value = ''), 3000)
  }
}

async function posterReponse(idCommentaireParent: number) {
  const contenu = texteReponses.value[idCommentaireParent]?.trim()
  if (!contenu || !userId.value) return
  try {
    await $fetch('/commentaires', {
      baseURL: apiBase,
      method: 'POST',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
      body: { idUtilisateur: userId.value, idRessource: Number(route.params.id), idCommentaireParent, contenu },
    })
    texteReponses.value[idCommentaireParent] = ''
    reponseOuverte.value = null
    await fetchCommentaires()
  } catch {
    // silently ignore
  }
}

async function supprimerCommentaire(id: number) {
  if (!window.confirm('Supprimer ce commentaire ? Cette action est irréversible.')) return
  try {
    await $fetch(`/commentaires/${id}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
    })
    await fetchCommentaires()
  } catch {
    // silently ignore
  }
}

function toggleReponse(id: number) {
  reponseOuverte.value = reponseOuverte.value === id ? null : id
}

// --- Signalements ---
const signalRessourceOuvert = ref(false)
const signalCommentaireOuvert = ref<number | null>(null)
const motifSignalRessource = ref('')
const motifSignalCommentaire = ref<Record<number, string>>({})
const signalSucces = ref('')
const signalErreur = ref('')

async function signalerRessource() {
  const motif = motifSignalRessource.value.trim()
  if (!motif || !userId.value) return
  try {
    await $fetch('/signalements', {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idUtilisateur: userId.value,
        typeSignalement: 'RESSOURCE',
        idRessource: Number(route.params.id),
        motif,
      },
    })
    signalRessourceOuvert.value = false
    motifSignalRessource.value = ''
    signalSucces.value = 'Ressource signalée. Un modérateur va examiner votre signalement.'
    setTimeout(() => (signalSucces.value = ''), 5000)
  } catch {
    signalErreur.value = 'Impossible d\'envoyer le signalement.'
    setTimeout(() => (signalErreur.value = ''), 3000)
  }
}

async function signalerCommentaire(idCommentaire: number) {
  const motif = motifSignalCommentaire.value[idCommentaire]?.trim()
  if (!motif || !userId.value) return
  try {
    await $fetch('/signalements', {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idUtilisateur: userId.value,
        typeSignalement: 'COMMENTAIRE',
        idCommentaire,
        motif,
      },
    })
    signalCommentaireOuvert.value = null
    motifSignalCommentaire.value[idCommentaire] = ''
    signalSucces.value = 'Commentaire signalé. Un modérateur va examiner votre signalement.'
    setTimeout(() => (signalSucces.value = ''), 5000)
  } catch {
    signalErreur.value = 'Impossible d\'envoyer le signalement.'
    setTimeout(() => (signalErreur.value = ''), 3000)
  }
}

// --- Provenance (pour le bouton retour) ---
const fromModerateur = computed(() => route.query.from === 'moderateur')
const retourHref = computed(() => fromModerateur.value ? '/moderateur' : '/ressources')
const retourLabel = computed(() => fromModerateur.value ? 'Retour à la modération' : 'Retour aux ressources')

// --- Actions de modération ---
const actionEnCours = ref(false)
const motifRejet = ref('')
const modActionSucces = ref('')
const modActionErreur = ref('')

async function validerRessource() {
  if (!ressource.value) return
  actionEnCours.value = true
  modActionSucces.value = ''
  modActionErreur.value = ''
  try {
    await $fetch(`/ressources/${route.params.id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
      body: { statut: 'VALIDEE' },
    })
    ressource.value.statut = 'VALIDEE'
    modActionSucces.value = 'Ressource validée avec succès.'
  } catch {
    modActionErreur.value = 'Erreur lors de la validation.'
  } finally {
    actionEnCours.value = false
  }
}

async function rejeterRessource() {
  if (!ressource.value) return
  const motif = motifRejet.value.trim()
  if (!motif) {
    modActionErreur.value = 'Veuillez saisir un motif de rejet.'
    return
  }
  actionEnCours.value = true
  modActionSucces.value = ''
  modActionErreur.value = ''
  try {
    await $fetch(`/ressources/${route.params.id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
      body: { statut: 'REJETEE', motifRejet: motif },
    })
    ressource.value.statut = 'REJETEE'
    ressource.value.motifRejet = motif
    modActionSucces.value = 'Ressource rejetée.'
  } catch {
    modActionErreur.value = 'Erreur lors du rejet.'
  } finally {
    actionEnCours.value = false
  }
}

async function supprimerRessource() {
  if (!ressource.value) return
  if (!window.confirm(`Supprimer la ressource « ${ressource.value.titre} » ? Cette action est irréversible.`)) return
  await $fetch(`/ressources/${route.params.id}`, {
    baseURL: apiBase,
    method: 'DELETE',
    headers: authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
  })
  navigateTo(retourHref.value)
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
  fetchCommentaires()
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
    VIDEO: 'fr-icon-film-line',
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

function badgeStatut(statut: string) {
  const map: Record<string, { label: string; classe: string }> = {
    BROUILLON:  { label: 'Brouillon',                 classe: 'fr-badge--blue-cumulus' },
    EN_ATTENTE: { label: 'En attente de validation',  classe: 'fr-badge--warning' },
    VALIDEE:    { label: 'Validée',                   classe: 'fr-badge--success' },
    REJETEE:    { label: 'Rejetée',                   classe: 'fr-badge--error' },
  }
  return map[statut] ?? { label: statut, classe: '' }
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

          <!-- Navigation retour + Signaler -->
          <div class="fr-btns-group fr-btns-group--inline fr-mt-2w">
            <NuxtLink :to="retourHref" class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line">
              {{ retourLabel }}
            </NuxtLink>
            <button
              v-if="isLoggedIn && userId !== ressource.idUtilisateur"
              type="button"
              class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-flag-line"
              @click="signalRessourceOuvert = !signalRessourceOuvert"
            >
              Signaler
            </button>
          </div>

          <!-- Feedback signalement -->
          <div v-if="signalSucces" class="fr-alert fr-alert--success fr-alert--sm fr-mt-2w" role="alert">
            <p>{{ signalSucces }}</p>
          </div>
          <div v-if="signalErreur" class="fr-alert fr-alert--error fr-alert--sm fr-mt-2w" role="alert">
            <p>{{ signalErreur }}</p>
          </div>

          <!-- Formulaire signalement ressource -->
          <div v-if="signalRessourceOuvert" class="rr-signal-form fr-mt-2w fr-p-3w">
            <h3 class="fr-text--bold fr-mb-1w fr-text--sm">
              <span class="fr-icon-flag-line fr-mr-1w" aria-hidden="true"></span>
              Signaler cette ressource
            </h3>
            <div class="fr-input-group">
              <label class="fr-label fr-text--sm" for="motif-signal-ressource">
                Motif du signalement <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="motif-signal-ressource"
                v-model="motifSignalRessource"
                class="fr-input"
                rows="2"
                placeholder="Décrivez le problème…"
              ></textarea>
            </div>
            <div class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mt-1w">
              <button
                type="button"
                class="fr-btn fr-btn--sm"
                :disabled="!motifSignalRessource.trim()"
                @click="signalerRessource"
              >
                Envoyer
              </button>
              <button
                type="button"
                class="fr-btn fr-btn--secondary fr-btn--sm"
                @click="signalRessourceOuvert = false; motifSignalRessource = ''"
              >
                Annuler
              </button>
            </div>
          </div>

          <!-- Bloc modération (visible seulement pour les modérateurs) -->
          <div v-if="isModo && ressource" class="rr-modo-block fr-mt-4w fr-p-3w">
            <h2 class="fr-h5 fr-mb-3w">
              <span class="fr-icon-shield-line fr-mr-1w" aria-hidden="true"></span>
              Actions de modération
            </h2>

            <!-- Statut actuel -->
            <p class="fr-text--sm fr-mb-2w">
              Statut actuel :
              <span :class="['fr-badge fr-badge--sm', badgeStatut(ressource.statut).classe]">
                {{ badgeStatut(ressource.statut).label }}
              </span>
            </p>

            <!-- Feedback -->
            <div v-if="modActionSucces" class="fr-alert fr-alert--success fr-alert--sm fr-mb-2w" role="alert">
              <p>{{ modActionSucces }}</p>
            </div>
            <div v-if="modActionErreur" class="fr-alert fr-alert--error fr-alert--sm fr-mb-2w" role="alert">
              <p>{{ modActionErreur }}</p>
            </div>

            <!-- Motif rejet si déjà rejetée -->
            <div v-if="ressource.statut === 'REJETEE' && ressource.motifRejet" class="fr-alert fr-alert--error fr-alert--sm fr-mb-2w">
              <p>Motif de rejet : <strong>{{ ressource.motifRejet }}</strong></p>
            </div>

            <!-- Champ motif (si pas encore rejetée ni validée) -->
            <div v-if="ressource.statut !== 'VALIDEE'" class="fr-input-group fr-mb-2w">
              <label for="motif-rejet" class="fr-label fr-text--sm">
                Motif de rejet <span class="fr-text--grey">(requis si rejet)</span>
              </label>
              <input
                id="motif-rejet"
                v-model="motifRejet"
                type="text"
                class="fr-input"
                placeholder="Ex : contenu inapproprié"
              />
            </div>

            <!-- Boutons -->
            <div class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
              <button
                v-if="ressource.statut !== 'VALIDEE'"
                type="button"
                class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-check-line"
                :disabled="actionEnCours"
                @click="validerRessource"
              >
                Valider
              </button>
              <button
                v-if="ressource.statut !== 'REJETEE'"
                type="button"
                class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-close-line"
                :disabled="actionEnCours"
                @click="rejeterRessource"
              >
                Rejeter
              </button>
              <button
                type="button"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line"
                :disabled="actionEnCours"
                @click="supprimerRessource"
              >
                Supprimer
              </button>
            </div>
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

      <!-- Section Commentaires -->
      <section class="rr-comments fr-mt-6w" aria-labelledby="titre-commentaires">
        <h2 class="fr-h4 fr-mb-4w" id="titre-commentaires">
          <span class="fr-icon-chat-3-line fr-mr-1w" aria-hidden="true"></span>
          Commentaires
          <span v-if="commentaires.length" class="fr-badge fr-badge--blue-cumulus fr-ml-2w">{{ commentaires.length }}</span>
        </h2>

        <!-- Formulaire nouveau commentaire -->
        <div v-if="isLoggedIn" class="fr-mb-4w">
          <div class="fr-input-group">
            <label class="fr-label" for="nouveau-commentaire">Laisser un commentaire</label>
            <textarea
              id="nouveau-commentaire"
              v-model="nouveauCommentaire"
              class="fr-input rr-comment-textarea"
              rows="3"
              placeholder="Votre commentaire…"
            ></textarea>
          </div>
          <div v-if="commentaireSucces" class="fr-alert fr-alert--success fr-alert--sm fr-mt-1w" role="alert">
            <p>Commentaire publié avec succès.</p>
          </div>
          <div v-if="commentaireErreur" class="fr-alert fr-alert--error fr-alert--sm fr-mt-1w" role="alert">
            <p>{{ commentaireErreur }}</p>
          </div>
          <button
            type="button"
            class="fr-btn fr-btn--sm fr-mt-2w"
            :disabled="!nouveauCommentaire.trim()"
            @click="posterCommentaire"
          >
            Publier
          </button>
        </div>
        <div v-else class="fr-callout fr-mb-4w">
          <p class="fr-callout__text">
            <NuxtLink to="/connexion">Connectez-vous</NuxtLink> pour laisser un commentaire.
          </p>
        </div>

        <!-- Chargement -->
        <div v-if="isLoadingCommentaires" class="rr-loader fr-py-2w">
          <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
          <span class="fr-ml-1w">Chargement des commentaires…</span>
        </div>

        <!-- Aucun commentaire -->
        <p v-else-if="!commentaires.length" class="fr-text--mention-grey">
          Aucun commentaire pour l'instant. Soyez le premier à réagir !
        </p>

        <!-- Liste des commentaires -->
        <div v-else class="rr-comment-list">
          <article
            v-for="com in commentaires"
            :key="com.idCommentaire"
            class="rr-comment fr-mb-3w"
          >
            <div class="rr-comment-header">
              <span class="fr-icon-user-line rr-comment-avatar" aria-hidden="true"></span>
              <strong class="rr-comment-author">{{ nomAuteur(com.utilisateur) }}</strong>
              <span class="rr-comment-date fr-text--sm">{{ formatDate(com.dateCreation) }}</span>
              <button
                v-if="isModo"
                type="button"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-only fr-icon-delete-line rr-btn-delete"
                title="Supprimer ce commentaire"
                @click="supprimerCommentaire(com.idCommentaire)"
              ></button>
              <button
                v-if="isLoggedIn && userId !== com.idUtilisateur"
                type="button"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-only fr-icon-flag-line rr-btn-signal"
                :title="signalCommentaireOuvert === com.idCommentaire ? 'Annuler le signalement' : 'Signaler ce commentaire'"
                @click="signalCommentaireOuvert = signalCommentaireOuvert === com.idCommentaire ? null : com.idCommentaire"
              ></button>
            </div>
            <p class="rr-comment-body">{{ com.contenu }}</p>

            <!-- Formulaire signalement commentaire -->
            <div v-if="signalCommentaireOuvert === com.idCommentaire" class="rr-signal-form fr-mt-2w fr-p-2w">
              <div class="fr-input-group">
                <label class="fr-label fr-text--sm" :for="`motif-signal-com-${com.idCommentaire}`">
                  Motif du signalement <span aria-hidden="true">*</span>
                </label>
                <textarea
                  :id="`motif-signal-com-${com.idCommentaire}`"
                  v-model="motifSignalCommentaire[com.idCommentaire]"
                  class="fr-input"
                  rows="2"
                  placeholder="Décrivez le problème…"
                ></textarea>
              </div>
              <div class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-mt-1w">
                <button
                  type="button"
                  class="fr-btn fr-btn--sm"
                  :disabled="!motifSignalCommentaire[com.idCommentaire]?.trim()"
                  @click="signalerCommentaire(com.idCommentaire)"
                >
                  Envoyer
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--secondary fr-btn--sm"
                  @click="signalCommentaireOuvert = null"
                >
                  Annuler
                </button>
              </div>
            </div>

            <!-- Réponses imbriquées -->
            <div v-if="com.reponses?.length" class="rr-replies fr-mt-2w">
              <article
                v-for="rep in com.reponses"
                :key="rep.idCommentaire"
                class="rr-comment rr-reply fr-mb-2w"
              >
                <div class="rr-comment-header">
                  <span class="fr-icon-user-line rr-comment-avatar" aria-hidden="true"></span>
                  <strong class="rr-comment-author">{{ nomAuteur(rep.utilisateur) }}</strong>
                  <span class="rr-comment-date fr-text--sm">{{ formatDate(rep.dateCreation) }}</span>
                  <button
                    v-if="isModo"
                    type="button"
                    class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-only fr-icon-delete-line rr-btn-delete"
                    title="Supprimer cette réponse"
                    @click="supprimerCommentaire(rep.idCommentaire)"
                  ></button>
                </div>
                <p class="rr-comment-body">{{ rep.contenu }}</p>
              </article>
            </div>

            <!-- Bouton répondre -->
            <div v-if="isLoggedIn" class="fr-mt-2w">
              <button
                type="button"
                class="fr-btn fr-btn--tertiary fr-btn--sm"
                @click="toggleReponse(com.idCommentaire)"
              >
                {{ reponseOuverte === com.idCommentaire ? 'Annuler' : 'Répondre' }}
              </button>
              <div v-if="reponseOuverte === com.idCommentaire" class="fr-mt-2w">
                <div class="fr-input-group">
                  <label class="fr-label fr-sr-only" :for="`reponse-${com.idCommentaire}`">Votre réponse</label>
                  <textarea
                    :id="`reponse-${com.idCommentaire}`"
                    v-model="texteReponses[com.idCommentaire]"
                    class="fr-input rr-comment-textarea"
                    rows="2"
                    placeholder="Votre réponse…"
                  ></textarea>
                </div>
                <button
                  type="button"
                  class="fr-btn fr-btn--sm fr-mt-1w"
                  :disabled="!texteReponses[com.idCommentaire]?.trim()"
                  @click="posterReponse(com.idCommentaire)"
                >
                  Publier la réponse
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

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

/* Bloc modération */
.rr-modo-block {
  background: var(--background-alt-blue-france);
  border: 2px solid var(--border-action-high-blue-france);
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

/* Commentaires */
.rr-comments {
  border-top: 2px solid var(--border-default-grey);
  padding-top: 2rem;
}

.rr-comment-textarea {
  resize: vertical;
}

.rr-comment-list {
  display: flex;
  flex-direction: column;
}

.rr-comment {
  border: 1px solid var(--border-default-grey);
  padding: 1rem 1.25rem;
  background: var(--background-default-grey);
}

.rr-replies {
  padding-left: 1.5rem;
}

.rr-reply {
  background: var(--background-alt-grey);
  border-left: 3px solid var(--border-action-high-blue-france);
}

.rr-comment-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.rr-comment-avatar {
  color: var(--text-mention-grey);
  flex-shrink: 0;
}

.rr-comment-author {
  font-size: 0.875rem;
}

.rr-comment-date {
  color: var(--text-mention-grey);
  margin-left: auto;
}

.rr-btn-delete {
  color: var(--text-default-error) !important;
  margin-left: 0.25rem;
}

.rr-btn-signal {
  color: var(--text-mention-grey) !important;
  margin-left: 0.25rem;
}

.rr-signal-form {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
  border-left: 3px solid var(--border-default-warning);
}

.rr-comment-body {
  margin: 0.5rem 0 0;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
