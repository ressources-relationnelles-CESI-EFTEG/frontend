<script setup lang="ts">
useHead({
  title: 'Connexion',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string
const { login, isLoggedIn } = useAuth()

const email = ref('')
const password = ref('')

const emailError = ref('')
const passwordError = ref('')
const apiError = ref('')
const isSubmitting = ref(false)

if (isLoggedIn.value) {
  await navigateTo('/tableau-de-bord')
}

function resetErrors() {
  emailError.value = ''
  passwordError.value = ''
  apiError.value = ''
}

function validateForm() {
  resetErrors()

  let isValid = true

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
  }

  return isValid
}

async function onSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  apiError.value = ''

  try {
    const response = await $fetch<{
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
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? null,
      user: response.user ?? null,
    })

    await navigateTo('/tableau-de-bord')
  } catch (error: any) {
    const message = error?.data?.message

    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La connexion a échoué. Veuillez vérifier vos identifiants.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--center">
      <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
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
                <a class="fr-breadcrumb__link" aria-current="page">Connexion</a>
              </li>
            </ol>
          </div>
        </nav>

        <section class="fr-py-4w">
          <header class="fr-mb-4w">
            <h1 class="fr-h2 fr-mb-1w">Connexion à Ressources relationnelles</h1>
            <p class="fr-text--lg fr-mb-0">
              Connectez-vous pour accéder à votre espace personnel, vos ressources et votre messagerie.
            </p>
          </header>

          <div class="fr-alert fr-alert--info fr-mb-4w">
            <h2 class="fr-alert__title">Information</h2>
            <p>
              La connexion nécessite un compte existant. Si vous n’avez pas encore de compte,
              vous pouvez vous inscrire.
            </p>
          </div>

          <form @submit.prevent="onSubmit" novalidate>
            <fieldset class="fr-fieldset" :disabled="isSubmitting" aria-labelledby="login-legend">
              <legend class="fr-fieldset__legend fr-text--regular" id="login-legend">
                Informations de connexion
              </legend>

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
                  </label>
                  <input
                    id="password"
                    v-model="password"
                    class="fr-input"
                    :class="{ 'fr-input--error': !!passwordError }"
                    type="password"
                    name="password"
                    autocomplete="current-password"
                    aria-describedby="password-messages"
                  />
                  <p v-if="passwordError" id="password-messages" class="fr-error-text">
                    {{ passwordError }}
                  </p>
                </div>
              </div>

              <div v-if="apiError" class="fr-fieldset__element">
                <div class="fr-alert fr-alert--error" aria-live="assertive">
                  <h2 class="fr-alert__title">Connexion impossible</h2>
                  <p>{{ apiError }}</p>
                </div>
              </div>

              <div class="fr-fieldset__element">
                <div class="fr-btns-group fr-btns-group--inline-md">
                  <button type="submit" class="fr-btn" :aria-busy="isSubmitting ? 'true' : 'false'">
                    {{ isSubmitting ? 'Connexion en cours...' : 'Se connecter' }}
                  </button>

                  <NuxtLink to="/inscription" class="fr-btn fr-btn--secondary">
                    Créer un compte
                  </NuxtLink>
                </div>
              </div>

              <div class="fr-fieldset__element">
                <p class="fr-text--sm fr-mb-0">
                  En vous connectant, vous accédez à vos ressources personnelles et à votre messagerie.
                </p>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>