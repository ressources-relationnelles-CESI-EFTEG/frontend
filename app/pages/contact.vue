<script setup lang="ts">
const firstname = ref('')
const lastname = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')

const firstnameError = ref('')
const lastnameError = ref('')
const emailError = ref('')
const subjectError = ref('')
const messageError = ref('')
const successMessage = ref('')

function resetErrors() {
  firstnameError.value = ''
  lastnameError.value = ''
  emailError.value = ''
  subjectError.value = ''
  messageError.value = ''
  successMessage.value = ''
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

  if (!subject.value.trim()) {
    subjectError.value = 'Veuillez renseigner un objet.'
    isValid = false
  }

  if (!message.value.trim()) {
    messageError.value = 'Veuillez renseigner votre message.'
    isValid = false
  }

  return isValid
}

function onSubmit() {
  if (!validateForm()) return

  successMessage.value =
    'Votre message a bien été envoyé.'

  firstname.value = ''
  lastname.value = ''
  email.value = ''
  subject.value = ''
  message.value = ''
}
</script>

<template>
  <div class="fr-skiplinks">
    <nav class="fr-container" aria-label="Accès rapide">
      <ul class="fr-skiplinks__list">
        <li><a class="fr-link" href="#contenu">Aller au contenu</a></li>
        <li><a class="fr-link" href="#navigation">Aller au menu</a></li>
        <li><a class="fr-link" href="#pied">Aller au pied de page</a></li>
      </ul>
    </nav>
  </div>


  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-col-lg-8">
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
                <a class="fr-breadcrumb__link" aria-current="page">Contactez-nous</a>
              </li>
            </ol>
          </div>
        </nav>

        <header class="fr-mb-4w">
          <h1 class="fr-h2 fr-mb-1w">Contactez-nous</h1>
          <p class="fr-text--lg fr-mb-0">
            Une question, une remarque ou un besoin d’accompagnement ? Utilisez ce formulaire pour nous contacter.
          </p>
        </header>

        <div class="fr-alert fr-alert--info fr-mb-4w">
          <h2 class="fr-alert__title">Information</h2>
          <p>
            Cette page est actuellement statique. Le formulaire n’est pas encore relié à un service d’envoi.
          </p>
        </div>

        <form @submit.prevent="onSubmit" novalidate>
          <fieldset class="fr-fieldset" aria-labelledby="contact-legend">
            <legend class="fr-fieldset__legend fr-text--regular" id="contact-legend">
              Vos informations
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
                      autocomplete="given-name"
                      aria-describedby="firstname-messages"
                    />
                    <p id="firstname-messages" class="fr-error-text" v-if="firstnameError">
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
                      autocomplete="family-name"
                      aria-describedby="lastname-messages"
                    />
                    <p id="lastname-messages" class="fr-error-text" v-if="lastnameError">
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
                  autocomplete="email"
                  aria-describedby="email-messages"
                />
                <p id="email-messages" class="fr-error-text" v-if="emailError">
                  {{ emailError }}
                </p>
              </div>
            </div>

            <div class="fr-fieldset__element">
              <div class="fr-input-group" :class="{ 'fr-input-group--error': !!subjectError }">
                <label class="fr-label" for="subject">
                  Objet
                </label>
                <input
                  id="subject"
                  v-model="subject"
                  class="fr-input"
                  :class="{ 'fr-input--error': !!subjectError }"
                  type="text"
                  aria-describedby="subject-messages"
                />
                <p id="subject-messages" class="fr-error-text" v-if="subjectError">
                  {{ subjectError }}
                </p>
              </div>
            </div>

            <div class="fr-fieldset__element">
              <div class="fr-input-group" :class="{ 'fr-input-group--error': !!messageError }">
                <label class="fr-label" for="message">
                  Message
                </label>
                <textarea
                  id="message"
                  v-model="message"
                  class="fr-input fr-input--textarea"
                  :class="{ 'fr-input--error': !!messageError }"
                  rows="6"
                  aria-describedby="message-messages"
                ></textarea>
                <p id="message-messages" class="fr-error-text" v-if="messageError">
                  {{ messageError }}
                </p>
              </div>
            </div>

            <div class="fr-fieldset__element" v-if="successMessage">
              <div class="fr-alert fr-alert--success" aria-live="polite">
                <h2 class="fr-alert__title">Message envoyé.</h2>
                <p>{{ successMessage }}</p>
              </div>
            </div>

            <div class="fr-fieldset__element">
              <div class="fr-btns-group fr-btns-group--inline-md">
                <button type="submit" class="fr-btn">
                  Envoyer
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--secondary"
                  @click="
                    firstname = '';
                    lastname = '';
                    email = '';
                    subject = '';
                    message = '';
                    resetErrors();
                  "
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      </div>

      <div class="fr-col-12 fr-col-lg-4">
        <aside class="fr-p-3w rr-side-card">
          <h2 class="fr-h4">Informations utiles</h2>
          <p class="fr-mb-2w">
            Vous pouvez utiliser cette page pour toute demande générale liée à la plateforme.
          </p>
          <ul class="fr-text--sm">
            <li>Question sur votre compte</li>
            <li>Signalement d’un problème</li>
            <li>Besoin d’aide sur les ressources</li>
            <li>Remarque sur l’accessibilité</li>
          </ul>
        </aside>
      </div>
    </div>
  </main>

</template>

<style scoped>
.rr-header-tools {
  display: flex;
  justify-content: flex-end;
}

.rr-auth-buttons {
  justify-content: flex-end;
}

.rr-side-card {
  border: 1px solid var(--border-default-grey);
  background: var(--background-alt-grey);
}

.rr-footer-body {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
  align-items: start;
}

.rr-footer-ministry-title {
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.1;
  font-size: 0.95rem;
}

.rr-footer-motto {
  margin-top: 0.5rem;
  font-style: italic;
  font-size: 0.8rem;
  line-height: 1.2;
}

.rr-footer-mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rr-footer-text {
  margin: 0;
  text-align: center;
  font-size: 0.9rem;
}

.rr-footer-sites {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.rr-footer-sites--center {
  justify-content: center;
}

.rr-footer-bottom-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.rr-sep {
  opacity: 0.6;
}

.rr-footer-licence {
  margin-bottom: 0;
}

@media (max-width: 980px) {
  .rr-footer-body {
    grid-template-columns: 1fr;
  }

  .rr-footer-mid {
    align-items: flex-start;
  }

  .rr-footer-text {
    text-align: left;
  }

  .rr-footer-sites--center {
    justify-content: flex-start;
  }
}
</style>