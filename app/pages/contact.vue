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
    'Votre message a bien été préparé. Cette page est actuellement statique et n’est pas encore connectée à un backend.'

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

  <header role="banner" class="fr-header">
    <div class="fr-header__body">
      <div class="fr-container">
        <div class="fr-header__body-row">
          <div class="fr-header__brand fr-enlarge-link">
            <div class="fr-header__brand-top">
              <div class="fr-header__logo">
                <p class="fr-logo">
                  Ministère<br />
                  des solidarités<br />
                  et de la santé
                </p>
              </div>

              <div class="fr-header__navbar">
                <button
                  class="fr-btn fr-btn--menu fr-btn--lg"
                  data-fr-opened="false"
                  aria-controls="menu-principal"
                  aria-haspopup="menu"
                  title="Menu"
                >
                  Menu
                </button>
              </div>
            </div>

            <div class="fr-header__service">
              <a class="fr-header__service-title" href="/accueil">
                Ressources relationnelles
              </a>
            </div>
          </div>

          <div class="fr-header__tools rr-header-tools">
            <div class="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left rr-auth-buttons">
              <NuxtLink class="fr-btn fr-btn--secondary fr-icon-lock-line" to="/connexion">
                Connexion
              </NuxtLink>
              <NuxtLink class="fr-btn fr-icon-account-line" to="/inscription">
                Inscription
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="fr-header__menu fr-modal" id="menu-principal" aria-label="Menu principal">
      <div class="fr-container">
        <button class="fr-btn--close fr-btn" aria-controls="menu-principal" title="Fermer">
          Fermer
        </button>

        <nav id="navigation" class="fr-nav" role="navigation" aria-label="Navigation principale">
          <ul class="fr-nav__list">
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/accueil">Accueil</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/tableau-de-bord">Tableau de bord</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/mes-ressources">Mes ressources</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/messagerie">Messagerie</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/mon-compte">Mon compte</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/ajouter-une-ressource">Ajouter une ressource</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/contact" aria-current="page">Contactez-nous</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/accessibilite">Accessibilité</NuxtLink>
            </li>
            <li class="fr-nav__item">
              <NuxtLink class="fr-nav__link" to="/aide">Aide</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

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
                <h2 class="fr-alert__title">Message préparé</h2>
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

  <footer id="pied" role="contentinfo" class="fr-footer">
    <div class="fr-container">
      <div class="fr-footer__body rr-footer-body">
        <div class="rr-footer-left">
          <div class="rr-footer-ministry">
            <div class="rr-footer-ministry-title">
              MINISTÈRE<br />DES SOLIDARITÉS<br />ET DE LA SANTÉ
            </div>
            <div class="rr-footer-motto">Liberté<br />Égalité<br />Fraternité</div>
          </div>
        </div>

        <div class="rr-footer-mid">
          <p class="rr-footer-text">
            Ce site est géré par le Ministère des solidarités et de la santé
          </p>

          <ul class="rr-footer-sites rr-footer-sites--center" aria-label="Liens officiels">
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://info.gouv.fr" target="_blank" rel="noopener">
                info.gouv.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.service-public.fr" target="_blank" rel="noopener">
                service-public.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.legifrance.gouv.fr" target="_blank" rel="noopener">
                legifrance.gouv.fr
              </a>
            </li>
            <li>
              <a class="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right" href="https://www.data.gouv.fr" target="_blank" rel="noopener">
                data.gouv.fr
              </a>
            </li>
          </ul>
        </div>
      </div>

      <hr class="fr-hr fr-mt-3w fr-mb-2w" />

      <div class="rr-footer-bottom-links">
        <ul class="rr-footer-bottom-list" aria-label="Liens de bas de page">
          <li>
            <NuxtLink class="fr-link fr-link--sm" to="/accessibilite">Accessibilité</NuxtLink>
          </li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Mentions légales</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Données personnelles</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Gestion des cookies</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li><a class="fr-link fr-link--sm" href="#" @click.prevent>Plan du site</a></li>
          <li class="rr-sep" aria-hidden="true">|</li>
          <li>
            <a class="fr-link fr-link--sm fr-icon-settings-5-line fr-link--icon-left" href="#" @click.prevent>
              Paramètres d’affichage
            </a>
          </li>
        </ul>
      </div>

      <p class="fr-text--xs fr-mt-2w rr-footer-licence">
        Sauf mention explicite de propriété intellectuelle détenue par des tiers, les contenus de ce site sont proposés sous licence
        <a class="fr-link fr-link--xs fr-icon-external-link-line fr-link--icon-right" href="https://www.etalab.gouv.fr/licence-ouverte-open-licence" target="_blank" rel="noopener">
          etalab-2.0
        </a>
      </p>
    </div>
  </footer>
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