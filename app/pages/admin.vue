<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
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
const isSubmitting = ref(false)
const deletingUserId = ref<string | number | null>(null)

const apiError = ref('')
const apiSuccess = ref('')

const showForm = ref(false)
const editingUserId = ref<string | number | null>(null)

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'UTILISATEUR',
  statut: 'ACTIF',
})

const errors = reactive({
  prenom: '',
  nom: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  statut: '',
})

const isEditMode = computed(() => editingUserId.value !== null)

const currentRole = computed(() => {
  return String(currentUser.value?.role ?? '').toUpperCase().trim()
})

function normalizeRole(role: string | undefined | null) {
  return String(role ?? '').toUpperCase().trim()
}

function isSuperAdmin(user: UserItem) {
  return normalizeRole(user.role) === 'SUPER_ADMIN'
}

function isCurrentUser(user: UserItem) {
  return String(user.idUtilisateur) === String(currentUser.value?.idUtilisateur ?? currentUser.value?.id ?? '')
}

function canManageUser(targetUser: UserItem) {
  if (isCurrentUser(targetUser)) {
    return false
  }

  if (currentRole.value === 'SUPER_ADMIN') {
    return true
  }

  if (currentRole.value === 'ADMINISTRATEUR' && isSuperAdmin(targetUser)) {
    return false
  }

  return true
}

function getManageErrorMessage(targetUser: UserItem) {
  if (isCurrentUser(targetUser)) {
    return 'Vous ne pouvez pas modifier ou supprimer votre propre compte depuis cette page.'
  }

  if (currentRole.value === 'ADMINISTRATEUR' && isSuperAdmin(targetUser)) {
    return 'Un administrateur ne peut pas modifier ou supprimer un compte SUPER_ADMIN.'
  }

  return 'Action non autorisée.'
}

function resetMessages() {
  apiError.value = ''
  apiSuccess.value = ''
}

function resetErrors() {
  errors.prenom = ''
  errors.nom = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.role = ''
  errors.statut = ''
}

function resetForm() {
  form.prenom = ''
  form.nom = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  form.role = 'UTILISATEUR'
  form.statut = 'ACTIF'
  editingUserId.value = null
  showForm.value = false
  resetErrors()
}

function validateForm() {
  resetErrors()
  let isValid = true

  if (!form.prenom.trim()) {
    errors.prenom = 'Veuillez renseigner le prénom.'
    isValid = false
  }

  if (!form.nom.trim()) {
    errors.nom = 'Veuillez renseigner le nom.'
    isValid = false
  }

  if (!form.email.trim()) {
    errors.email = 'Veuillez renseigner l’adresse e-mail.'
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Veuillez saisir une adresse e-mail valide.'
      isValid = false
    }
  }

  if (!form.role.trim()) {
    errors.role = 'Veuillez sélectionner un rôle.'
    isValid = false
  }

  if (!form.statut.trim()) {
    errors.statut = 'Veuillez sélectionner un statut.'
    isValid = false
  }

  if (!isEditMode.value) {
    if (!form.password.trim()) {
      errors.password = 'Veuillez renseigner le mot de passe.'
      isValid = false
    } else if (form.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.'
      isValid = false
    }

    if (!form.confirmPassword.trim()) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe.'
      isValid = false
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.'
      isValid = false
    }
  }

  return isValid
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${authToken.value}`,
  }
}

async function fetchUsers() {
  isLoading.value = true
  resetMessages()

  try {
    const response = await $fetch<UserItem[]>('/utilisateurs', {
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

function startCreate() {
  resetMessages()
  resetForm()
  showForm.value = true
}

function startEdit(user: UserItem) {
  resetMessages()
  resetErrors()

  if (!canManageUser(user)) {
    apiError.value = getManageErrorMessage(user)
    return
  }

  editingUserId.value = user.idUtilisateur
  showForm.value = true

  form.prenom = user.prenom ?? ''
  form.nom = user.nom ?? ''
  form.email = user.email ?? ''
  form.password = ''
  form.confirmPassword = ''
  form.role = normalizeRole(user.role) || 'UTILISATEUR'
  form.statut = user.statut ?? 'ACTIF'
}

function cancelForm() {
  resetForm()
  resetMessages()
}

async function createUser() {
  if (!validateForm()) return

  isSubmitting.value = true
  resetMessages()

  try {
    await $fetch('/auth/register', {
      baseURL: apiBase,
      method: 'POST',
      body: {
        firstname: form.prenom.trim(),
        lastname: form.nom.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      },
    })

    apiSuccess.value = 'Le compte a bien été créé. Pensez à ajuster son rôle et son statut si besoin.'
    resetForm()
    await fetchUsers()
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La création du compte a échoué.'
    }
  } finally {
    isSubmitting.value = false
  }
}

async function updateUser() {
  if (!editingUserId.value) return
  if (!validateForm()) return

  const targetUser = users.value.find(
    (item) => String(item.idUtilisateur) === String(editingUserId.value)
  )

  if (targetUser && !canManageUser(targetUser)) {
    apiError.value = getManageErrorMessage(targetUser)
    return
  }

  isSubmitting.value = true
  resetMessages()

  try {
    await $fetch(`/utilisateurs/${editingUserId.value}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim(),
      },
    })

    await $fetch(`/utilisateurs/${editingUserId.value}/role`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: {
        role: form.role,
      },
    })

    await $fetch(`/utilisateurs/${editingUserId.value}/statut`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: {
        statut: form.statut,
      },
    })

    apiSuccess.value = 'Le compte a bien été modifié.'
    resetForm()
    await fetchUsers()
  } catch (error: any) {
    const message =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La modification du compte a échoué.'
    }
  } finally {
    isSubmitting.value = false
  }
}

async function deleteUser(user: UserItem) {
  resetMessages()

  if (!canManageUser(user)) {
    apiError.value = getManageErrorMessage(user)
    return
  }

  const confirmed = window.confirm(
    `Voulez-vous vraiment supprimer le compte de ${user.prenom ?? ''} ${user.nom ?? ''} ?`
  )

  if (!confirmed) return

  deletingUserId.value = user.idUtilisateur

  try {
    await $fetch(`/utilisateurs/${user.idUtilisateur}`, {
      baseURL: apiBase,
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    users.value = users.value.filter(
      (item) => String(item.idUtilisateur) !== String(user.idUtilisateur)
    )

    apiSuccess.value = 'Le compte a bien été supprimé.'
  } catch (error: any) {
    console.error('DELETE UTILISATEUR ERROR', error)

    const message =
      error?.data?.message ||
      error?.response?._data?.message ||
      error?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La suppression du compte a échoué.'
    }
  } finally {
    deletingUserId.value = null
  }
}

async function submitForm() {
  if (isEditMode.value) {
    await updateUser()
  } else {
    await createUser()
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
          <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-admin">
            Voir le fil d’Ariane
          </button>
          <div id="breadcrumb-admin" class="fr-collapse">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Administration</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Gestion des comptes</h1>
          <p class="fr-text--lg fr-mb-0">
            Cette page est réservée aux administrateurs et super administrateurs. Elle permet de créer, modifier et supprimer des comptes utilisateurs.
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
          <div class="rr-admin-toolbar">
            <h2 class="fr-h4 fr-mb-0">Liste des comptes</h2>

            <div class="fr-btns-group fr-btns-group--inline-md fr-mb-0">
              <button type="button" class="fr-btn fr-icon-add-line" @click="startCreate">
                Nouveau compte
              </button>

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
                  <th scope="col">Actions</th>
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
                  <td>{{ item.role || 'Non renseigné' }}</td>
                  <td>{{ item.statut || 'Non renseigné' }}</td>
                  <td>
                    <div class="fr-btns-group fr-btns-group--inline-sm rr-actions">
                      <button
                        type="button"
                        class="fr-btn fr-btn--secondary fr-btn--sm fr-icon-edit-line"
                        :disabled="!canManageUser(item)"
                        @click="startEdit(item)"
                      >
                        {{ canManageUser(item) ? 'Modifier' : 'Modification impossible' }}
                      </button>

                      <button
                        type="button"
                        class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-delete-line"
                        :disabled="deletingUserId === item.idUtilisateur || !canManageUser(item)"
                        @click="deleteUser(item)"
                      >
                        {{
                          deletingUserId === item.idUtilisateur
                            ? 'Suppression...'
                            : canManageUser(item)
                              ? 'Supprimer'
                              : 'Suppression impossible'
                        }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="showForm" class="fr-py-3w">
          <div class="fr-card">
            <div class="fr-card__body">
              <div class="fr-card__content">
                <h2 class="fr-card__title">
                  {{ isEditMode ? 'Modifier un compte' : 'Créer un compte' }}
                </h2>

                <form @submit.prevent="submitForm" novalidate>
                  <fieldset class="fr-fieldset" :disabled="isSubmitting" aria-labelledby="admin-form-legend">
                    <legend id="admin-form-legend" class="fr-fieldset__legend fr-text--regular">
                      Informations du compte
                    </legend>

                    <div class="fr-grid-row fr-grid-row--gutters">
                      <div class="fr-col-12 fr-col-md-6">
                        <div class="fr-fieldset__element">
                          <div class="fr-input-group" :class="{ 'fr-input-group--error': !!errors.prenom }">
                            <label class="fr-label" for="prenom">Prénom</label>
                            <input
                              id="prenom"
                              v-model="form.prenom"
                              class="fr-input"
                              :class="{ 'fr-input--error': !!errors.prenom }"
                              type="text"
                              name="prenom"
                              autocomplete="given-name"
                              aria-describedby="prenom-error"
                            />
                            <p v-if="errors.prenom" id="prenom-error" class="fr-error-text">
                              {{ errors.prenom }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div class="fr-col-12 fr-col-md-6">
                        <div class="fr-fieldset__element">
                          <div class="fr-input-group" :class="{ 'fr-input-group--error': !!errors.nom }">
                            <label class="fr-label" for="nom">Nom</label>
                            <input
                              id="nom"
                              v-model="form.nom"
                              class="fr-input"
                              :class="{ 'fr-input--error': !!errors.nom }"
                              type="text"
                              name="nom"
                              autocomplete="family-name"
                              aria-describedby="nom-error"
                            />
                            <p v-if="errors.nom" id="nom-error" class="fr-error-text">
                              {{ errors.nom }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="fr-fieldset__element">
                      <div class="fr-input-group" :class="{ 'fr-input-group--error': !!errors.email }">
                        <label class="fr-label" for="email">
                          Adresse e-mail
                          <span class="fr-hint-text">Format attendu : nom@domaine.fr</span>
                        </label>
                        <input
                          id="email"
                          v-model="form.email"
                          class="fr-input"
                          :class="{ 'fr-input--error': !!errors.email }"
                          type="email"
                          name="email"
                          autocomplete="email"
                          inputmode="email"
                          aria-describedby="email-error"
                        />
                        <p v-if="errors.email" id="email-error" class="fr-error-text">
                          {{ errors.email }}
                        </p>
                      </div>
                    </div>

                    <div class="fr-grid-row fr-grid-row--gutters">
                      <div class="fr-col-12 fr-col-md-6">
                        <div class="fr-fieldset__element">
                          <div class="fr-select-group" :class="{ 'fr-select-group--error': !!errors.role }">
                            <label class="fr-label" for="role">Rôle</label>
                            <select
                              id="role"
                              v-model="form.role"
                              class="fr-select"
                              aria-describedby="role-error"
                            >
                              <option value="UTILISATEUR">UTILISATEUR</option>
                              <option value="MODERATEUR">MODERATEUR</option>
                              <option value="ADMINISTRATEUR">ADMINISTRATEUR</option>
                            </select>
                            <p v-if="errors.role" id="role-error" class="fr-error-text">
                              {{ errors.role }}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div class="fr-col-12 fr-col-md-6">
                        <div class="fr-fieldset__element">
                          <div class="fr-select-group" :class="{ 'fr-select-group--error': !!errors.statut }">
                            <label class="fr-label" for="statut">Statut</label>
                            <select
                              id="statut"
                              v-model="form.statut"
                              class="fr-select"
                              aria-describedby="statut-error"
                            >
                              <option value="ACTIF">ACTIF</option>
                              <option value="INACTIF">INACTIF</option>
                              <option value="SUSPENDU">SUSPENDU</option>
                            </select>
                            <p v-if="errors.statut" id="statut-error" class="fr-error-text">
                              {{ errors.statut }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <template v-if="!isEditMode">
                      <div class="fr-grid-row fr-grid-row--gutters">
                        <div class="fr-col-12 fr-col-md-6">
                          <div class="fr-fieldset__element">
                            <div class="fr-input-group" :class="{ 'fr-input-group--error': !!errors.password }">
                              <label class="fr-label" for="password">
                                Mot de passe
                                <span class="fr-hint-text">8 caractères minimum</span>
                              </label>
                              <input
                                id="password"
                                v-model="form.password"
                                class="fr-input"
                                :class="{ 'fr-input--error': !!errors.password }"
                                type="password"
                                name="password"
                                autocomplete="new-password"
                                aria-describedby="password-error"
                              />
                              <p v-if="errors.password" id="password-error" class="fr-error-text">
                                {{ errors.password }}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div class="fr-col-12 fr-col-md-6">
                          <div class="fr-fieldset__element">
                            <div class="fr-input-group" :class="{ 'fr-input-group--error': !!errors.confirmPassword }">
                              <label class="fr-label" for="confirmPassword">Confirmer le mot de passe</label>
                              <input
                                id="confirmPassword"
                                v-model="form.confirmPassword"
                                class="fr-input"
                                :class="{ 'fr-input--error': !!errors.confirmPassword }"
                                type="password"
                                name="confirmPassword"
                                autocomplete="new-password"
                                aria-describedby="confirmPassword-error"
                              />
                              <p v-if="errors.confirmPassword" id="confirmPassword-error" class="fr-error-text">
                                {{ errors.confirmPassword }}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </template>

                    <div class="fr-fieldset__element">
                      <div class="fr-btns-group fr-btns-group--inline-md">
                        <button type="submit" class="fr-btn" :aria-busy="isSubmitting ? 'true' : 'false'">
                          {{ isSubmitting
                            ? (isEditMode ? 'Modification en cours...' : 'Création en cours...')
                            : (isEditMode ? 'Enregistrer les modifications' : 'Créer le compte') }}
                        </button>

                        <button
                          type="button"
                          class="fr-btn fr-btn--secondary"
                          @click="cancelForm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.rr-admin-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.rr-actions {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .rr-admin-toolbar {
    align-items: flex-start;
  }
}
</style>