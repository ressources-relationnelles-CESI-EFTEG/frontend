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
interface Conversation {
  idConversation: number
  interlocuteur: {
    idUtilisateur: number
    prenom: string
    nom: string
    photoProfil?: string
  }
  dernierMessage?: string
  dateLastMessage?: string
  nonLus: number
  enLigne?: boolean
}

interface Message {
  idMessage: number
  idExpediteur: number
  contenu: string
  dateEnvoi: string
  lu: boolean
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------
const conversations = ref<Conversation[]>([])
const conversationActive = ref<Conversation | null>(null)
const messages = ref<Message[]>([])
const recherche = ref('')
const nouveauMessage = ref('')

const isLoadingConversations = ref(true)
const isLoadingMessages = ref(false)
const isSending = ref(false)

const messagesContainer = ref<HTMLElement | null>(null)

// ---------------------------------------------------------------------------
// Chargement des conversations
// ---------------------------------------------------------------------------
async function fetchConversations() {
  if (!userId.value) return
  isLoadingConversations.value = true
  try {
    const data = await $fetch<Conversation[]>(`/conversations/utilisateur/${userId.value}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    conversations.value = data
  } catch {
    conversations.value = []
  } finally {
    isLoadingConversations.value = false
  }
}

// ---------------------------------------------------------------------------
// Chargement des messages d'une conversation
// ---------------------------------------------------------------------------
async function ouvrirConversation(conv: Conversation) {
  conversationActive.value = conv
  messages.value = []
  isLoadingMessages.value = true

  try {
    const data = await $fetch<Message[]>(`/conversations/${conv.idConversation}/messages`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    messages.value = data

    // Marquer comme lus
    if (conv.nonLus > 0) {
      conv.nonLus = 0
      await $fetch(`/conversations/${conv.idConversation}/lus`, {
        baseURL: apiBase,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken.value}` },
      }).catch(() => {})
    }
  } catch {
    messages.value = []
  } finally {
    isLoadingMessages.value = false
    await nextTick()
    scrollToBottom()
  }
}

// ---------------------------------------------------------------------------
// Envoi d'un message
// ---------------------------------------------------------------------------
async function envoyerMessage() {
  const texte = nouveauMessage.value.trim()
  if (!texte || !conversationActive.value || isSending.value) return

  isSending.value = true
  const messageOptimiste: Message = {
    idMessage: Date.now(),
    idExpediteur: userId.value as number,
    contenu: texte,
    dateEnvoi: new Date().toISOString(),
    lu: false,
  }
  messages.value.push(messageOptimiste)
  nouveauMessage.value = ''
  await nextTick()
  scrollToBottom()

  try {
    const data = await $fetch<Message>(`/conversations/${conversationActive.value.idConversation}/messages`, {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idExpediteur: userId.value as number,
        contenu: texte,
      },
    })
    // Remplace le message optimiste par la réponse serveur
    const idx = messages.value.findIndex((m) => m.idMessage === messageOptimiste.idMessage)
    if (idx !== -1) messages.value[idx] = data

    // Met à jour le dernier message dans la sidebar
    const conv = conversations.value.find(
      (c) => c.idConversation === conversationActive.value?.idConversation,
    )
    if (conv) {
      conv.dernierMessage = texte
      conv.dateLastMessage = data.dateEnvoi
    }
  } catch {
    // Rollback optimiste
    messages.value = messages.value.filter((m) => m.idMessage !== messageOptimiste.idMessage)
    nouveauMessage.value = texte
  } finally {
    isSending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    envoyerMessage()
  }
}

// ---------------------------------------------------------------------------
// Scroll
// ---------------------------------------------------------------------------
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// ---------------------------------------------------------------------------
// Filtrage conversations
// ---------------------------------------------------------------------------
const conversationsFiltrees = computed(() => {
  if (!recherche.value.trim()) return conversations.value
  const q = recherche.value.toLowerCase()
  return conversations.value.filter((c) => {
    const nom = `${c.interlocuteur.prenom} ${c.interlocuteur.nom}`.toLowerCase()
    return nom.includes(q) || c.dernierMessage?.toLowerCase().includes(q)
  })
})

// ---------------------------------------------------------------------------
// Groupement des messages par date
// ---------------------------------------------------------------------------
const messagesGroupes = computed(() => {
  const groupes: { label: string; messages: Message[] }[] = []
  let labelCourant = ''

  for (const msg of messages.value) {
    const label = labelDate(msg.dateEnvoi)
    if (label !== labelCourant) {
      groupes.push({ label, messages: [] })
      labelCourant = label
    }
    groupes[groupes.length - 1]?.messages.push(msg)
  }
  return groupes
})

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function labelDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const hier = new Date(now)
  hier.setDate(hier.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === hier.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatHeure(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSidebar(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  const hier = new Date(now)
  hier.setDate(hier.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function initiales(prenom: string, nom: string): string {
  return `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()
}

function estMien(msg: Message): boolean {
  return msg.idExpediteur === userId.value
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
onMounted(async () => {
  await fetchConversations()
  // Ouvrir la première conversation automatiquement si disponible
  const premiere = conversations.value[0]
  if (premiere) {
    await ouvrirConversation(premiere)
  }
})
</script>

<template>
  <div class="rr-messagerie-layout">

    <!-- =====================================================================
         SIDEBAR — liste des conversations
         ===================================================================== -->
    <aside class="rr-sidebar" aria-label="Conversations">

      <!-- Titre sidebar -->
      <div class="rr-sidebar__header">
        <h1 class="fr-h5 fr-mb-0">
          <span class="fr-icon-chat-3-line fr-mr-1w" aria-hidden="true"></span>
          Messagerie
        </h1>
      </div>

      <!-- Recherche -->
      <div class="rr-sidebar__search fr-px-2w fr-pb-2w">
        <div class="fr-search-bar fr-search-bar--sm" role="search">
          <label class="fr-label" for="recherche-conv">
            <span class="fr-sr-only">Rechercher une conversation</span>
          </label>
          <input
            id="recherche-conv"
            v-model="recherche"
            class="fr-input"
            type="search"
            placeholder="Rechercher une conversation…"
            autocomplete="off"
          />
          <button class="fr-btn fr-btn--sm" type="button" title="Rechercher">
            <span class="fr-icon-search-line" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <!-- Liste -->
      <div class="rr-sidebar__list" role="list">
        <!-- Chargement -->
        <div v-if="isLoadingConversations" class="rr-sidebar__empty fr-text--sm fr-text--grey">
          <span class="fr-icon-refresh-line rr-spin fr-mr-1w" aria-hidden="true"></span>
          Chargement…
        </div>

        <!-- Vide -->
        <div v-else-if="conversationsFiltrees.length === 0" class="rr-sidebar__empty fr-text--sm fr-text--grey">
          <span class="fr-icon-chat-3-line fr-mr-1w" aria-hidden="true"></span>
          Aucune conversation
        </div>

        <!-- Items -->
        <button
          v-for="conv in conversationsFiltrees"
          :key="conv.idConversation"
          type="button"
          class="rr-conv-item"
          :class="{ 'rr-conv-item--active': conversationActive?.idConversation === conv.idConversation }"
          :aria-current="conversationActive?.idConversation === conv.idConversation ? 'true' : undefined"
          @click="ouvrirConversation(conv)"
          role="listitem"
        >
          <!-- Avatar -->
          <div class="rr-avatar rr-avatar--md">
            <img
              v-if="conv.interlocuteur.photoProfil"
              :src="`${apiBase}${conv.interlocuteur.photoProfil}`"
              :alt="`Photo de ${conv.interlocuteur.prenom} ${conv.interlocuteur.nom}`"
            />
            <span v-else class="rr-avatar__initiales">
              {{ initiales(conv.interlocuteur.prenom, conv.interlocuteur.nom) }}
            </span>
            <span v-if="conv.enLigne" class="rr-avatar__online" aria-label="En ligne"></span>
          </div>

          <!-- Contenu -->
          <div class="rr-conv-item__body">
            <div class="rr-conv-item__top">
              <span class="rr-conv-item__nom fr-text--bold">
                {{ conv.interlocuteur.prenom }} {{ conv.interlocuteur.nom }}
              </span>
              <span class="rr-conv-item__date fr-text--sm">
                {{ formatDateSidebar(conv.dateLastMessage) }}
              </span>
            </div>
            <div class="rr-conv-item__bottom">
              <span class="rr-conv-item__preview fr-text--sm">
                {{ conv.dernierMessage || 'Aucun message' }}
              </span>
              <span
                v-if="conv.nonLus > 0"
                class="rr-badge-unread"
                :aria-label="`${conv.nonLus} messages non lus`"
              >
                {{ conv.nonLus > 9 ? '9+' : conv.nonLus }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>

    <!-- =====================================================================
         PANNEAU PRINCIPAL — conversation
         ===================================================================== -->
    <main id="contenu" class="rr-chat-panel" role="main">

      <!-- Aucune conversation sélectionnée -->
      <div v-if="!conversationActive" class="rr-chat-empty">
        <span class="fr-icon-chat-3-line rr-chat-empty__icon" aria-hidden="true"></span>
        <p class="fr-h5 fr-mb-1w">Sélectionnez une conversation</p>
        <p class="fr-text--sm fr-text--grey fr-mb-0">
          Choisissez une conversation dans la liste pour afficher les messages.
        </p>
      </div>

      <template v-else>
        <!-- En-tête conversation -->
        <header class="rr-chat-header">
          <div class="rr-chat-header__left">
            <div class="rr-avatar rr-avatar--md">
              <img
                v-if="conversationActive.interlocuteur.photoProfil"
                :src="`${apiBase}${conversationActive.interlocuteur.photoProfil}`"
                :alt="`Photo de ${conversationActive.interlocuteur.prenom}`"
              />
              <span v-else class="rr-avatar__initiales">
                {{ initiales(conversationActive.interlocuteur.prenom, conversationActive.interlocuteur.nom) }}
              </span>
              <span v-if="conversationActive.enLigne" class="rr-avatar__online"></span>
            </div>
            <div class="rr-chat-header__info">
              <p class="fr-text--bold fr-mb-0">
                {{ conversationActive.interlocuteur.prenom }}
                {{ conversationActive.interlocuteur.nom }}
              </p>
              <p class="fr-text--sm fr-mb-0" :class="conversationActive.enLigne ? 'rr-status--online' : 'fr-text--grey'">
                {{ conversationActive.enLigne ? 'En ligne' : 'Hors ligne' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="rr-chat-header__actions">
            <button
              type="button"
              class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn"
              title="Appel vidéo"
              aria-label="Démarrer un appel vidéo"
            >
              <span class="fr-icon-video-line" aria-hidden="true"></span>
            </button>
            <button
              type="button"
              class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn"
              title="Plus d'options"
              aria-label="Plus d'options"
            >
              <span class="fr-icon-more-line" aria-hidden="true"></span>
            </button>
          </div>
        </header>

        <!-- Zone messages -->
        <div
          ref="messagesContainer"
          class="rr-messages-zone"
          aria-label="Messages"
          aria-live="polite"
        >
          <!-- Chargement -->
          <div v-if="isLoadingMessages" class="rr-messages-loading">
            <span class="fr-icon-refresh-line rr-spin fr-mr-1w" aria-hidden="true"></span>
            Chargement des messages…
          </div>

          <!-- Vide -->
          <div v-else-if="messages.length === 0" class="rr-messages-empty">
            <span class="fr-icon-chat-3-line rr-messages-empty__icon" aria-hidden="true"></span>
            <p class="fr-text--sm fr-text--grey fr-mb-0">
              Aucun message pour l'instant. Dites bonjour !
            </p>
          </div>

          <!-- Messages groupés par date -->
          <template v-else>
            <div
              v-for="groupe in messagesGroupes"
              :key="groupe.label"
            >
              <!-- Séparateur de date -->
              <div class="rr-date-separator" aria-label="Date">
                <span>{{ groupe.label }}</span>
              </div>

              <!-- Messages du groupe -->
              <div
                v-for="msg in groupe.messages"
                :key="msg.idMessage"
                class="rr-message-row"
                :class="estMien(msg) ? 'rr-message-row--moi' : 'rr-message-row--autre'"
              >
                <!-- Avatar interlocuteur -->
                <div
                  v-if="!estMien(msg)"
                  class="rr-avatar rr-avatar--sm rr-message-avatar"
                  aria-hidden="true"
                >
                  <img
                    v-if="conversationActive.interlocuteur.photoProfil"
                    :src="`${apiBase}${conversationActive.interlocuteur.photoProfil}`"
                    alt=""
                  />
                  <span v-else class="rr-avatar__initiales rr-avatar__initiales--sm">
                    {{ initiales(conversationActive.interlocuteur.prenom, conversationActive.interlocuteur.nom) }}
                  </span>
                </div>

                <!-- Bulle -->
                <div class="rr-bubble-wrapper">
                  <div
                    class="rr-bubble"
                    :class="estMien(msg) ? 'rr-bubble--moi' : 'rr-bubble--autre'"
                  >
                    {{ msg.contenu }}
                  </div>
                  <p class="rr-bubble-time fr-text--sm">
                    {{ formatHeure(msg.dateEnvoi) }}
                    <span
                      v-if="estMien(msg)"
                      class="fr-ml-1v"
                      :class="msg.lu ? 'fr-icon-check-double-line rr-lu' : 'fr-icon-check-line rr-envoye'"
                      :aria-label="msg.lu ? 'Lu' : 'Envoyé'"
                      aria-hidden="false"
                    ></span>
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Barre d'envoi -->
        <footer class="rr-compose-bar" aria-label="Rédiger un message">
          <button
            type="button"
            class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn rr-attach-btn"
            title="Joindre un fichier"
            aria-label="Joindre un fichier"
          >
            <span class="fr-icon-attachment-line" aria-hidden="true"></span>
          </button>

          <div class="rr-compose-input-wrap">
            <textarea
              v-model="nouveauMessage"
              class="rr-compose-input"
              placeholder="Écrivez un message…"
              rows="1"
              :disabled="isSending"
              aria-label="Saisir votre message"
              @keydown="onKeydown"
            ></textarea>
          </div>

          <button
            type="button"
            class="rr-send-btn"
            :class="{ 'rr-send-btn--active': nouveauMessage.trim().length > 0 }"
            :disabled="!nouveauMessage.trim() || isSending"
            :aria-busy="isSending ? 'true' : 'false'"
            aria-label="Envoyer le message"
            title="Envoyer (Entrée)"
            @click="envoyerMessage"
          >
            <span class="fr-icon-send-plane-fill" aria-hidden="true"></span>
          </button>
        </footer>
      </template>
    </main>
  </div>
</template>

<style scoped>
/* ============================================================
   Layout global pleine hauteur
   ============================================================ */
.rr-messagerie-layout {
  display: flex;
  height: calc(100vh - 73px); /* hauteur écran - header DSFR */
  overflow: hidden;
  background: var(--background-default-grey);
}

/* ============================================================
   Sidebar
   ============================================================ */
.rr-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-default-grey);
  background: var(--background-default-grey);
  overflow: hidden;
}

.rr-sidebar__header {
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-default-grey);
}

.rr-sidebar__search {
  padding-top: 0.75rem;
}

.rr-sidebar__list {
  flex: 1;
  overflow-y: auto;
}

.rr-sidebar__empty {
  padding: 2rem 1.5rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-mention-grey);
}

/* ============================================================
   Item conversation
   ============================================================ */
.rr-conv-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--border-default-grey);
  transition: background 0.15s;
}

.rr-conv-item:hover {
  background: var(--background-alt-grey);
}

.rr-conv-item--active {
  background: var(--background-alt-blue-france);
  border-left: 3px solid var(--blue-france-sun-113-625);
}

.rr-conv-item__body {
  flex: 1;
  min-width: 0;
}

.rr-conv-item__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.rr-conv-item__nom {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-title-grey);
}

.rr-conv-item__date {
  flex-shrink: 0;
  color: var(--text-mention-grey);
  font-size: 0.75rem;
}

.rr-conv-item__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.rr-conv-item__preview {
  color: var(--text-mention-grey);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}

/* Badge non lus */
.rr-badge-unread {
  flex-shrink: 0;
  background: var(--blue-france-sun-113-625);
  color: #fff;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  min-width: 18px;
  text-align: center;
}

/* ============================================================
   Avatar
   ============================================================ */
.rr-avatar {
  position: relative;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
  background: var(--background-contrast-grey);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rr-avatar--md {
  width: 42px;
  height: 42px;
}

.rr-avatar--sm {
  width: 30px;
  height: 30px;
}

.rr-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.rr-avatar__initiales {
  font-weight: 700;
  color: var(--blue-france-sun-113-625);
  font-size: 0.9rem;
  border-radius: 50%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rr-avatar__initiales--sm {
  font-size: 0.65rem;
}

.rr-avatar__online {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: #18753c;
  border-radius: 50%;
  border: 2px solid var(--background-default-grey);
}

/* ============================================================
   Panneau chat
   ============================================================ */
.rr-chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--background-default-grey);
}

/* État vide */
.rr-chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-mention-grey);
}

.rr-chat-empty__icon {
  font-size: 3rem;
  opacity: 0.3;
}

/* En-tête chat */
.rr-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid var(--border-default-grey);
  background: var(--background-default-grey);
  flex-shrink: 0;
}

.rr-chat-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rr-chat-header__info p {
  line-height: 1.3;
}

.rr-chat-header__actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rr-status--online {
  color: #18753c;
  font-weight: 600;
}

/* Bouton icône générique */
.rr-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--text-mention-grey) !important;
  transition: background 0.15s, color 0.15s;
}

.rr-icon-btn:hover {
  background: var(--background-alt-grey) !important;
  color: var(--text-title-grey) !important;
}

/* ============================================================
   Zone messages
   ============================================================ */
.rr-messages-zone {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rr-messages-loading,
.rr-messages-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--text-mention-grey);
}

.rr-messages-empty__icon {
  font-size: 2.5rem;
  opacity: 0.25;
}

/* Séparateur de date */
.rr-date-separator {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0 0.75rem;
  color: var(--text-mention-grey);
  font-size: 0.8rem;
  text-align: center;
}

.rr-date-separator::before,
.rr-date-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default-grey);
}

/* Ligne de message */
.rr-message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.rr-message-row--moi {
  flex-direction: row-reverse;
}

.rr-message-avatar {
  flex-shrink: 0;
  margin-bottom: 1.25rem;
}

/* Bulle */
.rr-bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.rr-message-row--moi .rr-bubble-wrapper {
  align-items: flex-end;
}

.rr-bubble {
  padding: 0.6rem 0.9rem;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: break-word;
}

.rr-bubble--autre {
  background: var(--background-alt-grey);
  color: var(--text-label-grey);
  border-bottom-left-radius: 4px;
}

.rr-bubble--moi {
  background: var(--blue-france-sun-113-625);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.rr-bubble-time {
  color: var(--text-mention-grey);
  font-size: 0.72rem;
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.rr-lu { color: var(--blue-france-sun-113-625); }
.rr-envoye { color: var(--text-mention-grey); }

/* ============================================================
   Barre de saisie
   ============================================================ */
.rr-compose-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--border-default-grey);
  background: var(--background-default-grey);
  flex-shrink: 0;
}

.rr-attach-btn {
  flex-shrink: 0;
  color: var(--text-mention-grey) !important;
}

.rr-compose-input-wrap {
  flex: 1;
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
  border-radius: 24px;
  padding: 0.45rem 1rem;
  display: flex;
  align-items: center;
}

.rr-compose-input {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  outline: none;
  font-size: 0.9rem;
  color: var(--text-label-grey);
  font-family: inherit;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
}

.rr-compose-input::placeholder {
  color: var(--text-mention-grey);
}

/* Bouton envoyer */
.rr-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--background-contrast-grey);
  color: var(--text-mention-grey);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, transform 0.1s;
  font-size: 1rem;
}

.rr-send-btn--active {
  background: var(--blue-france-sun-113-625);
  color: #fff;
}

.rr-send-btn--active:hover {
  background: var(--blue-france-850-200);
  transform: scale(1.05);
}

.rr-send-btn:disabled:not(.rr-send-btn--active) {
  cursor: default;
  opacity: 0.5;
}

/* ============================================================
   Spinner
   ============================================================ */
.rr-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================================
   Responsive
   ============================================================ */
@media (max-width: 768px) {
  .rr-messagerie-layout {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 73px);
  }

  .rr-sidebar {
    width: 100%;
    max-height: 260px;
    border-right: none;
    border-bottom: 1px solid var(--border-default-grey);
  }

  .rr-chat-panel {
    min-height: 60vh;
  }

  .rr-messages-zone {
    padding: 1rem;
  }

  .rr-bubble-wrapper {
    max-width: 80%;
  }
}
</style>