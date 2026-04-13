<script setup lang="ts">
definePageMeta({
  middleware: 'super-admin',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { authToken, user: currentUser } = useAuth()

type UserItem = {
  idUtilisateur: string | number
  nom?: string
  prenom?: string
  email: string
  telephone?: string | null
  description?: string | null
  phraseAccroche?: string | null
  region?: string | null
  photoProfil?: string | null
  dateNaissance?: string | null
  dateCreation?: string | null
  statut?: string
  role?: string
}

const users = ref<UserItem[]>([])
const isLoading = ref(false)
const promotingUserId = ref<string | number | null>(null)

const apiError = ref('')
const apiSuccess = ref('')
const search = ref('')

function resetMessages() {
  apiError.value = ''
  apiSuccess.value = ''
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authToken.value}`,
  }
}

function normalizeRole(role: string | undefined | null) {
  return String(role ?? '').toUpperCase().trim()
}

function isSuperAdmin(user: UserItem) {
  return normalizeRole(user.role) === 'SUPER_ADMIN'
}

function isCurrentUser(user: UserItem) {
  return String(user.idUtilisateur) === String(currentUser.value?.idUtilisateur ?? currentUser.value?.id ?? '')
}

async function fetchUsers() {
  isLoading.value = true
  resetMessages()

  try {
    const query = search.value.trim()
      ? `/utilisateurs?search=${encodeURIComponent(search.value.trim())}`
      : '/utilisateurs'

    const response = await $fetch<UserItem[]>(query, {
      baseURL: apiBase,
      method: 'GET',
      headers: getAuthHeaders(),
    })

    users.value = Array.isArray(response) ? response : []
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message

    if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'Impossible de charger les comptes.'
    }
  } finally {
    isLoading.value = false
  }
}

async function promoteToSuperAdmin(user: UserItem) {
  resetMessages()

  if (isSuperAdmin(user)) {
    apiError.value = 'Ce compte est déjà SUPER_ADMIN.'
    return
  }

  const confirmed = window.confirm(
    `Voulez-vous vraiment passer ${user.prenom ?? ''} ${user.nom ?? ''} en SUPER_ADMIN ?`
  )

  if (!confirmed) return

  promotingUserId.value = user.idUtilisateur

  try {
    await $fetch(`/utilisateurs/${user.idUtilisateur}/role`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: {
        role: 'SUPER_ADMIN',
      },
    })

    apiSuccess.value = 'Le compte a bien été passé en SUPER_ADMIN.'

    users.value = users.value.map((item) =>
      String(item.idUtilisateur) === String(user.idUtilisateur)
        ? { ...item, role: 'SUPER_ADMIN' }
        : item
    )
  } catch (error: any) {
    console.error('PROMOTE SUPER ADMIN ERROR', error)

    const message =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La promotion en SUPER_ADMIN a échoué.'
    }
  } finally {
    promotingUserId.value = null
  }
}

onMounted(async () => {
  await fetchUsers()
})
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-lg-10">
        <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
          <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-super-admin">
            Voir le fil d’Ariane
          </button>
          <div id="breadcrumb-super-admin" class="fr-collapse">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Super administration</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Gestion des SUPER_ADMIN</h1>
          <p class="fr-text--lg fr-mb-0">
            Cette page est réservée aux super administrateurs. Elle permet de promouvoir un compte en SUPER_ADMIN.
          </p>
        </header>

        <div v-if="apiError" class="fr-alert fr-alert--error fr-mb-3w" aria-live="assertive">
          <h2 class="fr-alert__title">Erreur</h2>
          <p>{{ apiError }}</p>
        </div>

        <div v-if="apiSuccess" class="fr-alert fr-alert--success fr-mb-3w" aria-live="polite">
          <h2 class="fr-alert__title">Succès</h2>
          <p>{{ apiSuccess }}</p>
        </div>

        <section class="fr-mb-5w">
          <div class="rr-super-admin-toolbar">
            <h2 class="fr-h4 fr-mb-0">Liste des comptes</h2>

            <div class="rr-super-admin-actions">
              <div class="fr-search-bar" id="search-users" role="search">
                <label class="fr-label" for="search-users-input">
                  Rechercher un compte
                </label>
                <input
                  id="search-users-input"
                  v-model="search"
                  class="fr-input"
                  placeholder="Nom, prénom ou e-mail"
                  type="search"
                  name="search-users-input"
                />
                <button class="fr-btn" title="Rechercher" @click="fetchUsers">
                  Rechercher
                </button>
              </div>

              <button type="button" class="fr-btn fr-btn--secondary fr-icon-refresh-line" @click="fetchUsers">
                Actualiser
              </button>
            </div>
          </div>

          <div v-if="isLoading" class="fr-mt-3w">
            <p class="fr-text--sm">Chargement des comptes...</p>
          </div>

          <div v-else class="fr-table fr-table--layout-fixed fr-mt-3w">
            <table>
              <caption>Comptes utilisateurs</caption>
              <thead>
                <tr>
                  <th scope="col">Prénom</th>
                  <th scope="col">Nom</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Rôle</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="users.length === 0">
                  <td colspan="6">Aucun compte trouvé.</td>
                </tr>

                <tr v-for="item in users" :key="item.idUtilisateur">
                  <td>{{ item.prenom || 'Non renseigné' }}</td>
                  <td>{{ item.nom || 'Non renseigné' }}</td>
                  <td>{{ item.email }}</td>
                  <td>
                    <span v-if="isSuperAdmin(item)" class="fr-badge fr-badge--info fr-badge--no-icon">
                      SUPER_ADMIN
                    </span>
                    <span v-else>
                      {{ item.role || 'Non renseigné' }}
                    </span>
                  </td>
                  <td>{{ item.statut || 'Non renseigné' }}</td>
                  <td>
                    <button
                      type="button"
                      class="fr-btn fr-btn--secondary fr-btn--sm fr-icon-arrow-up-line"
                      :disabled="promotingUserId === item.idUtilisateur || isSuperAdmin(item) || isCurrentUser(item)"
                      @click="promoteToSuperAdmin(item)"
                    >
                      {{
                        promotingUserId === item.idUtilisateur
                          ? 'Promotion...'
                          : isSuperAdmin(item)
                            ? 'Déjà SUPER_ADMIN'
                            : isCurrentUser(item)
                              ? 'Compte actuel'
                              : 'Passer en SUPER_ADMIN'
                      }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.rr-super-admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  flex-wrap: wrap;
}

.rr-super-admin-actions {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .rr-super-admin-toolbar {
    align-items: flex-start;
  }

  .rr-super-admin-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>