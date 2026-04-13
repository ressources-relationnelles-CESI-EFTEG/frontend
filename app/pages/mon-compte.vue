<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { user, authToken, login, logout } = useAuth()

const activeTab = ref('donnees')
const isLoading = ref(true)
const isSubmitting = ref(false)
const apiError = ref('')
const successMessage = ref('')

const prenom = ref('')
const nom = ref('')
const email = ref('')
const telephone = ref('')
const description = ref('')
const phraseAccroche = ref('')
const region = ref('')

const prenomError = ref('')
const nomError = ref('')
const emailError = ref('')

const regions = ref<string[]>([])
const photoPreview = ref<string | null>(null)
const photoFile = ref<File | null>(null)

const favoris = ref<Record<string, any>[]>([])
const favorisLoading = ref(false)
const favorisError = ref('')

async function fetchFavoris() {
  if (!user.value?.id) return
  favorisLoading.value = true
  favorisError.value = ''
  try {
    const data = await $fetch<Record<string, any>[]>(`/favoris/utilisateur/${user.value.id}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    favoris.value = data
  } catch {
    favorisError.value = 'Impossible de charger vos ressources favorites.'
  } finally {
    favorisLoading.value = false
  }
}

onMounted(async () => {
  fetchRegions()

  if (!user.value?.id) return

  try {
    const data = await $fetch<Record<string, any>>(`/utilisateurs/${user.value.id}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })

    prenom.value = data.prenom ?? ''
    nom.value = data.nom ?? ''
    email.value = data.email ?? ''
    telephone.value = data.telephone ?? ''
    description.value = data.description ?? ''
    phraseAccroche.value = data.phraseAccroche ?? ''
    region.value = data.region ?? ''
    if (data.photoProfil) {
      photoPreview.value = `${apiBase}${data.photoProfil}`
    }
  } catch {
    apiError.value = 'Impossible de charger les informations du profil.'
  } finally {
    isLoading.value = false
  }
})

async function fetchRegions() {
  try {
    const data = await $fetch<{ nom: string }[]>('https://geo.api.gouv.fr/regions', {
      query: { fields: 'nom' },
    })
    regions.value = data.map((r) => r.nom).sort((a, b) => a.localeCompare(b, 'fr'))
  } catch {
    regions.value = [
      'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
      'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
      'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
      'Pays de la Loire', "Provence-Alpes-Côte d'Azur",
      'Guadeloupe', 'Guyane', 'Martinique', 'Mayotte', 'La Réunion',
    ]
  }
}

async function onPhotoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    apiError.value = 'Le fichier doit être une image (JPG, PNG, etc.).'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    apiError.value = "L'image ne doit pas dépasser 5 Mo."
    return
  }

  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)

  if (user.value?.id) {
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const data = await $fetch<Record<string, any>>(`/utilisateurs/${user.value.id}/photo`, {
        baseURL: apiBase,
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken.value}` },
        body: formData,
      })
      if (data.photoProfil) {
        photoPreview.value = `${apiBase}${data.photoProfil}`
      }
    } catch {
      apiError.value = "Erreur lors de l'envoi de la photo."
    }
  }
}

async function removePhoto() {
  if (user.value?.id) {
    try {
      await $fetch(`/utilisateurs/${user.value.id}/photo`, {
        baseURL: apiBase,
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken.value}` },
      })
    } catch {
      apiError.value = 'Erreur lors de la suppression de la photo.'
      return
    }
  }
  photoFile.value = null
  photoPreview.value = null
}

function resetErrors() {
  prenomError.value = ''
  nomError.value = ''
  emailError.value = ''
  apiError.value = ''
  successMessage.value = ''
}

function validateForm() {
  resetErrors()
  let isValid = true

  if (!prenom.value.trim()) {
    prenomError.value = 'Veuillez renseigner votre prénom.'
    isValid = false
  }

  if (!nom.value.trim()) {
    nomError.value = 'Veuillez renseigner votre nom.'
    isValid = false
  }

  if (!email.value.trim()) {
    emailError.value = 'Veuillez renseigner votre adresse e-mail.'
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value.trim())) {
      emailError.value = 'Veuillez saisir une adresse e-mail valide.'
      isValid = false
    }
  }

  return isValid
}

async function onSubmit() {
  if (!validateForm()) return
  if (!user.value?.id) return

  isSubmitting.value = true
  apiError.value = ''
  successMessage.value = ''

  try {
    const data = await $fetch<Record<string, any>>(`/utilisateurs/${user.value.id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        prenom: prenom.value.trim() || undefined,
        nom: nom.value.trim() || undefined,
        email: email.value.trim() || undefined,
        telephone: telephone.value.trim() || undefined,
        description: description.value.trim() || undefined,
        phraseAccroche: phraseAccroche.value.trim() || undefined,
        region: region.value || undefined,
      },
    })

    login({
      accessToken: authToken.value!,
      refreshToken: null,
      user: {
        id: data.idUtilisateur,
        firstname: data.prenom,
        lastname: data.nom,
        email: data.email,
        role: data.role?.toLowerCase(),
      },
    })

    successMessage.value = 'Vos informations ont été mises à jour avec succès.'
  } catch (error: any) {
    const message = error?.data?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La mise à jour du profil a échoué. Veuillez réessayer.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function setTab(tab: string) {
  activeTab.value = tab
  if (tab === 'ressources' && favoris.value.length === 0 && !favorisLoading.value) {
    fetchFavoris()
  }
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-col-lg-8">
        <nav class="fr-breadcrumb" aria-label="Vous êtes ici :">
          <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-compte">
            Voir le fil d'Ariane
          </button>
          <div class="fr-collapse" id="breadcrumb-compte">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Mon compte</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Mon compte</h1>
          <p class="fr-text--lg fr-mb-0">
            Consultez et modifiez vos informations personnelles.
          </p>
        </header>

        <div v-if="isLoading" class="fr-alert fr-alert--info fr-mb-4w">
          <h2 class="fr-alert__title">Chargement</h2>
          <p>Récupération de vos informations en cours...</p>
        </div>

        <template v-else>
          <div class="fr-tabs">
            <ul class="fr-tabs__list" role="tablist" aria-label="Sections du compte">
              <li role="presentation">
                <button
                  class="fr-tabs__tab"
                  :class="{ 'fr-tabs__tab--active': activeTab === 'donnees' }"
                  role="tab"
                  :aria-selected="activeTab === 'donnees'"
                  :aria-controls="'tab-donnees'"
                  @click="setTab('donnees')"
                >
                  Mes données personnelles
                </button>
              </li>
              <li role="presentation">
                <button
                  class="fr-tabs__tab"
                  :class="{ 'fr-tabs__tab--active': activeTab === 'ressources' }"
                  role="tab"
                  :aria-selected="activeTab === 'ressources'"
                  :aria-controls="'tab-ressources'"
                  @click="setTab('ressources')"
                >
                  Mes ressources
                </button>
              </li>
            </ul>

            <!-- Onglet : Données personnelles -->
            <div
              id="tab-donnees"
              class="fr-tabs__panel"
              :class="{ 'fr-tabs__panel--active': activeTab === 'donnees' }"
              role="tabpanel"
            >
              <form @submit.prevent="onSubmit" novalidate>
                <fieldset class="fr-fieldset" :disabled="isSubmitting" aria-labelledby="profil-legend">
                  <legend class="fr-fieldset__legend fr-text--regular" id="profil-legend">
                    Informations personnelles
                  </legend>

                  <!-- Photo de profil -->
                  <div class="fr-fieldset__element">
                    <div class="fr-input-group">
                      <label class="fr-label">
                        Photo de profil
                        <span class="fr-hint-text">Optionnel — JPG ou PNG, 5 Mo maximum</span>
                      </label>
                      <div class="rr-photo-upload">
                        <div class="rr-photo-preview">
                          <img
                            v-if="photoPreview"
                            :src="photoPreview"
                            alt=""
                            @error="photoPreview = null"
                          />
                          <span
                            v-else
                            class="fr-icon-user-line rr-photo-placeholder"
                            aria-hidden="true"
                          ></span>
                        </div>
                        <div class="rr-photo-actions">
                          <label for="photo-input" class="fr-btn fr-btn--secondary fr-btn--sm">
                            Choisir une photo
                          </label>
                          <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            class="rr-photo-input"
                            @change="onPhotoChange"
                          />
                          <button
                            v-if="photoPreview"
                            type="button"
                            class="fr-btn fr-btn--tertiary fr-btn--sm"
                            @click="removePhoto"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="fr-grid-row fr-grid-row--gutters">
                    <div class="fr-col-12 fr-col-md-6">
                      <div class="fr-fieldset__element">
                        <div class="fr-input-group" :class="{ 'fr-input-group--error': !!prenomError }">
                          <label class="fr-label" for="prenom">Prénom</label>
                          <input
                            id="prenom"
                            v-model="prenom"
                            class="fr-input"
                            :class="{ 'fr-input--error': !!prenomError }"
                            type="text"
                            autocomplete="given-name"
                            aria-describedby="prenom-messages"
                          />
                          <p v-if="prenomError" id="prenom-messages" class="fr-error-text">
                            {{ prenomError }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="fr-col-12 fr-col-md-6">
                      <div class="fr-fieldset__element">
                        <div class="fr-input-group" :class="{ 'fr-input-group--error': !!nomError }">
                          <label class="fr-label" for="nom">Nom</label>
                          <input
                            id="nom"
                            v-model="nom"
                            class="fr-input"
                            :class="{ 'fr-input--error': !!nomError }"
                            type="text"
                            autocomplete="family-name"
                            aria-describedby="nom-messages"
                          />
                          <p v-if="nomError" id="nom-messages" class="fr-error-text">
                            {{ nomError }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-input-group" :class="{ 'fr-input-group--error': !!emailError }">
                      <label class="fr-label" for="email">
                        Adresse e-mail
                        <span class="fr-hint-text">Format attendu : nom@domaine.fr</span>
                      </label>
                      <input
                        id="email"
                        v-model="email"
                        class="fr-input"
                        :class="{ 'fr-input--error': !!emailError }"
                        type="email"
                        autocomplete="email"
                        inputmode="email"
                        aria-describedby="email-messages"
                      />
                      <p v-if="emailError" id="email-messages" class="fr-error-text">
                        {{ emailError }}
                      </p>
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-input-group">
                      <label class="fr-label" for="telephone">
                        Téléphone
                        <span class="fr-hint-text">Optionnel</span>
                      </label>
                      <input
                        id="telephone"
                        v-model="telephone"
                        class="fr-input"
                        type="tel"
                        autocomplete="tel"
                        inputmode="tel"
                      />
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-input-group">
                      <label class="fr-label" for="phrase-accroche">
                        Phrase d'accroche
                        <span class="fr-hint-text">Optionnel — une courte phrase qui vous décrit</span>
                      </label>
                      <input
                        id="phrase-accroche"
                        v-model="phraseAccroche"
                        class="fr-input"
                        type="text"
                      />
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-input-group">
                      <label class="fr-label" for="description">
                        Description
                        <span class="fr-hint-text">Optionnel — parlez de vous en quelques lignes</span>
                      </label>
                      <textarea
                        id="description"
                        v-model="description"
                        class="fr-input fr-input--textarea"
                        rows="4"
                      ></textarea>
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-select-group">
                      <label class="fr-label" for="region">
                        Région
                        <span class="fr-hint-text">Optionnel</span>
                      </label>
                      <select id="region" v-model="region" class="fr-select">
                        <option value="" disabled hidden>Sélectionnez une région</option>
                        <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
                      </select>
                    </div>
                  </div>

                  <div v-if="apiError" class="fr-fieldset__element">
                    <div class="fr-alert fr-alert--error" aria-live="assertive">
                      <h2 class="fr-alert__title">Mise à jour impossible</h2>
                      <p>{{ apiError }}</p>
                    </div>
                  </div>

                  <div v-if="successMessage" class="fr-fieldset__element">
                    <div class="fr-alert fr-alert--success" aria-live="polite">
                      <h2 class="fr-alert__title">Profil mis à jour</h2>
                      <p>{{ successMessage }}</p>
                    </div>
                  </div>

                  <div class="fr-fieldset__element">
                    <div class="fr-btns-group fr-btns-group--inline-md">
                      <button type="submit" class="fr-btn" :aria-busy="isSubmitting ? 'true' : 'false'">
                        {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            </div>

            <!-- Onglet : Ressources -->
            <div
              id="tab-ressources"
              class="fr-tabs__panel"
              :class="{ 'fr-tabs__panel--active': activeTab === 'ressources' }"
              role="tabpanel"
            >
              <h2 class="fr-h4 fr-mb-2w">Mes ressources favorites</h2>

              <div v-if="favorisLoading" class="fr-alert fr-alert--info fr-mb-2w">
                <p>Chargement de vos favoris...</p>
              </div>

              <div v-else-if="favorisError" class="fr-alert fr-alert--error fr-mb-2w">
                <p>{{ favorisError }}</p>
              </div>

              <div v-else-if="favoris.length === 0" class="fr-alert fr-alert--info fr-mb-2w">
                <h3 class="fr-alert__title">Aucun favori</h3>
                <p>
                  Vous n'avez pas encore ajouté de ressource à vos favoris.
                  Explorez les ressources disponibles pour en ajouter.
                </p>
              </div>

              <div v-else class="rr-favoris-list">
                <div
                  v-for="ressource in favoris"
                  :key="ressource.idRessource"
                  class="fr-card fr-card--horizontal fr-mb-2w"
                >
                  <div class="fr-card__body">
                    <div class="fr-card__content">
                      <h3 class="fr-card__title">{{ ressource.titre }}</h3>
                      <p class="fr-card__desc">{{ ressource.description || 'Aucune description' }}</p>
                      <div class="fr-card__start">
                        <ul class="fr-tags-group">
                          <li>
                            <p class="fr-tag fr-tag--sm">{{ ressource.categorie }}</p>
                          </li>
                          <li v-if="ressource.typeRessource">
                            <p class="fr-tag fr-tag--sm">{{ ressource.typeRessource }}</p>
                          </li>
                        </ul>
                      </div>
                      <div class="fr-card__end">
                        <p class="fr-card__detail">
                          <span class="fr-icon-user-line fr-icon--sm" aria-hidden="true"></span>
                          {{ ressource.auteur }}
                        </p>
                        <p class="fr-card__detail">
                          <span class="fr-icon-calendar-line fr-icon--sm" aria-hidden="true"></span>
                          Ajouté le {{ new Date(ressource.dateAjoutFavori).toLocaleDateString('fr-FR') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="fr-col-12 fr-col-lg-4">
        <aside class="fr-p-3w rr-side-card">
          <div class="rr-profile-card">
            <div class="rr-profile-avatar">
              <img
                v-if="photoPreview"
                :src="photoPreview"
                alt="Photo de profil"
              />
              <span
                v-else
                class="fr-icon-user-line rr-avatar-icon"
                aria-hidden="true"
              ></span>
            </div>
            <h2 class="fr-h4 fr-mb-1w">{{ prenom }} {{ nom }}</h2>
          </div>
          <p class="fr-mb-1w fr-text--sm">
            <span class="fr-icon-mail-line fr-icon--sm" aria-hidden="true"></span>
            {{ email }}
          </p>
          
          <p class="fr-mb-1w fr-text--sm">
            <span class="fr-icon-user-line fr-icon--sm" aria-hidden="true"></span>
            Téléphone : {{ telephone }}
          </p>
          
          <p class="fr-mb-1w fr-text--sm">
            <span class="fr-icon-user-line fr-icon--sm" aria-hidden="true"></span>
            Phrase d'accorche : {{ phraseAccroche }}
          </p>
          
          <hr class="fr-hr fr-mb-2w" />
          <button type="button" class="fr-btn fr-btn--tertiary fr-btn--sm" @click="logout">
            Se déconnecter
          </button>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.rr-side-card {
  border: 1px solid var(--border-default-grey);
  background: var(--background-alt-grey);
}

.rr-profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 1rem;
}

.rr-profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid var(--border-default-grey);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-contrast-grey);
  margin-bottom: 0.75rem;
}

.rr-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rr-avatar-icon::before {
  font-size: 2rem;
}

.rr-photo-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.rr-photo-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid var(--border-default-grey);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--background-contrast-grey);
  flex-shrink: 0;
}

.rr-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rr-photo-placeholder::before {
  font-size: 1.5rem;
}

.rr-photo-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.rr-photo-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fr-tabs__panel {
  display: none;
  padding: 1.5rem;
}

.fr-tabs__panel--active {
  display: block;
}

.fr-tabs__tab--active {
  border-bottom: 2px solid var(--blue-france-sun-113-625);
  color: var(--blue-france-sun-113-625);
}
</style>
