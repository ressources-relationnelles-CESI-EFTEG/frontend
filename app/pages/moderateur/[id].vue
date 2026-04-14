<script setup lang="ts">
definePageMeta({
  middleware: 'moderateur',
})

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const _auth = useAuth() as any
const authToken = computed<string | null>(
  () => (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)
const userId = computed(
  () => (_auth.user?.value?.id ?? _auth.user?.value?.idUtilisateur) ?? null,
)
const authHeaders = computed(() =>
  authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {},
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StatutSignalement = 'EN_ATTENTE' | 'TRAITE' | 'IGNORE'

interface Signalement {
  idSignalement: number
  typeSignalement: 'RESSOURCE' | 'COMMENTAIRE'
  idRessource?: number
  idCommentaire?: number
  motif: string
  statut: StatutSignalement
  actionPrise?: string
  dateCreation: string
  dateTraitement?: string
  idModerateur?: number
  utilisateur?: { idUtilisateur: number; prenom?: string; nom?: string; email?: string }
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------
const isLoading = ref(true)
const errorMessage = ref('')
const signalement = ref<Signalement | null>(null)
const cible = ref<Record<string, any> | null>(null)

const actionPrise = ref('')
const motifRejet = ref('')
const isTraitant = ref(false)
const erreur = ref('')
const succes = ref('')

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------
async function fetchSignalement() {
  try {
    signalement.value = await $fetch<Signalement>(`/signalements/${route.params.id}`, {
      baseURL: apiBase,
      headers: authHeaders.value,
    })
    actionPrise.value = signalement.value.actionPrise ?? ''
  } catch {
    errorMessage.value = 'Signalement introuvable.'
  }
}

async function fetchCible() {
  if (!signalement.value) return
  try {
    if (signalement.value.typeSignalement === 'COMMENTAIRE' && signalement.value.idCommentaire) {
      cible.value = await $fetch<Record<string, any>>(
        `/commentaires/${signalement.value.idCommentaire}`,
        { baseURL: apiBase, headers: authHeaders.value },
      )
    } else if (signalement.value.typeSignalement === 'RESSOURCE' && signalement.value.idRessource) {
      cible.value = await $fetch<Record<string, any>>(
        `/ressources/${signalement.value.idRessource}`,
        { baseURL: apiBase, headers: authHeaders.value },
      )
    }
  } catch {
    // cible déjà supprimée
  }
}

onMounted(async () => {
  await fetchSignalement()
  await fetchCible()
  isLoading.value = false
})

// ---------------------------------------------------------------------------
// Actions commentaire
// ---------------------------------------------------------------------------
async function changerStatutCommentaire(statut: 'MASQUE' | 'SUPPRIME') {
  if (!cible.value) return
  erreur.value = ''
  try {
    await $fetch(`/commentaires/${cible.value.idCommentaire}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authHeaders.value,
      body: { statut },
    })
    cible.value.statut = statut
    succes.value = `Commentaire ${statut === 'MASQUE' ? 'masqué' : 'supprimé'} avec succès.`
  } catch {
    erreur.value = "L'action sur le commentaire a échoué."
  }
}

// ---------------------------------------------------------------------------
// Actions ressource
// ---------------------------------------------------------------------------
async function changerStatutRessource(statut: 'VALIDEE' | 'REJETEE') {
  if (!cible.value) return
  erreur.value = ''
  if (statut === 'REJETEE' && !motifRejet.value.trim()) {
    erreur.value = 'Un motif est requis pour rejeter une ressource.'
    return
  }
  try {
    await $fetch(`/ressources/${cible.value.idRessource}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authHeaders.value,
      body: {
        statut,
        motifRejet: statut === 'REJETEE' ? motifRejet.value.trim() : undefined,
      },
    })
    cible.value.statut = statut
    if (statut === 'REJETEE') cible.value.motifRejet = motifRejet.value.trim()
    succes.value = `Ressource ${statut === 'VALIDEE' ? 'validée' : 'rejetée'} avec succès.`
  } catch {
    erreur.value = "L'action sur la ressource a échoué."
  }
}

async function supprimerRessource() {
  if (!cible.value) return
  if (!confirm(`Supprimer la ressource « ${cible.value.titre} » ? Cette action est irréversible.`)) return
  erreur.value = ''
  try {
    await $fetch(`/ressources/${cible.value.idRessource}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: authHeaders.value,
    })
    cible.value = null
    succes.value = 'Ressource supprimée.'
  } catch {
    erreur.value = 'La suppression a échoué.'
  }
}

// ---------------------------------------------------------------------------
// Traitement signalement
// ---------------------------------------------------------------------------
async function traiterSignalement(statut: 'TRAITE' | 'IGNORE') {
  if (!signalement.value) return
  isTraitant.value = true
  erreur.value = ''
  try {
    await $fetch(`/signalements/${signalement.value.idSignalement}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: authHeaders.value,
      body: {
        statut,
        actionPrise: actionPrise.value.trim() || undefined,
        idModerateur: userId.value,
      },
    })
    signalement.value.statut = statut
    signalement.value.actionPrise = actionPrise.value.trim()
    signalement.value.dateTraitement = new Date().toISOString()
    succes.value = `Signalement marqué comme ${statut === 'TRAITE' ? 'traité' : 'ignoré'}.`
  } catch {
    erreur.value = 'Le traitement du signalement a échoué.'
  } finally {
    isTraitant.value = false
  }
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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
    VISIBLE: 'fr-badge--success',
    MASQUE: 'fr-badge--warning',
    SUPPRIME: 'fr-badge--error',
    VALIDEE: 'fr-badge--success',
    REJETEE: 'fr-badge--error',
    BROUILLON: 'fr-badge--blue-cumulus',
  }
  return map[statut] ?? ''
}

function labelStatut(statut: string) {
  const map: Record<string, string> = {
    EN_ATTENTE: 'En attente', TRAITE: 'Traité', IGNORE: 'Ignoré',
    VISIBLE: 'Visible', MASQUE: 'Masqué', SUPPRIME: 'Supprimé',
    VALIDEE: 'Validée', REJETEE: 'Rejetée', BROUILLON: 'Brouillon',
  }
  return map[statut] ?? statut
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">

    <!-- Fil d'Ariane -->
    <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
      <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-modo-detail">
        Voir le fil d'Ariane
      </button>
      <div class="fr-collapse" id="breadcrumb-modo-detail">
        <ol class="fr-breadcrumb__list">
          <li><NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink></li>
          <li><NuxtLink class="fr-breadcrumb__link" to="/moderateur">Modération</NuxtLink></li>
          <li><a class="fr-breadcrumb__link" aria-current="page">Signalement #{{ route.params.id }}</a></li>
        </ol>
      </div>
    </nav>

    <!-- Chargement -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto rr-loader" role="status">
        <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
        <span class="fr-ml-1w fr-text--grey">Chargement…</span>
      </div>
    </div>

    <!-- Erreur -->
    <div v-else-if="errorMessage" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
      <h2 class="fr-alert__title">Erreur</h2>
      <p>{{ errorMessage }}</p>
      <NuxtLink to="/moderateur" class="fr-btn fr-btn--tertiary fr-mt-2w">Retour à la modération</NuxtLink>
    </div>

    <template v-else-if="signalement">
      <div class="fr-grid-row fr-grid-row--gutters">

        <!-- Colonne principale -->
        <div class="fr-col-12 fr-col-lg-7">

          <!-- Messages feedback -->
          <div v-if="succes" class="fr-alert fr-alert--success fr-mb-3w" role="status">
            <p>{{ succes }}</p>
          </div>
          <div v-if="erreur" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
            <p>{{ erreur }}</p>
          </div>

          <!-- ===================================================
               Bloc cible : Commentaire
               =================================================== -->
          <template v-if="signalement.typeSignalement === 'COMMENTAIRE'">
            <h2 class="fr-h5 fr-mb-3w">
              <span class="fr-icon-chat-3-line fr-mr-1w" aria-hidden="true"></span>
              Commentaire signalé
            </h2>

            <div v-if="cible" class="fr-p-4w rr-cible-block fr-mb-4w">
              <p class="fr-text--bold fr-mb-1w fr-text--sm fr-text--grey">Contenu :</p>
              <p class="rr-contenu fr-mb-3w">{{ cible.contenu }}</p>

              <div class="fr-grid-row fr-grid-row--middle fr-mb-3w">
                <div class="fr-col">
                  <p class="fr-text--sm fr-text--grey fr-mb-0">
                    Statut actuel :
                    <span :class="['fr-badge fr-badge--sm', badgeStatut(cible.statut)]">
                      {{ labelStatut(cible.statut) }}
                    </span>
                  </p>
                </div>
              </div>

              <div v-if="cible.statut !== 'SUPPRIME'" class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
                <button
                  v-if="cible.statut !== 'MASQUE'"
                  type="button"
                  class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-eye-off-line"
                  @click="changerStatutCommentaire('MASQUE')"
                >
                  Masquer le commentaire
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line"
                  @click="changerStatutCommentaire('SUPPRIME')"
                >
                  Supprimer le commentaire
                </button>
              </div>
              <p v-else class="fr-text--sm fr-text--grey">Ce commentaire a déjà été supprimé.</p>
            </div>
            <div v-else class="fr-alert fr-alert--info fr-mb-4w">
              <p>Commentaire introuvable (peut-être déjà supprimé).</p>
            </div>
          </template>

          <!-- ===================================================
               Bloc cible : Ressource
               =================================================== -->
          <template v-else-if="signalement.typeSignalement === 'RESSOURCE'">
            <h2 class="fr-h5 fr-mb-3w">
              <span class="fr-icon-file-line fr-mr-1w" aria-hidden="true"></span>
              Ressource signalée
            </h2>

            <div v-if="cible" class="fr-p-4w rr-cible-block fr-mb-4w">
              <h3 class="fr-h4 fr-mb-1w">{{ cible.titre }}</h3>
              <p v-if="cible.description" class="fr-text--grey fr-mb-2w">{{ cible.description }}</p>

              <div class="fr-grid-row fr-grid-row--middle fr-mb-3w">
                <div class="fr-col">
                  <p class="fr-text--sm fr-text--grey fr-mb-0">
                    Statut :
                    <span :class="['fr-badge fr-badge--sm', badgeStatut(cible.statut)]">
                      {{ labelStatut(cible.statut) }}
                    </span>
                  </p>
                </div>
                <div class="fr-col-auto">
                  <NuxtLink
                    :to="`/ressources/${cible.idRessource}`"
                    class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-external-link-line"
                    target="_blank"
                  >
                    Voir la ressource
                  </NuxtLink>
                </div>
              </div>

              <!-- Motif de rejet existant -->
              <div v-if="cible.motifRejet" class="fr-alert fr-alert--error fr-alert--sm fr-mb-3w">
                <p>Motif de rejet : {{ cible.motifRejet }}</p>
              </div>

              <!-- Saisie motif rejet -->
              <div v-if="cible.statut !== 'SUPPRIME'" class="fr-input-group fr-mb-3w">
                <label for="motif-rejet" class="fr-label fr-text--sm">
                  Motif de rejet <span class="fr-text--grey">(requis si rejet)</span>
                </label>
                <input
                  id="motif-rejet"
                  v-model="motifRejet"
                  type="text"
                  class="fr-input"
                  :placeholder="cible.motifRejet ?? 'Ex : contenu inapproprié'"
                />
              </div>

              <div v-if="cible.statut !== 'SUPPRIME'" class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
                <button
                  v-if="cible.statut !== 'VALIDEE'"
                  type="button"
                  class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-check-line"
                  @click="changerStatutRessource('VALIDEE')"
                >
                  Valider la ressource
                </button>
                <button
                  v-if="cible.statut !== 'REJETEE'"
                  type="button"
                  class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-close-line"
                  @click="changerStatutRessource('REJETEE')"
                >
                  Rejeter la ressource
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-delete-line"
                  @click="supprimerRessource"
                >
                  Supprimer la ressource
                </button>
              </div>
            </div>
            <div v-else class="fr-alert fr-alert--info fr-mb-4w">
              <p>Ressource introuvable (peut-être déjà supprimée).</p>
            </div>
          </template>

          <!-- ===================================================
               Traitement du signalement
               =================================================== -->
          <div class="rr-traitement-block fr-p-4w fr-mb-4w">
            <h2 class="fr-h5 fr-mb-3w">
              <span class="fr-icon-settings-5-line fr-mr-1w" aria-hidden="true"></span>
              Traitement du signalement
            </h2>

            <div
              v-if="signalement.statut !== 'EN_ATTENTE'"
              class="fr-alert fr-alert--success fr-alert--sm fr-mb-3w"
            >
              <p>
                Signalement <strong>{{ labelStatut(signalement.statut).toLowerCase() }}</strong>
                <template v-if="signalement.dateTraitement">
                  le {{ formatDate(signalement.dateTraitement) }}
                </template>
                <template v-if="signalement.actionPrise">
                  — <em>{{ signalement.actionPrise }}</em>
                </template>.
              </p>
            </div>

            <template v-else>
              <div class="fr-input-group fr-mb-3w">
                <label for="action-prise" class="fr-label fr-text--sm">
                  Action prise <span class="fr-text--grey">(optionnel)</span>
                </label>
                <textarea
                  id="action-prise"
                  v-model="actionPrise"
                  class="fr-input"
                  rows="2"
                  placeholder="Décrivez l'action effectuée…"
                ></textarea>
              </div>

              <div class="fr-btns-group fr-btns-group--inline fr-btns-group--sm fr-btns-group--icon-left">
                <button
                  type="button"
                  class="fr-btn fr-btn--sm fr-btn--icon-left fr-icon-check-line"
                  :disabled="isTraitant"
                  @click="traiterSignalement('TRAITE')"
                >
                  Marquer traité
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-left fr-icon-close-line"
                  :disabled="isTraitant"
                  @click="traiterSignalement('IGNORE')"
                >
                  Ignorer
                </button>
              </div>
            </template>
          </div>

          <!-- Retour -->
          <NuxtLink
            to="/moderateur"
            class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line"
          >
            Retour à la modération
          </NuxtLink>
        </div>

        <!-- Colonne info signalement -->
        <div class="fr-col-12 fr-col-lg-5">
          <aside class="fr-p-3w rr-side-info" aria-label="Informations sur le signalement">
            <h2 class="fr-h6 fr-mb-2w">
              <span class="fr-icon-information-line fr-mr-1w" aria-hidden="true"></span>
              Informations
            </h2>
            <dl class="rr-meta-list">
              <div class="rr-meta-row">
                <dt>N° signalement</dt>
                <dd>#{{ signalement.idSignalement }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Type</dt>
                <dd>{{ signalement.typeSignalement === 'COMMENTAIRE' ? 'Commentaire' : 'Ressource' }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Signalé par</dt>
                <dd>{{ nomUtilisateur(signalement.utilisateur) }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Date</dt>
                <dd>{{ formatDate(signalement.dateCreation) }}</dd>
              </div>
              <div class="rr-meta-row">
                <dt>Statut</dt>
                <dd>
                  <p :class="['fr-badge fr-badge--sm', badgeStatut(signalement.statut)]">
                    {{ labelStatut(signalement.statut) }}
                  </p>
                </dd>
              </div>
              <div v-if="signalement.dateTraitement" class="rr-meta-row">
                <dt>Traité le</dt>
                <dd>{{ formatDate(signalement.dateTraitement) }}</dd>
              </div>
            </dl>

            <hr class="fr-hr fr-my-2w" />

            <h2 class="fr-h6 fr-mb-1w">Motif du signalement</h2>
            <p class="fr-text--sm">{{ signalement.motif }}</p>
          </aside>
        </div>

      </div>
    </template>

  </main>
</template>

<style scoped>
.rr-cible-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

.rr-traitement-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

.rr-contenu {
  white-space: pre-wrap;
  line-height: 1.7;
}

.rr-side-info {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
  position: sticky;
  top: 1rem;
}

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
