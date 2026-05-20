<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const _auth = useAuth() as any
const user = _auth.user as Ref<any>
const authToken = computed<string | null>(() =>
  (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)
const userId = computed<number | null>(() => {
  if (!authToken.value) return null
  try {
    const payloadB64 = authToken.value.split('.')[0]
    const payload = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    const id = Number(payload.split(':')[0])
    return Number.isInteger(id) && id > 0 ? id : null
  } catch { return null }
})

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
  idUtilisateur: number
  contenu: string
  dateEnvoi: string
  lu: boolean
}

interface Utilisateur {
  idUtilisateur: number
  prenom: string
  nom: string
  photoProfil?: string
  email?: string
}

// ---------------------------------------------------------------------------
// État conversations
// ---------------------------------------------------------------------------
const conversations = ref<Conversation[]>([])
const conversationActive = ref<Conversation | null>(null)
const messages = ref<Message[]>([])
const recherche = ref('')
const nouveauMessage = ref('')

const isLoadingConversations = ref(false)
const isLoadingMessages = ref(false)
const isSending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// ---------------------------------------------------------------------------
// Nouvelle conversation
// ---------------------------------------------------------------------------
const showNouvelleConv = ref(false)
const rechercheUtilisateur = ref('')
const resultatsUtilisateurs = ref<Utilisateur[]>([])
const isSearchingUsers = ref(false)
const isCreatingConv = ref(false)
const erreurNouvelleConv = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

function ouvrirNouvelleConv() {
  showNouvelleConv.value = true
  rechercheUtilisateur.value = ''
  resultatsUtilisateurs.value = []
  erreurNouvelleConv.value = ''
}

function fermerNouvelleConv() {
  showNouvelleConv.value = false
  rechercheUtilisateur.value = ''
  resultatsUtilisateurs.value = []
  erreurNouvelleConv.value = ''
}

function onRechercheUtilisateur() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!rechercheUtilisateur.value.trim() || rechercheUtilisateur.value.trim().length < 2) {
    resultatsUtilisateurs.value = []
    return
  }
  searchTimeout = setTimeout(() => { searchUsers() }, 300)
}

async function searchUsers() {
  isSearchingUsers.value = true
  try {
    const data = await $fetch<Utilisateur[]>(
      `/utilisateurs/search?q=${encodeURIComponent(rechercheUtilisateur.value.trim())}`,
      { baseURL: apiBase, headers: { Authorization: `Bearer ${authToken.value}` } },
    )
    resultatsUtilisateurs.value = data.filter((u) => u.idUtilisateur !== userId.value)
  } catch {
    resultatsUtilisateurs.value = []
  } finally {
    isSearchingUsers.value = false
  }
}

async function demarrerConversation(interlocuteur: Utilisateur) {
  isCreatingConv.value = true
  erreurNouvelleConv.value = ''
  try {
    // Si une conversation existe déjà → l'ouvrir directement
    const existante = conversations.value.find(
      (c) => c.interlocuteur.idUtilisateur === interlocuteur.idUtilisateur,
    )
    if (existante) {
      fermerNouvelleConv()
      await ouvrirConversation(existante)
      return
    }

    // Créer la conversation
    const data = await $fetch<{ idConversation: number }>('/messagerie/conversations', {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: { participantIds: [userId.value, interlocuteur.idUtilisateur] },
    })

    const nouvelleConv: Conversation = {
      idConversation: data.idConversation,
      interlocuteur: {
        idUtilisateur: interlocuteur.idUtilisateur,
        prenom: interlocuteur.prenom,
        nom: interlocuteur.nom,
        photoProfil: interlocuteur.photoProfil,
      },
      nonLus: 0,
      enLigne: false,
    }
    conversations.value.unshift(nouvelleConv)
    fermerNouvelleConv()
    await ouvrirConversation(nouvelleConv)
  } catch {
    erreurNouvelleConv.value = 'Impossible de créer la conversation. Veuillez réessayer.'
  } finally {
    isCreatingConv.value = false
  }
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------
async function fetchConversations() {
  isLoadingConversations.value = true
  if (!userId.value) {
    isLoadingConversations.value = false
    return
  }
  try {
    const raw = await $fetch<any[]>(`/messagerie/conversations/utilisateur/${userId.value}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    conversations.value = raw.map((conv) => {
      const autre = conv.participants?.find(
        (p: any) => p.utilisateur?.idUtilisateur !== userId.value
      )?.utilisateur ?? {}
      return {
        idConversation: conv.idConversation,
        interlocuteur: {
          idUtilisateur: autre.idUtilisateur,
          prenom: autre.prenom ?? '',
          nom: autre.nom ?? '',
          photoProfil: autre.photoProfil ?? undefined,
        },
        dernierMessage: conv.dernierMessage?.contenu ?? undefined,
        dateLastMessage: conv.dernierMessage?.dateEnvoi ?? undefined,
        nonLus: 0,
        enLigne: false,
      }
    })
  } catch {
    conversations.value = []
  } finally {
    isLoadingConversations.value = false
  }
}

async function ouvrirConversation(conv: Conversation) {
  conversationActive.value = conv
  messages.value = []
  isLoadingMessages.value = true
  try {
    const data = await $fetch<Message[]>(`/messagerie/conversations/${conv.idConversation}/messages`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    messages.value = data
    if (conv.nonLus > 0) {
      conv.nonLus = 0
      await $fetch(`/messagerie/conversations/${conv.idConversation}/lu/${userId.value}`, {
        baseURL: apiBase, method: 'PATCH',
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
// Envoi
// ---------------------------------------------------------------------------
async function envoyerMessage() {
  const texte = nouveauMessage.value.trim()
  if (!texte || !conversationActive.value || isSending.value) return

  isSending.value = true
  const optimiste: Message = {
    idMessage: Date.now(),
    idUtilisateur: userId.value as number,
    contenu: texte,
    dateEnvoi: new Date().toISOString(),
    lu: false,
  }
  messages.value.push(optimiste)
  nouveauMessage.value = ''
  await nextTick()
  scrollToBottom()

  try {
    const data = await $fetch<Message>(
      `/messagerie/conversations/${conversationActive.value.idConversation}/messages`,
      {
        baseURL: apiBase, method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: { contenu: texte },
      },
    )
    const idx = messages.value.findIndex((m) => m.idMessage === optimiste.idMessage)
    if (idx !== -1) messages.value[idx] = data
    const conv = conversations.value.find((c) => c.idConversation === conversationActive.value?.idConversation)
    if (conv) { conv.dernierMessage = texte; conv.dateLastMessage = data.dateEnvoi }
  } catch {
    messages.value = messages.value.filter((m) => m.idMessage !== optimiste.idMessage)
    nouveauMessage.value = texte
  } finally {
    isSending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerMessage() }
}

// ---------------------------------------------------------------------------
// Menu actions (dropdown "...")
// ---------------------------------------------------------------------------
const menuActionsOuvert = ref(false)
const showSignalModal = ref(false)
const motifSignal = ref('')
const signalSucces = ref(false)
const signalErreur = ref('')
const isSendingSignal = ref(false)
const isDeletingConv = ref(false)

function toggleMenuActions() { menuActionsOuvert.value = !menuActionsOuvert.value }
function fermerMenuActions() { menuActionsOuvert.value = false }

async function supprimerConversation() {
  if (!conversationActive.value) return
  if (!confirm(`Quitter et supprimer la conversation avec ${conversationActive.value.interlocuteur.prenom} ${conversationActive.value.interlocuteur.nom} ?`)) return
  isDeletingConv.value = true
  fermerMenuActions()
  try {
    await $fetch(`/messagerie/conversations/${conversationActive.value.idConversation}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    conversations.value = conversations.value.filter(
      (c) => c.idConversation !== conversationActive.value?.idConversation,
    )
    conversationActive.value = null
    messages.value = []
  } catch {
    // erreur silencieuse
  } finally {
    isDeletingConv.value = false
  }
}

function ouvrirSignalModal() {
  fermerMenuActions()
  motifSignal.value = ''
  signalSucces.value = false
  signalErreur.value = ''
  showSignalModal.value = true
}

async function envoyerSignal() {
  const motif = motifSignal.value.trim()
  if (!motif || !userId.value || !conversationActive.value) return
  isSendingSignal.value = true
  try {
    await $fetch('/signalements', {
      baseURL: apiBase,
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idUtilisateur: userId.value,
        typeSignalement: 'COMMENTAIRE',
        motif: `[Conversation #${conversationActive.value.idConversation} – ${conversationActive.value.interlocuteur.prenom} ${conversationActive.value.interlocuteur.nom}] ${motif}`,
      },
    })
    signalSucces.value = true
    motifSignal.value = ''
    setTimeout(() => { showSignalModal.value = false; signalSucces.value = false }, 2500)
  } catch {
    signalErreur.value = 'Impossible d\'envoyer le signalement.'
  } finally {
    isSendingSignal.value = false
  }
}

// ---------------------------------------------------------------------------
// Suppression d'un message (clic sur son propre message)
// ---------------------------------------------------------------------------
const messageMenuId = ref<number | null>(null)

async function supprimerMessage(idMessage: number) {
  try {
    await $fetch(`/messagerie/messages/${idMessage}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    messages.value = messages.value.filter((m) => m.idMessage !== idMessage)
    messageMenuId.value = null
  } catch {
    messageMenuId.value = null
  }
}

function scrollToBottom() {
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

// ---------------------------------------------------------------------------
// Filtrage + groupement
// ---------------------------------------------------------------------------
const conversationsFiltrees = computed(() => {
  if (!recherche.value.trim()) return conversations.value
  const q = recherche.value.toLowerCase()
  return conversations.value.filter((c) => {
    const nom = `${c.interlocuteur.prenom} ${c.interlocuteur.nom}`.toLowerCase()
    return nom.includes(q) || c.dernierMessage?.toLowerCase().includes(q)
  })
})

const messagesGroupes = computed(() => {
  const groupes: { label: string; messages: Message[] }[] = []
  let labelCourant = ''
  for (const msg of messages.value) {
    const label = labelDate(msg.dateEnvoi)
    if (label !== labelCourant) { groupes.push({ label, messages: [] }); labelCourant = label }
    groupes[groupes.length - 1]?.messages.push(msg)
  }
  return groupes
})

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
function labelDate(d: string) {
  const date = new Date(d), now = new Date(), hier = new Date(now)
  hier.setDate(hier.getDate() - 1)
  if (date.toDateString() === now.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === hier.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatHeure(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDateSidebar(d?: string) {
  if (!d) return ''
  const date = new Date(d), now = new Date(), hier = new Date(now)
  hier.setDate(hier.getDate() - 1)
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (date.toDateString() === hier.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function initiales(p: string, n: string) { return `${p?.[0] ?? ''}${n?.[0] ?? ''}`.toUpperCase() }
function estMien(msg: Message) { return msg.idUtilisateur === userId.value }

onMounted(async () => {
  await fetchConversations()
  const premiere = conversations.value[0]
  if (premiere) await ouvrirConversation(premiere)
})
</script>

<template>
  <div class="rr-messagerie-layout">

    <!-- SIDEBAR -->
    <aside class="rr-sidebar" aria-label="Conversations">

      <!-- En-tête avec bouton + -->
      <div class="rr-sidebar__header">
        <div class="rr-sidebar__header-row">
          <h1 class="fr-h5 fr-mb-0">
            <span class="fr-icon-chat-3-line fr-mr-1w" aria-hidden="true"></span>
            Messagerie
          </h1>
          <button
            type="button"
            class="rr-btn-new-conv"
            title="Nouvelle conversation"
            aria-label="Démarrer une nouvelle conversation"
            @click="ouvrirNouvelleConv"
          >
            <span class="fr-icon-add-circle-line" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <!-- Panneau recherche utilisateur -->
      <div v-if="showNouvelleConv" class="rr-new-conv-panel">
        <div class="rr-new-conv-panel__header">
          <p class="fr-text--bold fr-text--sm fr-mb-0">
            <span class="fr-icon-user-add-line fr-mr-1v" aria-hidden="true"></span>
            Nouvelle conversation
          </p>
          <button
            type="button"
            class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-only"
            aria-label="Fermer"
            @click="fermerNouvelleConv"
          >
            <span class="fr-icon-close-line" aria-hidden="true"></span>
          </button>
        </div>

        <div class="fr-px-2w fr-pb-1w">
          <div class="fr-search-bar fr-search-bar--sm">
            <label class="fr-label" for="search-user">
              <span class="fr-sr-only">Rechercher un utilisateur</span>
            </label>
            <input
              id="search-user"
              v-model="rechercheUtilisateur"
              class="fr-input"
              type="search"
              placeholder="Prénom, nom…"
              autocomplete="off"
              @input="onRechercheUtilisateur"
            />
            <button class="fr-btn fr-btn--sm" type="button">
              <span class="fr-icon-search-line" aria-hidden="true"></span>
            </button>
          </div>
          <p class="fr-hint-text fr-mt-1v fr-mb-0" style="font-size:0.72rem">
            Saisir au moins 2 caractères
          </p>
        </div>

        <div class="rr-new-conv-results">
          <div v-if="isSearchingUsers" class="rr-new-conv-state">
            <span class="fr-icon-refresh-line rr-spin fr-mr-1v" aria-hidden="true"></span>
            <span class="fr-text--sm fr-text--grey">Recherche…</span>
          </div>

          <div
            v-else-if="rechercheUtilisateur.trim().length >= 2 && resultatsUtilisateurs.length === 0 && !isSearchingUsers"
            class="rr-new-conv-state"
          >
            <span class="fr-icon-user-line fr-mr-1v" aria-hidden="true"></span>
            <span class="fr-text--sm fr-text--grey">Aucun utilisateur trouvé</span>
          </div>

          <button
            v-for="u in resultatsUtilisateurs"
            :key="u.idUtilisateur"
            type="button"
            class="rr-user-result"
            :disabled="isCreatingConv"
            @click="demarrerConversation(u)"
          >
            <div class="rr-avatar rr-avatar--sm">
              <img v-if="u.photoProfil" :src="`${apiBase}${u.photoProfil}`" :alt="`Photo de ${u.prenom}`" />
              <span v-else class="rr-avatar__initiales rr-avatar__initiales--sm">
                {{ initiales(u.prenom, u.nom) }}
              </span>
            </div>
            <div class="rr-user-result__info">
              <span class="fr-text--bold fr-text--sm">{{ u.prenom }} {{ u.nom }}</span>
              <span v-if="u.email" class="rr-user-result__email">{{ u.email }}</span>
            </div>
            <span v-if="isCreatingConv" class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
            <span v-else class="fr-icon-arrow-right-line rr-user-result__arrow" aria-hidden="true"></span>
          </button>
        </div>

        <div v-if="erreurNouvelleConv" class="fr-alert fr-alert--error fr-alert--sm fr-mx-2w fr-mb-2w">
          <p>{{ erreurNouvelleConv }}</p>
        </div>
      </div>

      <!-- Recherche conversations existantes -->
      <div v-if="!showNouvelleConv" class="rr-sidebar__search fr-px-2w fr-pb-2w">
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

      <!-- Liste conversations -->
      <div v-if="!showNouvelleConv" class="rr-sidebar__list" role="list">
        <div v-if="isLoadingConversations" class="rr-sidebar__empty">
          <span class="fr-icon-refresh-line rr-spin fr-mr-1w" aria-hidden="true"></span>
          <span class="fr-text--sm fr-text--grey">Chargement…</span>
        </div>

        <div v-else-if="conversationsFiltrees.length === 0" class="rr-sidebar__empty">
          <div class="rr-sidebar__empty-content">
            <span class="fr-icon-chat-3-line fr-mb-1w" aria-hidden="true" style="font-size:1.5rem;opacity:0.3"></span>
            <p class="fr-text--sm fr-text--grey fr-mb-2w">Aucune conversation</p>
            <button
              type="button"
              class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-left fr-icon-add-circle-line"
              @click="ouvrirNouvelleConv"
            >
              Démarrer une conversation
            </button>
          </div>
        </div>

        <button
          v-for="conv in conversationsFiltrees"
          :key="conv.idConversation"
          type="button"
          class="rr-conv-item"
          :class="{ 'rr-conv-item--active': conversationActive?.idConversation === conv.idConversation }"
          :aria-current="conversationActive?.idConversation === conv.idConversation ? 'true' : undefined"
          role="listitem"
          @click="ouvrirConversation(conv)"
        >
          <div class="rr-avatar rr-avatar--md">
            <img v-if="conv.interlocuteur.photoProfil" :src="`${apiBase}${conv.interlocuteur.photoProfil}`" :alt="`Photo de ${conv.interlocuteur.prenom}`" />
            <span v-else class="rr-avatar__initiales">{{ initiales(conv.interlocuteur.prenom, conv.interlocuteur.nom) }}</span>
            <span v-if="conv.enLigne" class="rr-avatar__online" aria-label="En ligne"></span>
          </div>
          <div class="rr-conv-item__body">
            <div class="rr-conv-item__top">
              <span class="rr-conv-item__nom fr-text--bold">{{ conv.interlocuteur.prenom }} {{ conv.interlocuteur.nom }}</span>
              <span class="rr-conv-item__date fr-text--sm">{{ formatDateSidebar(conv.dateLastMessage) }}</span>
            </div>
            <div class="rr-conv-item__bottom">
              <span class="rr-conv-item__preview fr-text--sm">{{ conv.dernierMessage || 'Aucun message' }}</span>
              <span v-if="conv.nonLus > 0" class="rr-badge-unread" :aria-label="`${conv.nonLus} messages non lus`">
                {{ conv.nonLus > 9 ? '9+' : conv.nonLus }}
              </span>
            </div>
          </div>
        </button>
      </div>
    </aside>

    <!-- PANNEAU CHAT -->
    <main id="contenu" class="rr-chat-panel" role="main">

      <div v-if="!conversationActive" class="rr-chat-empty">
        <span class="fr-icon-chat-3-line rr-chat-empty__icon" aria-hidden="true"></span>
        <p class="fr-h5 fr-mb-1w">Sélectionnez une conversation</p>
        <p class="fr-text--sm fr-text--grey fr-mb-3w">
          Choisissez une conversation dans la liste ou démarrez-en une nouvelle.
        </p>
        <button
          type="button"
          class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-add-circle-line"
          @click="ouvrirNouvelleConv"
        >
          Nouvelle conversation
        </button>
      </div>

      <template v-else>
        <header class="rr-chat-header">
          <div class="rr-chat-header__left">
            <div class="rr-avatar rr-avatar--md">
              <img v-if="conversationActive.interlocuteur.photoProfil" :src="`${apiBase}${conversationActive.interlocuteur.photoProfil}`" :alt="`Photo de ${conversationActive.interlocuteur.prenom}`" />
              <span v-else class="rr-avatar__initiales">{{ initiales(conversationActive.interlocuteur.prenom, conversationActive.interlocuteur.nom) }}</span>
              <span v-if="conversationActive.enLigne" class="rr-avatar__online"></span>
            </div>
            <div class="rr-chat-header__info">
              <p class="fr-text--bold fr-mb-0">{{ conversationActive.interlocuteur.prenom }} {{ conversationActive.interlocuteur.nom }}</p>
              <p class="fr-text--sm fr-mb-0" :class="conversationActive.enLigne ? 'rr-status--online' : 'fr-text--grey'">
                {{ conversationActive.enLigne ? 'En ligne' : 'Hors ligne' }}
              </p>
            </div>
          </div>
          <div class="rr-chat-header__actions" style="position:relative;">
            <button
              type="button"
              class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn"
              title="Supprimer la conversation"
              aria-label="Supprimer la conversation"
              :disabled="isDeletingConv"
              @click="supprimerConversation"
            >
              <span class="fr-icon-delete-line" aria-hidden="true"></span>
            </button>
            <div style="position:relative;">
              <button
                type="button"
                class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn"
                title="Plus d'options"
                aria-label="Plus d'options"
                @click="toggleMenuActions"
              >
                <span class="fr-icon-more-line" aria-hidden="true"></span>
              </button>
              <div v-if="menuActionsOuvert" class="rr-dropdown-menu" role="menu">
                <button type="button" class="rr-dropdown-item rr-dropdown-item--danger" role="menuitem" @click="supprimerConversation">
                  <span class="fr-icon-delete-line fr-mr-1v" aria-hidden="true"></span>
                  Supprimer la conversation
                </button>
                <button type="button" class="rr-dropdown-item" role="menuitem" @click="ouvrirSignalModal">
                  <span class="fr-icon-flag-line fr-mr-1v" aria-hidden="true"></span>
                  Signaler la conversation
                </button>
              </div>
            </div>
            <div v-if="menuActionsOuvert" class="rr-dropdown-backdrop" @click="fermerMenuActions"></div>
          </div>
        </header>

        <div ref="messagesContainer" class="rr-messages-zone" aria-label="Messages" aria-live="polite">
          <div v-if="isLoadingMessages" class="rr-messages-loading">
            <span class="fr-icon-refresh-line rr-spin fr-mr-1w" aria-hidden="true"></span>
            Chargement des messages…
          </div>

          <div v-else-if="messages.length === 0" class="rr-messages-empty">
            <span class="fr-icon-chat-3-line rr-messages-empty__icon" aria-hidden="true"></span>
            <p class="fr-text--sm fr-text--grey fr-mb-0">Aucun message pour l'instant. Dites bonjour !</p>
          </div>

          <template v-else>
            <div v-for="groupe in messagesGroupes" :key="groupe.label">
              <div class="rr-date-separator"><span>{{ groupe.label }}</span></div>
              <div
                v-for="msg in groupe.messages"
                :key="msg.idMessage"
                class="rr-message-row"
                :class="estMien(msg) ? 'rr-message-row--moi' : 'rr-message-row--autre'"
              >
                <div v-if="!estMien(msg)" class="rr-avatar rr-avatar--sm rr-message-avatar" aria-hidden="true">
                  <img v-if="conversationActive.interlocuteur.photoProfil" :src="`${apiBase}${conversationActive.interlocuteur.photoProfil}`" alt="" />
                  <span v-else class="rr-avatar__initiales rr-avatar__initiales--sm">{{ initiales(conversationActive.interlocuteur.prenom, conversationActive.interlocuteur.nom) }}</span>
                </div>
                <div class="rr-bubble-wrapper" :class="{ 'rr-bubble-wrapper--interactive': estMien(msg) }">
                  <div
                    class="rr-bubble"
                    :class="[estMien(msg) ? 'rr-bubble--moi' : 'rr-bubble--autre', { 'rr-bubble--selected': messageMenuId === msg.idMessage }]"
                    @click="estMien(msg) ? (messageMenuId = messageMenuId === msg.idMessage ? null : msg.idMessage) : null"
                  >{{ msg.contenu }}</div>
                  <div v-if="estMien(msg) && messageMenuId === msg.idMessage" class="rr-msg-actions">
                    <button
                      type="button"
                      class="rr-msg-delete-btn"
                      @click.stop="supprimerMessage(msg.idMessage)"
                    >
                      <span class="fr-icon-delete-line fr-mr-1v" aria-hidden="true"></span>
                      Supprimer
                    </button>
                  </div>
                  <p class="rr-bubble-time fr-text--sm">
                    {{ formatHeure(msg.dateEnvoi) }}
                    <span v-if="estMien(msg)" class="fr-ml-1v" :class="msg.lu ? 'fr-icon-check-double-line rr-lu' : 'fr-icon-check-line rr-envoye'" :aria-label="msg.lu ? 'Lu' : 'Envoyé'" aria-hidden="false"></span>
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <footer class="rr-compose-bar" aria-label="Rédiger un message">
          <button type="button" class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only rr-icon-btn rr-attach-btn" title="Joindre un fichier" aria-label="Joindre un fichier">
            <span class="fr-icon-attachment-line" aria-hidden="true"></span>
          </button>
          <div class="rr-compose-input-wrap">
            <textarea v-model="nouveauMessage" class="rr-compose-input" placeholder="Écrivez un message…" rows="1" :disabled="isSending" aria-label="Saisir votre message" @keydown="onKeydown"></textarea>
          </div>
          <button type="button" class="rr-send-btn" :class="{ 'rr-send-btn--active': nouveauMessage.trim().length > 0 }" :disabled="!nouveauMessage.trim() || isSending" :aria-busy="isSending ? 'true' : 'false'" aria-label="Envoyer le message" @click="envoyerMessage">
            <span class="fr-icon-send-plane-fill" aria-hidden="true"></span>
          </button>
        </footer>
      </template>
    </main>
  </div>

  <!-- Modal signalement conversation -->
  <div v-if="showSignalModal" class="rr-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="signal-title" @click.self="showSignalModal = false">
    <div class="rr-modal">
      <div class="rr-modal__header">
        <h2 id="signal-title" class="fr-h5 fr-mb-0">
          <span class="fr-icon-flag-line fr-mr-1w" aria-hidden="true"></span>
          Signaler la conversation
        </h2>
        <button type="button" class="fr-btn fr-btn--tertiary-no-outline fr-btn--icon-only" aria-label="Fermer" @click="showSignalModal = false">
          <span class="fr-icon-close-line" aria-hidden="true"></span>
        </button>
      </div>

      <div class="rr-modal__body">
        <div v-if="signalSucces" class="fr-alert fr-alert--success fr-alert--sm">
          <p>Signalement envoyé. Un modérateur va examiner votre demande.</p>
        </div>
        <template v-else>
          <p class="fr-text--sm fr-text--grey fr-mb-3w">
            Décrivez le motif du signalement. Un modérateur examinera votre demande.
          </p>
          <div class="fr-input-group" :class="{ 'fr-input-group--error': !!signalErreur }">
            <label class="fr-label" for="motif-signal">
              Motif <span class="fr-text--grey">(obligatoire)</span>
            </label>
            <textarea
              id="motif-signal"
              v-model="motifSignal"
              class="fr-input"
              rows="4"
              placeholder="Décrivez le problème…"
              :disabled="isSendingSignal"
            ></textarea>
            <p v-if="signalErreur" class="fr-error-text">{{ signalErreur }}</p>
          </div>
          <div class="fr-btns-group fr-btns-group--inline fr-mt-3w">
            <button
              type="button"
              class="fr-btn fr-btn--sm"
              :disabled="!motifSignal.trim() || isSendingSignal"
              @click="envoyerSignal"
            >
              {{ isSendingSignal ? 'Envoi…' : 'Envoyer le signalement' }}
            </button>
            <button type="button" class="fr-btn fr-btn--secondary fr-btn--sm" @click="showSignalModal = false">
              Annuler
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rr-messagerie-layout {
  display: flex;
  height: calc(100vh - 73px);
  overflow: hidden;
  background: var(--background-default-grey);
}

/* Sidebar */
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
  flex-shrink: 0;
}

.rr-sidebar__header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Bouton nouvelle conversation */
.rr-btn-new-conv {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--background-alt-blue-france);
  color: var(--blue-france-sun-113-625);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: background 0.15s, transform 0.1s;
  flex-shrink: 0;
}

.rr-btn-new-conv:hover {
  background: var(--blue-france-sun-113-625);
  color: #fff;
  transform: scale(1.08);
}

/* Panneau nouvelle conversation */
.rr-new-conv-panel {
  border-bottom: 2px solid var(--blue-france-sun-113-625);
  background: var(--background-alt-blue-france);
  flex-shrink: 0;
}

.rr-new-conv-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem 0.5rem;
  color: var(--blue-france-sun-113-625);
}

.rr-new-conv-results {
  max-height: 220px;
  overflow-y: auto;
  background: var(--background-default-grey);
}

.rr-new-conv-state {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-mention-grey);
}

/* Résultat utilisateur */
.rr-user-result {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--border-default-grey);
  transition: background 0.15s;
}

.rr-user-result:last-child { border-bottom: none; }
.rr-user-result:hover:not(:disabled) { background: var(--background-alt-blue-france); }
.rr-user-result:disabled { opacity: 0.6; cursor: wait; }

.rr-user-result__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.rr-user-result__email {
  color: var(--text-mention-grey);
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rr-user-result__arrow {
  color: var(--text-mention-grey);
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* Sidebar search + list */
.rr-sidebar__search { padding-top: 0.75rem; flex-shrink: 0; }
.rr-sidebar__list { flex: 1; overflow-y: auto; }

.rr-sidebar__empty {
  padding: 2rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-mention-grey);
}

.rr-sidebar__empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

/* Items conversation */
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

.rr-conv-item:hover { background: var(--background-alt-grey); }
.rr-conv-item--active { background: var(--background-alt-blue-france); border-left: 3px solid var(--blue-france-sun-113-625); }
.rr-conv-item__body { flex: 1; min-width: 0; }

.rr-conv-item__top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.2rem; }
.rr-conv-item__nom { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-title-grey); }
.rr-conv-item__date { flex-shrink: 0; color: var(--text-mention-grey); font-size: 0.75rem; }
.rr-conv-item__bottom { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.rr-conv-item__preview { color: var(--text-mention-grey); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.8rem; }

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

/* Avatar */
.rr-avatar { position: relative; border-radius: 50%; overflow: visible; flex-shrink: 0; background: var(--background-contrast-grey); display: flex; align-items: center; justify-content: center; }
.rr-avatar--md { width: 42px; height: 42px; }
.rr-avatar--sm { width: 30px; height: 30px; }
.rr-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.rr-avatar__initiales { font-weight: 700; color: var(--blue-france-sun-113-625); font-size: 0.9rem; border-radius: 50%; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.rr-avatar__initiales--sm { font-size: 0.65rem; }
.rr-avatar__online { position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px; background: #18753c; border-radius: 50%; border: 2px solid var(--background-default-grey); }

/* Panneau chat */
.rr-chat-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--background-default-grey); }

.rr-chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; color: var(--text-mention-grey); }
.rr-chat-empty__icon { font-size: 3rem; opacity: 0.3; }

.rr-chat-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.5rem; border-bottom: 1px solid var(--border-default-grey); background: var(--background-default-grey); flex-shrink: 0; }
.rr-chat-header__left { display: flex; align-items: center; gap: 0.75rem; }
.rr-chat-header__info p { line-height: 1.3; }
.rr-chat-header__actions { display: flex; align-items: center; gap: 0.25rem; }
.rr-status--online { color: #18753c; font-weight: 600; }

.rr-icon-btn { width: 36px; height: 36px; border-radius: 50%; color: var(--text-mention-grey) !important; transition: background 0.15s, color 0.15s; }
.rr-icon-btn:hover { background: var(--background-alt-grey) !important; color: var(--text-title-grey) !important; }

/* Messages */
.rr-messages-zone { flex: 1; overflow-y: auto; padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 0.25rem; }
.rr-messages-loading, .rr-messages-empty { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; color: var(--text-mention-grey); }
.rr-messages-empty__icon { font-size: 2.5rem; opacity: 0.25; }

.rr-date-separator { display: flex; align-items: center; gap: 1rem; margin: 1.25rem 0 0.75rem; color: var(--text-mention-grey); font-size: 0.8rem; text-align: center; }
.rr-date-separator::before, .rr-date-separator::after { content: ''; flex: 1; height: 1px; background: var(--border-default-grey); }

.rr-message-row { display: flex; align-items: flex-end; gap: 0.5rem; margin-bottom: 0.35rem; }
.rr-message-row--moi { flex-direction: row-reverse; }
.rr-message-avatar { flex-shrink: 0; margin-bottom: 1.25rem; }

.rr-bubble-wrapper { display: flex; flex-direction: column; max-width: 60%; }
.rr-message-row--moi .rr-bubble-wrapper { align-items: flex-end; }

.rr-bubble { padding: 0.6rem 0.9rem; border-radius: 18px; font-size: 0.9rem; line-height: 1.5; word-break: break-word; }
.rr-bubble--autre { background: var(--background-alt-grey); color: var(--text-label-grey); border-bottom-left-radius: 4px; }
.rr-bubble--moi { background: var(--blue-france-sun-113-625); color: #fff; border-bottom-right-radius: 4px; }

.rr-bubble-time { color: var(--text-mention-grey); font-size: 0.72rem; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.2rem; }
.rr-lu { color: var(--blue-france-sun-113-625); }
.rr-envoye { color: var(--text-mention-grey); }

/* Compose bar */
.rr-compose-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border-default-grey); background: var(--background-default-grey); flex-shrink: 0; }
.rr-attach-btn { flex-shrink: 0; color: var(--text-mention-grey) !important; }

.rr-compose-input-wrap { flex: 1; background: var(--background-alt-grey); border: 1px solid var(--border-default-grey); border-radius: 24px; padding: 0.45rem 1rem; display: flex; align-items: center; }
.rr-compose-input { width: 100%; border: none; background: transparent; resize: none; outline: none; font-size: 0.9rem; color: var(--text-label-grey); font-family: inherit; max-height: 120px; overflow-y: auto; line-height: 1.5; }
.rr-compose-input::placeholder { color: var(--text-mention-grey); }

.rr-send-btn { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--background-contrast-grey); color: var(--text-mention-grey); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s, color 0.15s, transform 0.1s; font-size: 1rem; }
.rr-send-btn--active { background: var(--blue-france-sun-113-625); color: #fff; }
.rr-send-btn--active:hover { background: var(--blue-france-850-200); transform: scale(1.05); }
.rr-send-btn:disabled:not(.rr-send-btn--active) { cursor: default; opacity: 0.5; }

/* Dropdown menu */
.rr-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--background-default-grey);
  border: 1px solid var(--border-default-grey);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 210px;
  z-index: 100;
  overflow: hidden;
}
.rr-dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}
.rr-dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-label-grey);
  text-align: left;
  transition: background 0.12s;
}
.rr-dropdown-item:hover { background: var(--background-alt-grey); }
.rr-dropdown-item--danger { color: var(--error-425-625); }
.rr-dropdown-item--danger:hover { background: #fff0f0; }

/* Message suppression */
.rr-bubble--selected { opacity: 0.85; }
.rr-msg-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.25rem;
}
.rr-msg-delete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--error-425-625);
  background: none;
  border: 1px solid var(--error-425-625);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  transition: background 0.12s;
}
.rr-msg-delete-btn:hover { background: #fff0f0; }

/* Modal signalement */
.rr-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.rr-modal {
  background: var(--background-default-grey);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  overflow: hidden;
}
.rr-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-default-grey);
}
.rr-modal__body { padding: 1.5rem; }

/* Spinner */
.rr-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 768px) {
  .rr-messagerie-layout { flex-direction: column; height: auto; min-height: calc(100vh - 73px); }
  .rr-sidebar { width: 100%; max-height: 320px; border-right: none; border-bottom: 1px solid var(--border-default-grey); }
  .rr-chat-panel { min-height: 60vh; }
  .rr-messages-zone { padding: 1rem; }
  .rr-bubble-wrapper { max-width: 80%; }
}
</style>