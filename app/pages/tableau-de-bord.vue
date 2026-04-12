<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { user, authToken } = useAuth()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Mentor {
  idUtilisateur: number
  prenom: string
  nom: string
  metier?: string
  description?: string
  photoProfil?: string
}

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

interface MentorCandidat {
  idUtilisateur: number
  prenom: string
  nom: string
  metier?: string
  specialite?: string
  note?: number
  nombreAvis?: number
  photoProfil?: string
  modesAccompagnement?: string[]
  description?: string
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------
const isLoading = ref(true)

const mentor = ref<Mentor | null>(null)
const progression = ref<Progression | null>(null)
const ressourcesRecommandees = ref<Ressource[]>([])
const prochaineSeance = ref<Seance | null>(null)
const messagesRecents = ref<MessageRecent[]>([])
const mentorsRecommandes = ref<MentorCandidat[]>([])

// Recherche mentor
const rechercheMentor = ref('')
const filtreTypeAccompagnement = ref('')
const filtreMentier = ref('')
const filtreRegion = ref('')
const filtreDisponibilite = ref('')

const isConfirmingSeance = ref(false)
const seanceConfirmee = ref(false)

// ---------------------------------------------------------------------------
// Chargement
// ---------------------------------------------------------------------------
async function fetchAll() {
  if (!user.value?.id) return

  const headers = { Authorization: `Bearer ${authToken.value}` }

  await Promise.allSettled([
    $fetch<Mentor>(`/mentors/mon-mentor/${user.value.id}`, { baseURL: apiBase, headers })
      .then((d) => (mentor.value = d))
      .catch(() => {}),

    $fetch<Progression>(`/progression/utilisateur/${user.value.id}`, { baseURL: apiBase, headers })
      .then((d) => (progression.value = d))
      .catch(() => {}),

    $fetch<Ressource[]>(`/ressources/recommandees/${user.value.id}?limit=2`, { baseURL: apiBase, headers })
      .then((d) => (ressourcesRecommandees.value = d))
      .catch(() => {}),

    $fetch<Seance>(`/seances/prochaine/${user.value.id}`, { baseURL: apiBase, headers })
      .then((d) => (prochaineSeance.value = d))
      .catch(() => {}),

    $fetch<MessageRecent[]>(`/conversations/messages-recents/${user.value.id}?limit=2`, { baseURL: apiBase, headers })
      .then((d) => (messagesRecents.value = d))
      .catch(() => {}),

    $fetch<MentorCandidat[]>('/mentors/recommandes?limit=2', { baseURL: apiBase, headers })
      .then((d) => (mentorsRecommandes.value = d))
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
          Bienvenue, {{ user?.firstname }} {{ user?.lastname?.[0] }}.
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
           Ligne 1 — Mentor · Évolution · Ressources recommandées
           ================================================================= -->
      <div class="fr-grid-row fr-grid-row--gutters fr-mb-4w">

        <!-- Mon mentor -->
        <div class="fr-col-12 fr-col-md-4">
          <div class="rr-widget h-100">
            <h2 class="rr-widget__title">
              <span class="fr-icon-user-heart-line fr-mr-1w" aria-hidden="true"></span>
              Mon mentor
            </h2>

            <template v-if="mentor">
              <div class="rr-mentor-card">
                <div class="rr-avatar rr-avatar--lg">
                  <img
                    v-if="mentor.photoProfil"
                    :src="`${apiBase}${mentor.photoProfil}`"
                    :alt="`Photo de ${mentor.prenom} ${mentor.nom}`"
                  />
                  <span v-else class="rr-avatar__initiales">
                    {{ initiales(mentor.prenom, mentor.nom) }}
                  </span>
                </div>
                <div>
                  <p class="fr-text--bold fr-mb-0">{{ mentor.prenom }} {{ mentor.nom }}</p>
                  <p class="fr-text--sm fr-text--grey fr-mb-0">{{ mentor.metier }}</p>
                </div>
              </div>
              <p v-if="mentor.description" class="fr-text--sm rr-mentor-quote fr-my-2w">
                « {{ mentor.description }} »
              </p>
              <NuxtLink
                to="/messagerie"
                class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-chat-3-line"
              >
                Envoyer un message
              </NuxtLink>
            </template>

            <div v-else class="rr-widget__empty">
              <span class="fr-icon-user-heart-line rr-widget__empty-icon" aria-hidden="true"></span>
              <p class="fr-text--sm fr-text--grey fr-mb-2w">
                Vous n'avez pas encore de mentor attitré.
              </p>
              <NuxtLink to="/trouver-mentor" class="fr-btn fr-btn--sm fr-btn--secondary">
                Trouver un mentor
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mon évolution -->
        <div class="fr-col-12 fr-col-md-4">
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
        <div class="fr-col-12 fr-col-md-4">
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
              class="fr-btn fr-btn--tertiary fr-btn--sm fr-btn--icon-left fr-icon-add-line"
            >
              Voir toutes les ressources
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- =================================================================
           Ligne 2 — Trouver un mentor
           ================================================================= -->
      <div class="rr-widget fr-mb-4w">
        <h2 class="rr-widget__title">
          <span class="fr-icon-search-line fr-mr-1w" aria-hidden="true"></span>
          Trouver un mentor
        </h2>

        <!-- Barre de recherche -->
        <div class="fr-search-bar fr-mb-3w" role="search">
          <label class="fr-label" for="search-mentor">
            <span class="fr-sr-only">Rechercher un mentor</span>
          </label>
          <input
            id="search-mentor"
            v-model="rechercheMentor"
            class="fr-input"
            type="search"
            placeholder="Rechercher par mots-clés (développeur, communication, soutien…)"
            autocomplete="off"
          />
          <button class="fr-btn" type="button" title="Rechercher">
            <span class="fr-sr-only">Rechercher</span>
          </button>
        </div>

        <!-- Filtres -->
        <div class="fr-grid-row fr-grid-row--gutters fr-mb-3w">
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-type-acc">Type d'accompagnement</label>
              <select id="filtre-type-acc" v-model="filtreTypeAccompagnement" class="fr-select">
                <option value="">Tous</option>
                <option value="visio">Visio</option>
                <option value="chat">Chat</option>
                <option value="presentiel">Présentiel</option>
              </select>
            </div>
          </div>
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-3">
            <div class="fr-input-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-metier">Métier (optionnel)</label>
              <input
                id="filtre-metier"
                v-model="filtreMentier"
                class="fr-input"
                type="text"
                placeholder="Ex : Développeur, RH…"
              />
            </div>
          </div>
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-region">Région</label>
              <select id="filtre-region" v-model="filtreRegion" class="fr-select">
                <option value="">Toutes régions</option>
                <option value="idf">Île-de-France</option>
                <option value="aura">Auvergne-Rhône-Alpes</option>
                <option value="paca">Provence-Alpes-Côte d'Azur</option>
                <option value="occ">Occitanie</option>
                <option value="na">Nouvelle-Aquitaine</option>
              </select>
            </div>
          </div>
          <div class="fr-col-12 fr-col-sm-6 fr-col-md-3">
            <div class="fr-select-group fr-mb-0">
              <label class="fr-label fr-text--sm" for="filtre-dispo">Disponibilité</label>
              <select id="filtre-dispo" v-model="filtreDisponibilite" class="fr-select">
                <option value="">Tous</option>
                <option value="disponible">Disponible</option>
                <option value="occupe">Occupé</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Mentors recommandés -->
        <p class="fr-text--sm fr-text--bold fr-mb-2w">Mentors recommandés</p>

        <div v-if="mentorsRecommandes.length === 0" class="rr-widget__empty">
          <p class="fr-text--sm fr-text--grey fr-mb-0">Aucun mentor recommandé pour le moment.</p>
        </div>

        <div v-else class="fr-grid-row fr-grid-row--gutters">
          <div
            v-for="m in mentorsRecommandes"
            :key="m.idUtilisateur"
            class="fr-col-12 fr-col-md-6"
          >
            <div class="rr-mentor-result-card">
              <div class="rr-mentor-result-card__top">
                <div class="rr-avatar rr-avatar--md">
                  <img
                    v-if="m.photoProfil"
                    :src="`${apiBase}${m.photoProfil}`"
                    :alt="`Photo de ${m.prenom} ${m.nom}`"
                  />
                  <span v-else class="rr-avatar__initiales">
                    {{ initiales(m.prenom, m.nom) }}
                  </span>
                </div>
                <div class="rr-mentor-result-card__info">
                  <p class="fr-text--bold fr-mb-0 rr-mentor-nom">{{ m.prenom }} {{ m.nom }}</p>
                  <!-- Note étoiles -->
                  <div v-if="m.note" class="rr-stars fr-mb-0" :aria-label="`Note : ${m.note} sur 5`">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="rr-star"
                      :class="i <= Math.round(m.note) ? 'rr-star--full' : 'rr-star--empty'"
                      aria-hidden="true"
                    >★</span>
                    <span class="fr-text--sm fr-text--grey fr-ml-1v">({{ m.nombreAvis }})</span>
                  </div>
                  <p class="fr-text--sm fr-text--grey fr-mb-0">
                    {{ m.specialite || m.metier }}
                  </p>
                </div>
              </div>
              <p v-if="m.description" class="fr-text--sm fr-mt-1w fr-mb-2w rr-mentor-desc">
                {{ m.description }}
              </p>
              <div class="rr-mentor-result-card__footer">
                <div class="rr-modes-list">
                  <span
                    v-for="mode in (m.modesAccompagnement ?? [])"
                    :key="mode"
                    class="fr-badge fr-badge--sm fr-badge--blue-cumulus"
                  >{{ mode }}</span>
                </div>
                <NuxtLink
                  :to="`/mentors/${m.idUtilisateur}`"
                  class="fr-btn fr-btn--tertiary fr-btn--sm"
                >
                  Voir profil
                  <span class="fr-icon-arrow-right-line fr-ml-1v fr-icon--sm" aria-hidden="true"></span>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- =================================================================
           Ligne 3 — Prochaine séance · Messages récents
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
   Mentor widget
   ============================================================ */
.rr-mentor-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
}

.rr-mentor-quote {
  color: var(--text-mention-grey);
  font-style: italic;
  border-left: 3px solid var(--border-default-grey);
  padding-left: 0.75rem;
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
   Mentor résultat (trouver un mentor)
   ============================================================ */
.rr-mentor-result-card {
  border: 1px solid var(--border-default-grey);
  padding: 1.25rem;
  background: var(--background-default-grey);
  transition: box-shadow 0.15s;
}

.rr-mentor-result-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,18,.08);
}

.rr-mentor-result-card__top {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.rr-mentor-result-card__info {
  flex: 1;
}

.rr-mentor-nom {
  font-size: 0.95rem;
}

.rr-mentor-desc {
  color: var(--text-mention-grey);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rr-mentor-result-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-default-grey);
}

.rr-modes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

/* Étoiles */
.rr-stars {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 0.9rem;
}

.rr-star--full  { color: #f5a623; }
.rr-star--empty { color: var(--background-contrast-grey); }

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
