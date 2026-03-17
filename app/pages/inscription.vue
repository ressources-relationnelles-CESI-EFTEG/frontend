<script setup lang="ts">
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { login, isLoggedIn } = useAuth()

const firstname = ref('')
const lastname = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const firstnameError = ref('')
const lastnameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const apiError = ref('')
const apiSuccess = ref('')
const isSubmitting = ref(false)

if (isLoggedIn.value) {
  await navigateTo('/tableau-de-bord')
}

function resetErrors() {
  firstnameError.value = ''
  lastnameError.value = ''
  emailError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  apiError.value = ''
  apiSuccess.value = ''
}

function validateForm() {
  resetErrors()

  let isValid = true

  if (!firstname.value.trim()) {
    firstnameError.value = 'Veuillez renseigner votre prénom.'
    isValid = false
  }

  if (!lastname.value.trim()) {
    lastnameError.value = 'Veuillez renseigner votre nom.'
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

  if (!password.value.trim()) {
    passwordError.value = 'Veuillez renseigner votre mot de passe.'
    isValid = false
  } else if (password.value.length < 8) {
    passwordError.value = 'Le mot de passe doit contenir au moins 8 caractères.'
    isValid = false
  }

  if (!confirmPassword.value.trim()) {
    confirmPasswordError.value = 'Veuillez confirmer votre mot de passe.'
    isValid = false
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Les mots de passe ne correspondent pas.'
    isValid = false
  }

  return isValid
}

async function onSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  apiError.value = ''
  apiSuccess.value = ''

  try {
    await $fetch<{
      message?: string
      user?: {
        id: string | number
        firstname?: string
        lastname?: string
        email: string
        role?: string
      }
    }>('/auth/register', {
      baseURL: apiBase,
      method: 'POST',
      body: {
        firstname: firstname.value.trim(),
        lastname: lastname.value.trim(),
        email: email.value.trim(),
        password: password.value,
        confirmPassword: confirmPassword.value,
      },
    })

    const signInResponse = await $fetch<{
      accessToken: string
      refreshToken?: string
      user?: {
        id: string | number
        firstname?: string
        lastname?: string
        email: string
        role?: string
      }
    }>('/auth/login', {
      baseURL: apiBase,
      method: 'POST',
      body: {
        email: email.value.trim(),
        password: password.value,
      },
    })

    login({
      accessToken: signInResponse.accessToken,
      refreshToken: signInResponse.refreshToken ?? null,
      user: signInResponse.user ?? null,
    })

    apiSuccess.value = 'Compte créé et connexion réussie.'

    firstname.value = ''
    lastname.value = ''
    email.value = ''
    password.value = ''
    confirmPassword.value = ''

    await navigateTo('/tableau-de-bord')
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
      apiError.value = 'L’inscription a échoué. Veuillez réessayer.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-9 fr-col-lg-7">
        <nav class="fr-breadcrumb" aria-label="Vous êtes ici :">
          <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
            Voir le fil d’Ariane
          </button>
          <div class="fr-collapse" id="breadcrumb-1">
            <ol class="fr-breadcrumb__list">
              <li>
                <NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink>
              </li>
              <li>
                <a class="fr-breadcrumb__link" aria-current="page">Inscription</a>
              </li>
            </ol>
          </div>
        </nav>

        <section class="fr-py-4w">
          <header class="fr-mb-4w">
            <h1 class="fr-h2 fr-mb-1w">Inscription à Ressources relationnelles</h1>
            <p class="fr-text--lg fr-mb-0">
              Créez votre compte pour accéder à votre espace personnel, vos ressources et votre messagerie.
            </p>
          </header>

          <div class="fr-alert fr-alert--info fr-mb-4w">
            <h2 class="fr-alert__title">Information</h2>
            <p>
              Tous les champs sont obligatoires. Une fois votre compte créé, vous pourrez vous connecter avec vos identifiants.
            </p>
          </div>

          <form @submit.prevent="onSubmit" novalidate>
            <fieldset class="fr-fieldset" :disabled="isSubmitting" aria-labelledby="register-legend">
              <legend class="fr-fieldset__legend fr-text--regular" id="register-legend">
                Informations du compte
              </legend>

              <div class="fr-grid-row fr-grid-row--gutters">
                <div class="fr-col-12 fr-col-md-6">
                  <div class="fr-fieldset__element">
                    <div class="fr-input-group" :class="{ 'fr-input-group--error': !!firstnameError }">
                      <label class="fr-label" for="firstname">
                        Prénom
                      </label>
                      <input
                        id="firstname"
                        v-model="firstname"
                        class="fr-input"
                        :class="{ 'fr-input--error': !!firstnameError }"
                        type="text"
                        name="firstname"
                        autocomplete="given-name"
                        aria-describedby="firstname-messages"
                      />
                      <p v-if="firstnameError" id="firstname-messages" class="fr-error-text">
                        {{ firstnameError }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="fr-col-12 fr-col-md-6">
                  <div class="fr-fieldset__element">
                    <div class="fr-input-group" :class="{ 'fr-input-group--error': !!lastnameError }">
                      <label class="fr-label" for="lastname">
                        Nom
                      </label>
                      <input
                        id="lastname"
                        v-model="lastname"
                        class="fr-input"
                        :class="{ 'fr-input--error': !!lastnameError }"
                        type="text"
                        name="lastname"
                        autocomplete="family-name"
                        aria-describedby="lastname-messages"
                      />
                      <p v-if="lastnameError" id="lastname-messages" class="fr-error-text">
                        {{ lastnameError }}
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
                    name="email"
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
                <div class="fr-input-group" :class="{ 'fr-input-group--error': !!passwordError }">
                  <label class="fr-label" for="password">
                    Mot de passe
                    <span class="fr-hint-text">8 caractères minimum</span>
                  </label>
                  <input
                    id="password"
                    v-model="password"
                    class="fr-input"
                    :class="{ 'fr-input--error': !!passwordError }"
                    type="password"
                    name="password"
                    autocomplete="new-password"
                    aria-describedby="password-messages"
                  />
                  <p v-if="passwordError" id="password-messages" class="fr-error-text">
                    {{ passwordError }}
                  </p>
                </div>
              </div>

              <div class="fr-fieldset__element">
                <div class="fr-input-group" :class="{ 'fr-input-group--error': !!confirmPasswordError }">
                  <label class="fr-label" for="confirmPassword">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    class="fr-input"
                    :class="{ 'fr-input--error': !!confirmPasswordError }"
                    type="password"
                    name="confirmPassword"
                    autocomplete="new-password"
                    aria-describedby="confirmPassword-messages"
                  />
                  <p v-if="confirmPasswordError" id="confirmPassword-messages" class="fr-error-text">
                    {{ confirmPasswordError }}
                  </p>
                </div>
              </div>

              <div v-if="apiError" class="fr-fieldset__element">
                <div class="fr-alert fr-alert--error" aria-live="assertive">
                  <h2 class="fr-alert__title">Inscription impossible</h2>
                  <p>{{ apiError }}</p>
                </div>
              </div>

              <div v-if="apiSuccess" class="fr-fieldset__element">
                <div class="fr-alert fr-alert--success" aria-live="polite">
                  <h2 class="fr-alert__title">Inscription réussie</h2>
                  <p>{{ apiSuccess }}</p>
                </div>
              </div>

              <div class="fr-fieldset__element">
                <div class="fr-btns-group fr-btns-group--inline-md">
                  <button type="submit" class="fr-btn" :aria-busy="isSubmitting ? 'true' : 'false'">
                    {{ isSubmitting ? 'Inscription en cours...' : 'Créer un compte' }}
                  </button>

                  <NuxtLink to="/connexion" class="fr-btn fr-btn--secondary">
                    J’ai déjà un compte
                  </NuxtLink>
                </div>
              </div>

              <div class="fr-fieldset__element">
                <p class="fr-text--sm fr-mb-0">
                  En créant un compte, vous pourrez accéder à vos ressources personnelles et utiliser la messagerie.
                </p>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>