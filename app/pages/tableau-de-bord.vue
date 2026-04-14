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
// Types
// ---------------------------------------------------------------------------
interface Progression {
  objectifActuel?: string
  pourcentage: number
  seancesRealisees: number
  seancesPrevues: number
}

interface Ressource {
  idRessource: number
  titre: string
  typeRessource: string
  dureeEstimee?: string
  niveauDifficulte?: string
}

interface Seance {
  idSeance: number
  titre: string
  date: string
  heureDebut: string
  heureFin: string
  lieu?: string
  lienVisio?: string
  confirme: boolean
}

interface MessageRecent {
  idMessage: number
  expediteur: { idUtilisateur: number; prenom: string; nom: string; photoProfil?: string }
  contenu: string
  dateEnvoi: string
  lu: boolean
  idConversation: number
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------
const isLoading = ref(true)

const progression = ref<Progression | null>(null)
const ressourcesRecommandees = ref<Ressource[]>([])
const prochaineSeance = ref<Seance | null>(null)
const messagesRecents = ref<MessageRecent[]>([])

const isConfirmingSeance = ref(false)
const seanceConfirmee = ref(false)

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------
async function fetchAll() {
  if (!userId.value) return

  const headers = { Authorization: `Bearer ${authToken.value}` }

  await Promise.allSettled([
    $fetch<Progression>(`/progression/utilisateur/${userId.value}`, { baseURL: apiBase, headers })
      .then((d) => (progression.value = d))
      .catch(() => {}),

    $fetch<Ressource[]>(`/ressources/recommandees/${userId.value}?limit=2`, { baseURL: apiBase, headers })
      .then((d) => (ressourcesRecommandees.value = d))
      .catch(() => {}),

    $fetch<Seance>(`/seances/prochaine/${userId.value}`, { baseURL: apiBase, headers })
      .then((d) => (prochaineSeance.value = d))
      .catch(() => {}),

    $fetch<MessageRecent[]>(`/conversations/messages-recents/${userId.value}?limit=2`, { baseURL: apiBase, headers })
      .then((d) => (messagesRecents.value = d))
      .catch(() => {}),
  ])

  isLoading.value = false
}

onMounted(() => fetchAll())

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
async function confirmerPresence() {
  if (!prochaineSeance.value) return
  isConfirmingSeance.value = true
  try {
    await $fetch(`/seances/${prochaineSeance.value.idSeance}/confirmer`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    seanceConfirmee.value = true
    if (prochaineSeance.value) prochaineSeance.value.confirme = true
  } catch {
    seanceConfirmee.value = false
  } finally {
    isConfirmingSeance.value = false
  }
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function initiales(prenom: string, nom: string) {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
}

function formatDateMessage(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (diff === 0) return `Aujourd'hui à ${heure}`
  if (diff === 1) return `Hier à ${heure}`
  if (diff === 2) return `Avant-hier à ${heure}`
  return `${d.toLocaleDateString('fr-FR')} à ${heure}`
}

function formatDateSeance(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function labelType(type: string): string {
  const map: Record<string, string> = {
    article: 'Article', video: 'Vidéo', audio: 'Audio',
    exercice: 'Exercice', activite: 'Activité', jeu: 'Jeu',
    pdf: 'PDF',
  }
  return map[type] ?? type
}

function iconType(type: string): string {
  const map: Record<string, string> = {
    article: 'fr-icon-article-line', video: 'fr-icon-video-line',
    audio: 'fr-icon-sound-line', pdf: 'fr-icon-file-pdf-line',
    exercice: 'fr-icon-body-line',
  }
  return map[type] ?? 'fr-icon-file-line'
}

const derniereConnexion = computed(() => {
  const now = new Date()
  return `aujourd'hui à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
})
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-5w">

    <!-- ===================================================================
         En-tête — Bienvenue
         =================================================================== -->
    <div class="fr-grid-row fr-grid-row--middle rr-dashboard-header fr-mb-5w">
      <div class="fr-col">
        <h1 class="fr-h3 fr-mb-0 rr-welcome-title">
          Bienvenue, {{ user?.prenom ?? user?.prenom ?? user?.firstname }} {{ (user?.nom ?? user?.nom ?? user?.lastname)?.[0] }}.
        </h1>
        <p class="fr-text--sm rr-welcome-sub fr-mb-0">
          Dernière connexion : {{ derniereConnexion }}
        </p>
      </div>
      <div class="fr-col-auto">
        <NuxtLink
          to="/mon-compte"
          class="fr-btn fr-btn--icon-left fr-icon-edit-line"
        >
          Modifier mon profil
        </NuxtLink>
      </div>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto rr-loader">
        <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
        <span class="fr-ml-1w fr-text--grey">Chargement de votre tableau de bord…</span>
      </div>
    </div>

    <template v-else>

      <!-- =================================================================
           Ligne 1 — Évolution · Ressources recommandées
           ================================================================= -->
      <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">

        <!-- Mon évolution -->
        <div class="fr-col-12 fr-col-md-6">
          <div class="rr-widget h-100">
            <h2 class="rr-widget__title">
              <span class="fr-icon-line-chart-line fr-mr-1w" aria-hidden="true"></span>
              Mon évolution
            </h2>

            <template v-if="progression">
              <p class="fr-text--sm fr-text--grey fr-mb-1w">
                Objectif actuel :
                <strong class="fr-text--blue-france">{{ progression.objectifActuel || 'Non défini' }}</strong>
              </p>

              <!-- Barre de progression -->
              <div class="rr-progress-bar-wrap fr-mb-1v">
                <div
                  class="rr-progress-bar"
                  :style="{ width: `${progression.pourcentage}%` }"
                  role="progressbar"
                  :aria-valuenow="progression.pourcentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <p class="fr-text--sm fr-text--grey fr-mb-3w">{{ progression.pourcentage }}% complété</p>

              <hr class="fr-hr fr-mb-2w" />

              <p class="fr-text--sm fr-text--bold fr-mb-1w">Séances réalisées</p>
              <div class="rr-seances-stat fr-mb-2w">
                <span class="rr-seances-stat__count">{{ progression.seancesRealisees }}</span>
                <span class="fr-text--sm fr-text--grey">
                  sur {{ progression.seancesPrevues }} prévues
                </span>
              </div>

              <NuxtLink
                to="/mon-compte"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-eye-line"
              >
                Voir le détail
              </NuxtLink>
            </template>

            <div v-else class="rr-widget__empty">
              <span class="fr-icon-line-chart-line rr-widget__empty-icon" aria-hidden="true"></span>
              <p class="fr-text--sm fr-text--grey fr-mb-0">
                Aucune donnée de progression disponible.
              </p>
            </div>
          </div>
        </div>

        <!-- Ressources recommandées -->
        <div class="fr-col-12 fr-col-md-6">
          <div class="rr-widget h-100">
            <h2 class="rr-widget__title">
              <span class="fr-icon-book-2-line fr-mr-1w" aria-hidden="true"></span>
              Ressources recommandées
            </h2>

            <div v-if="ressourcesRecommandees.length === 0" class="rr-widget__empty">
              <span class="fr-icon-book-2-line rr-widget__empty-icon" aria-hidden="true"></span>
              <p class="fr-text--sm fr-text--grey fr-mb-0">Aucune recommandation pour le moment.</p>
            </div>

            <ul v-else class="rr-ressource-list fr-mb-2w">
              <li
                v-for="res in ressourcesRecommandees"
                :key="res.idRessource"
                class="rr-ressource-item"
              >
                <NuxtLink :to="`/ressources/${res.idRessource}`" class="rr-ressource-link">
                  <span :class="[iconType(res.typeRessource), 'fr-mr-1w rr-ressource-icon']" aria-hidden="true"></span>
                  <span>
                    <strong class="rr-ressource-titre">{{ res.titre }}</strong>
                    <span class="fr-text--sm fr-text--grey rr-ressource-meta">
                      {{ labelType(res.typeRessource) }}
                      <template v-if="res.dureeEstimee"> · {{ res.dureeEstimee }}</template>
                      <template v-if="res.niveauDifficulte"> · Niveau {{ res.niveauDifficulte }}</template>
                    </span>
                  </span>
                </NuxtLink>
              </li>
            </ul>

            <NuxtLink
              to="/ressources"
              class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-folder-2-line"
            >
              Voir les ressources
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- =================================================================
           Ligne 2 — Prochaine séance · Messages récents
           ================================================================= -->
      <div class="fr-grid-row fr-grid-row--gutters">

        <!-- Prochaine séance -->
        <div class="fr-col-12">
          <div class="rr-widget rr-widget--seance fr-mb-4w">
            <h2 class="rr-widget__title">
              <span class="fr-icon-calendar-event-line fr-mr-1w" aria-hidden="true"></span>
              Prochaine séance
            </h2>

            <template v-if="prochaineSeance">
              <div class="fr-grid-row fr-grid-row--middle">
                <div class="fr-col">
                  <p class="fr-h6 fr-mb-1w rr-seance-titre">
                    {{ prochaineSeance.titre }}
                  </p>
                  <div class="rr-seance-meta fr-text--sm">
                    <span class="fr-icon-time-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    {{ formatDateSeance(prochaineSeance.date) }} · {{ prochaineSeance.heureDebut }}–{{ prochaineSeance.heureFin }}
                  </div>
                  <div class="rr-seance-meta fr-text--sm fr-mt-1v">
                    <span class="fr-icon-map-pin-2-line fr-icon--sm fr-mr-1v" aria-hidden="true"></span>
                    {{ prochaineSeance.lieu || (prochaineSeance.lienVisio ? 'En ligne (lien Zoom envoyé par email)' : '—') }}
                  </div>
                </div>
                <div class="fr-col-auto fr-grid-row fr-grid-row--gutters">
                  <div class="fr-col-auto">
                    <button
                      type="button"
                      class="fr-btn fr-btn--sm"
                      :class="prochaineSeance.confirme || seanceConfirmee ? 'fr-btn--success' : ''"
                      :disabled="prochaineSeance.confirme || seanceConfirmee || isConfirmingSeance"
                      :aria-busy="isConfirmingSeance ? 'true' : 'false'"
                      @click="confirmerPresence"
                    >
                      <span
                        :class="prochaineSeance.confirme || seanceConfirmee ? 'fr-icon-check-line' : 'fr-icon-checkbox-circle-line'"
                        class="fr-mr-1v"
                        aria-hidden="true"
                      ></span>
                      {{ prochaineSeance.confirme || seanceConfirmee ? 'Présence confirmée' : isConfirmingSeance ? 'Confirmation…' : 'Confirmer ma présence' }}
                    </button>
                  </div>
                  <div class="fr-col-auto">
                    <NuxtLink
                      :to="`/seances/${prochaineSeance.idSeance}`"
                      class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-information-line"
                    >
                      Détails
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </template>

            <div v-else class="rr-widget__empty">
              <span class="fr-icon-calendar-event-line rr-widget__empty-icon" aria-hidden="true"></span>
              <p class="fr-text--sm fr-text--grey fr-mb-2w">Aucune séance prévue prochainement.</p>
              <NuxtLink to="/seances" class="fr-btn fr-btn--sm fr-btn--secondary">
                Planifier une séance
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Messages récents -->
        <div class="fr-col-12">
          <div class="rr-widget">
            <h2 class="rr-widget__title">
              <span class="fr-icon-mail-line fr-mr-1w" aria-hidden="true"></span>
              Messages récents
            </h2>

            <div v-if="messagesRecents.length === 0" class="rr-widget__empty">
              <span class="fr-icon-mail-line rr-widget__empty-icon" aria-hidden="true"></span>
              <p class="fr-text--sm fr-text--grey fr-mb-0">Aucun message récent.</p>
            </div>

            <ul v-else class="rr-messages-list">
              <li
                v-for="msg in messagesRecents"
                :key="msg.idMessage"
                class="rr-message-item"
                :class="{ 'rr-message-item--unread': !msg.lu }"
              >
                <div class="rr-message-item__left">
                  <div class="rr-avatar rr-avatar--md">
                    <img
                      v-if="msg.expediteur.photoProfil"
                      :src="`${apiBase}${msg.expediteur.photoProfil}`"
                      :alt="`Photo de ${msg.expediteur.prenom}`"
                    />
                    <span v-else class="rr-avatar__initiales">
                      {{ initiales(msg.expediteur.prenom, msg.expediteur.nom) }}
                    </span>
                  </div>
                  <div class="rr-message-item__body">
                    <div class="rr-message-item__header">
                      <span class="fr-text--bold">
                        {{ msg.expediteur.prenom }} {{ msg.expediteur.nom }}
                      </span>
                      <span class="fr-text--sm fr-text--grey rr-message-date">
                        {{ formatDateMessage(msg.dateEnvoi) }}
                      </span>
                      <span v-if="!msg.lu" class="fr-badge fr-badge--sm fr-badge--blue-france rr-badge-new">
                        Nouveau
                      </span>
                    </div>
                    <p class="fr-text--sm rr-message-preview fr-mb-1w">
                      {{ msg.contenu }}
                    </p>
                    <NuxtLink
                      :to="`/messagerie?conversation=${msg.idConversation}`"
                      class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-left fr-icon-reply-line"
                    >
                      Répondre
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>

            <div class="fr-mt-2w">
              <NuxtLink
                to="/messagerie"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-mail-line"
              >
                Voir tous les messages
              </NuxtLink>
            </div>
          </div>
        </div>

      </div>
    </template>
  </main>
</template>

<style scoped>
/* ============================================================
   En-tête bienvenue
   ============================================================ */
.rr-welcome-title {
  color: var(--blue-france-sun-113-625);
  font-weight: 700;
}

.rr-welcome-sub {
  color: var(--text-mention-grey);
}

.rr-dashboard-header {
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.25rem;
}

/* ============================================================
   Widget générique
   ============================================================ */
.rr-widget {
  background: var(--background-default-grey);
  border: 1px solid var(--border-default-grey);
  padding: 1.5rem;
}

.rr-widget.h-100 {
  height: 100%;
  box-sizing: border-box;
}

.rr-widget__title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-title-grey);
  display: flex;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-default-grey);
}

.rr-widget__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.rr-widget__empty-icon {
  font-size: 2rem;
  opacity: 0.2;
}

/* ============================================================
   Avatar
   ============================================================ */
.rr-avatar {
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--background-contrast-blue-france);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rr-avatar--sm  { width: 32px; height: 32px; }
.rr-avatar--md  { width: 44px; height: 44px; }
.rr-avatar--lg  { width: 60px; height: 60px; }

.rr-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.rr-avatar__initiales {
  font-weight: 700;
  color: var(--blue-france-sun-113-625);
  font-size: 0.9rem;
}

/* ============================================================
   Progression
   ============================================================ */
.rr-progress-bar-wrap {
  height: 10px;
  background: var(--background-contrast-grey);
  border-radius: 5px;
  overflow: hidden;
}

.rr-progress-bar {
  height: 100%;
  background: var(--blue-france-sun-113-625);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.rr-seances-stat {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.rr-seances-stat__count {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--blue-france-sun-113-625);
  line-height: 1;
}

.fr-text--blue-france {
  color: var(--blue-france-sun-113-625);
}

/* ============================================================
   Ressources recommandées
   ============================================================ */
.rr-ressource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rr-ressource-item {
  border-bottom: 1px solid var(--border-default-grey);
  padding: 0.75rem 0;
}

.rr-ressource-item:last-child {
  border-bottom: none;
}

.rr-ressource-link {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
  transition: color 0.15s;
}

.rr-ressource-link:hover .rr-ressource-titre {
  color: var(--blue-france-sun-113-625);
  text-decoration: underline;
}

.rr-ressource-icon {
  color: var(--blue-france-sun-113-625);
  flex-shrink: 0;
  margin-top: 2px;
}

.rr-ressource-titre {
  display: block;
  font-size: 0.9rem;
  color: var(--blue-france-sun-113-625);
}

.rr-ressource-meta {
  display: block;
  font-size: 0.78rem;
}

/* ============================================================
   Séance widget
   ============================================================ */
.rr-seance-titre {
  color: var(--blue-france-sun-113-625);
}

.rr-seance-meta {
  display: flex;
  align-items: center;
  color: var(--text-mention-grey);
}

/* ============================================================
   Messages récents
   ============================================================ */
.rr-messages-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rr-message-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border-default-grey);
}

.rr-message-item:last-child {
  border-bottom: none;
}

.rr-message-item--unread {
  background: var(--background-alt-blue-france);
  padding: 1.25rem;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.rr-message-item__left {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
}

.rr-message-item__body {
  flex: 1;
  min-width: 0;
}

.rr-message-item__header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.rr-message-date {
  font-size: 0.78rem;
}

.rr-badge-new {
  font-size: 0.7rem;
}

.rr-message-preview {
  color: var(--text-label-grey);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============================================================
   Loader
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