<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase as string

const _auth = useAuth() as any
const user = _auth.user as Ref<any>
const authToken = computed<string | null>(() =>
  (_auth.authToken?.value ?? _auth.token?.value) ?? null,
)
const userId = computed(() => user.value?.id ?? user.value?.idUtilisateur ?? null)

// ---------------------------------------------------------------------------
// Chargement de la ressource existante
// ---------------------------------------------------------------------------
const isLoading = ref(true)
const loadError = ref('')

// ---------------------------------------------------------------------------
// Étapes du formulaire
// ---------------------------------------------------------------------------
const ETAPES = [
  { id: 1, label: 'Informations générales' },
  { id: 2, label: 'Contenu' },
  { id: 3, label: 'Publication' },
]
const etapeActive = ref(1)

// ---------------------------------------------------------------------------
// Données du formulaire
// ---------------------------------------------------------------------------
const titre = ref('')
const description = ref('')
const contenu = ref('')
const typeRessource = ref('')
const typeRelation = ref('')
const niveauDifficulte = ref('')
const visibilite = ref('privee')
const idCategorie = ref('')

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------
const typesRessource = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Vidéo' },
  { value: 'audio', label: 'Audio' },
  { value: 'exercice', label: 'Exercice' },
  { value: 'activite', label: 'Activité' },
  { value: 'jeu', label: 'Jeu' },
]

const typesRelation = [
  { value: 'famille', label: 'Famille' },
  { value: 'couple', label: 'Couple' },
  { value: 'amitie', label: 'Amitié' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'communautaire', label: 'Communautaire' },
]

const niveauxDifficulte = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
]

const visibilites = [
  { value: 'privee', label: 'Privée', desc: 'Visible uniquement par vous', icon: 'fr-icon-lock-line' },
  { value: 'partagee', label: 'Partagée', desc: 'Visible par les personnes avec le lien', icon: 'fr-icon-links-line' },
  { value: 'publique', label: 'Publique', desc: 'Visible par tous les utilisateurs', icon: 'fr-icon-earth-line' },
]

// ---------------------------------------------------------------------------
// Catégories depuis l'API
// ---------------------------------------------------------------------------
const categories = ref<Record<string, any>[]>([])

async function fetchCategories() {
  try {
    const data = await $fetch<Record<string, any>[]>('/categories', {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })
    categories.value = data
  } catch {
    categories.value = []
  }
}

async function fetchRessource() {
  try {
    const data = await $fetch<Record<string, any>>(`/ressources/${route.params.id}`, {
      baseURL: apiBase,
      headers: { Authorization: `Bearer ${authToken.value}` },
    })

    // Vérifier que l'utilisateur est bien le propriétaire
    const ownerId = data.utilisateur?.id ?? data.utilisateur?.idUtilisateur ?? data.idUtilisateur
    if (ownerId && userId.value && Number(ownerId) !== Number(userId.value)) {
      loadError.value = "Vous n'êtes pas autorisé à modifier cette ressource."
      return
    }

    titre.value = data.titre ?? ''
    description.value = data.description ?? ''
    contenu.value = data.contenu ?? ''
    typeRessource.value = (data.typeRessource ?? '').toLowerCase()
    typeRelation.value = (data.typeRelation ?? '').toLowerCase()
    niveauDifficulte.value = (data.niveauDifficulte ?? '').toLowerCase()
    visibilite.value = (data.visibilite ?? 'privee').toLowerCase()
    idCategorie.value = data.categorie?.idCategorie ? String(data.categorie.idCategorie) : ''
  } catch (error: any) {
    if (error?.statusCode === 404) {
      loadError.value = 'Cette ressource est introuvable.'
    } else {
      loadError.value = 'Impossible de charger la ressource à modifier.'
    }
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchRessource()])
  isLoading.value = false
})

// ---------------------------------------------------------------------------
// Validation par étape
// ---------------------------------------------------------------------------
const errors = ref<Record<string, string>>({})

function clearErrors() {
  errors.value = {}
}

function validateEtape1(): boolean {
  clearErrors()
  let valid = true
  if (!titre.value.trim()) {
    errors.value.titre = 'Le titre est obligatoire.'
    valid = false
  } else if (titre.value.trim().length > 255) {
    errors.value.titre = 'Le titre ne peut pas dépasser 255 caractères.'
    valid = false
  }
  if (!typeRessource.value) {
    errors.value.typeRessource = 'Veuillez choisir un type de ressource.'
    valid = false
  }
  if (!idCategorie.value) {
    errors.value.idCategorie = 'Veuillez choisir une catégorie.'
    valid = false
  }
  return valid
}

function validateEtape2(): boolean {
  clearErrors()
  let valid = true
  if (!contenu.value.trim()) {
    errors.value.contenu = 'Le contenu est obligatoire.'
    valid = false
  }
  return valid
}

function allerEtape(n: number) {
  if (n > etapeActive.value) {
    if (etapeActive.value === 1 && !validateEtape1()) return
    if (etapeActive.value === 2 && !validateEtape2()) return
  }
  etapeActive.value = n
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function etapeSuivante() {
  allerEtape(etapeActive.value + 1)
}

function etapePrecedente() {
  allerEtape(etapeActive.value - 1)
}

// ---------------------------------------------------------------------------
// Soumission (PATCH + resoumission à validation)
// ---------------------------------------------------------------------------
const isSubmitting = ref(false)
const apiError = ref('')
const submitted = ref(false)

async function onSubmit() {
  if (!validateEtape1()) { etapeActive.value = 1; return }
  if (!validateEtape2()) { etapeActive.value = 2; return }

  isSubmitting.value = true
  apiError.value = ''

  try {
    await $fetch(`/ressources/${route.params.id}`, {
      baseURL: apiBase,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken.value}` },
      body: {
        idCategorie: Number(idCategorie.value),
        titre: titre.value.trim(),
        description: description.value.trim() || undefined,
        contenu: contenu.value.trim(),
        typeRessource: typeRessource.value ? typeRessource.value.toUpperCase() : undefined,
        typeRelation: typeRelation.value ? typeRelation.value.toUpperCase() : undefined,
        niveauDifficulte: niveauDifficulte.value ? niveauDifficulte.value.toUpperCase() : undefined,
        visibilite: visibilite.value.toUpperCase(),
        statut: 'EN_ATTENTE',
      },
    })

    submitted.value = true
  } catch (error: any) {
    const message = error?.data?.message
    if (Array.isArray(message)) {
      apiError.value = message.join(' ')
    } else if (typeof message === 'string') {
      apiError.value = message
    } else {
      apiError.value = 'La modification de la ressource a échoué. Veuillez réessayer.'
    }
  } finally {
    isSubmitting.value = false
  }
}

// ---------------------------------------------------------------------------
// Compteur de caractères
// ---------------------------------------------------------------------------
const TITRE_MAX = 255
const titreRestant = computed(() => TITRE_MAX - titre.value.length)
</script>

<template>
  <main id="contenu" role="main" class="fr-container fr-py-6w">
    <!-- Fil d'Ariane -->
    <nav class="fr-breadcrumb fr-mb-4w" aria-label="Vous êtes ici :">
      <button class="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-modifier">
        Voir le fil d'Ariane
      </button>
      <div class="fr-collapse" id="breadcrumb-modifier">
        <ol class="fr-breadcrumb__list">
          <li><NuxtLink class="fr-breadcrumb__link" to="/accueil">Accueil</NuxtLink></li>
          <li><NuxtLink class="fr-breadcrumb__link" to="/ressources">Ressources</NuxtLink></li>
          <li><a class="fr-breadcrumb__link" aria-current="page">Modifier la ressource</a></li>
        </ol>
      </div>
    </nav>

    <!-- Chargement -->
    <div v-if="isLoading" class="fr-grid-row fr-grid-row--center fr-py-8w">
      <div class="fr-col-auto rr-loader" role="status" aria-label="Chargement en cours…">
        <span class="fr-icon-refresh-line rr-spin" aria-hidden="true"></span>
        <span class="fr-ml-1w">Chargement de la ressource…</span>
      </div>
    </div>

    <!-- Erreur de chargement -->
    <div v-else-if="loadError" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
      <h2 class="fr-alert__title">Ressource indisponible</h2>
      <p>{{ loadError }}</p>
      <NuxtLink to="/ressources" class="fr-btn fr-btn--tertiary fr-mt-2w">
        Retour aux ressources
      </NuxtLink>
    </div>

    <!-- Confirmation de soumission -->
    <div v-else-if="submitted" class="fr-grid-row fr-grid-row--center fr-py-6w">
      <div class="fr-col-12 fr-col-lg-8">
        <div class="fr-alert fr-alert--success fr-mb-4w">
          <h2 class="fr-alert__title">Ressource soumise à validation !</h2>
          <p>
            Votre ressource <strong>« {{ titre }} »</strong> a été modifiée et est
            <strong>en attente de validation</strong> par un modérateur.
            Elle sera visible publiquement une fois validée.
          </p>
        </div>
        <div class="fr-btns-group fr-btns-group--inline">
          <NuxtLink to="/ressources" class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line">
            Voir les ressources
          </NuxtLink>
          <NuxtLink
            :to="`/ressources/${route.params.id}`"
            class="fr-btn fr-btn--icon-left fr-icon-eye-line"
          >
            Voir la ressource
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Formulaire -->
    <div v-else class="fr-grid-row fr-grid-row--gutters">
      <!-- Colonne principale -->
      <div class="fr-col-12 fr-col-lg-8">

        <!-- En-tête -->
        <div class="rr-page-header fr-mb-4w">
          <h1 class="fr-h3 fr-mb-1w">
            <span class="fr-icon-edit-line fr-mr-1w" aria-hidden="true"></span>
            Modifier la ressource
          </h1>
          <p class="fr-text--sm fr-text--grey fr-mb-0">
            Modifiez votre ressource. Une fois soumise, elle sera
            <strong>resoumise à validation</strong> par un modérateur.
            Les champs marqués d'un <abbr title="obligatoire">*</abbr> sont obligatoires.
          </p>
        </div>

        <!-- Stepper -->
        <div class="fr-stepper fr-mb-5w" aria-label="Étapes du formulaire">
          <h2 class="fr-stepper__title">
            {{ ETAPES[etapeActive - 1]?.label ?? '' }}
            <span class="fr-stepper__state">Étape {{ etapeActive }} sur {{ ETAPES.length }}</span>
          </h2>
          <div class="fr-stepper__steps" :data-fr-current-step="etapeActive" :data-fr-steps="ETAPES.length"></div>
          <p class="fr-stepper__details">
            <span class="fr-text--bold">Étape suivante :</span>
            {{ etapeActive < ETAPES.length ? ETAPES[etapeActive]?.label : 'Publication' }}
          </p>
        </div>

        <!-- Erreur API -->
        <div v-if="apiError" class="fr-alert fr-alert--error fr-mb-3w" role="alert">
          <h2 class="fr-alert__title">Erreur lors de la modification</h2>
          <p>{{ apiError }}</p>
        </div>

        <!-- ================================================================
             ÉTAPE 1 — Informations générales
             ================================================================ -->
        <section v-show="etapeActive === 1" aria-labelledby="etape1-titre">
          <form @submit.prevent="etapeSuivante" novalidate>
            <fieldset class="fr-fieldset" aria-labelledby="etape1-titre">
              <legend id="etape1-titre" class="fr-fieldset__legend fr-h5 fr-mb-3w">
                <span class="fr-icon-information-line fr-mr-1w" aria-hidden="true"></span>
                Informations générales
              </legend>

              <!-- Titre -->
              <div class="fr-fieldset__element">
                <div class="fr-input-group" :class="{ 'fr-input-group--error': errors.titre }">
                  <label class="fr-label" for="titre">
                    Titre <span class="rr-required" aria-hidden="true">*</span>
                    <span class="fr-hint-text">Donnez un titre clair et descriptif à votre ressource</span>
                  </label>
                  <input
                    id="titre"
                    v-model="titre"
                    class="fr-input"
                    :class="{ 'fr-input--error': errors.titre }"
                    type="text"
                    :maxlength="TITRE_MAX"
                    autocomplete="off"
                    aria-describedby="titre-desc titre-error"
                    :aria-invalid="!!errors.titre"
                  />
                  <div id="titre-desc" class="fr-hint-text fr-mt-1v rr-counter" :class="{ 'rr-counter--warn': titreRestant < 30 }">
                    {{ titreRestant }} caractère{{ titreRestant > 1 ? 's' : '' }} restant{{ titreRestant > 1 ? 's' : '' }}
                  </div>
                  <p v-if="errors.titre" id="titre-error" class="fr-error-text">{{ errors.titre }}</p>
                </div>
              </div>

              <!-- Description -->
              <div class="fr-fieldset__element">
                <div class="fr-input-group">
                  <label class="fr-label" for="description">
                    Description
                    <span class="fr-hint-text">Optionnel — résumez votre ressource en quelques phrases</span>
                  </label>
                  <textarea
                    id="description"
                    v-model="description"
                    class="fr-input"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <!-- Type de ressource -->
              <div class="fr-fieldset__element">
                <div class="fr-select-group" :class="{ 'fr-select-group--error': errors.typeRessource }">
                  <label class="fr-label" for="type-ressource">
                    Type de ressource <span class="rr-required" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="type-ressource"
                    v-model="typeRessource"
                    class="fr-select"
                    :class="{ 'fr-select--error': errors.typeRessource }"
                    aria-describedby="type-ressource-error"
                    :aria-invalid="!!errors.typeRessource"
                  >
                    <option value="" disabled hidden>Sélectionnez un type</option>
                    <option v-for="opt in typesRessource" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                  <p v-if="errors.typeRessource" id="type-ressource-error" class="fr-error-text">
                    {{ errors.typeRessource }}
                  </p>
                </div>
              </div>

              <!-- Catégorie -->
              <div class="fr-fieldset__element">
                <div class="fr-select-group" :class="{ 'fr-select-group--error': errors.idCategorie }">
                  <label class="fr-label" for="categorie">
                    Catégorie <span class="rr-required" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="categorie"
                    v-model="idCategorie"
                    class="fr-select"
                    :class="{ 'fr-select--error': errors.idCategorie }"
                    aria-describedby="categorie-error"
                    :aria-invalid="!!errors.idCategorie"
                  >
                    <option value="" disabled hidden>Sélectionnez une catégorie</option>
                    <option v-for="cat in categories" :key="cat.idCategorie" :value="String(cat.idCategorie)">
                      {{ cat.nom }}
                    </option>
                  </select>
                  <p v-if="errors.idCategorie" id="categorie-error" class="fr-error-text">
                    {{ errors.idCategorie }}
                  </p>
                </div>
              </div>

              <!-- Type de relation -->
              <div class="fr-fieldset__element">
                <div class="fr-select-group">
                  <label class="fr-label" for="type-relation">
                    Type de relation
                    <span class="fr-hint-text">Optionnel — quel type de relation cette ressource concerne-t-elle ?</span>
                  </label>
                  <select id="type-relation" v-model="typeRelation" class="fr-select">
                    <option value="">Tous types de relation</option>
                    <option v-for="opt in typesRelation" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Niveau de difficulté -->
              <div class="fr-fieldset__element">
                <fieldset class="fr-fieldset fr-fieldset--inline" aria-labelledby="niveau-legend">
                  <legend id="niveau-legend" class="fr-fieldset__legend fr-text--regular">
                    Niveau de difficulté
                    <span class="fr-hint-text">Optionnel</span>
                  </legend>
                  <div
                    v-for="opt in niveauxDifficulte"
                    :key="opt.value"
                    class="fr-fieldset__element fr-fieldset__element--inline"
                  >
                    <div class="fr-radio-group">
                      <input
                        :id="`niveau-${opt.value}`"
                        v-model="niveauDifficulte"
                        type="radio"
                        name="niveau"
                        :value="opt.value"
                      />
                      <label :for="`niveau-${opt.value}`" class="fr-label">{{ opt.label }}</label>
                    </div>
                  </div>
                </fieldset>
              </div>

              <!-- Actions étape 1 -->
              <div class="fr-fieldset__element">
                <div class="fr-btns-group fr-btns-group--inline">
                  <NuxtLink to="/ressources" class="fr-btn fr-btn--secondary">
                    Annuler
                  </NuxtLink>
                  <button type="submit" class="fr-btn">
                    Étape suivante
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
        </section>

        <!-- ================================================================
             ÉTAPE 2 — Contenu
             ================================================================ -->
        <section v-show="etapeActive === 2" aria-labelledby="etape2-titre">
          <form @submit.prevent="etapeSuivante" novalidate>
            <fieldset class="fr-fieldset" aria-labelledby="etape2-titre">
              <legend id="etape2-titre" class="fr-fieldset__legend fr-h5 fr-mb-3w">
                <span class="fr-icon-file-text-line fr-mr-1w" aria-hidden="true"></span>
                Contenu de la ressource
              </legend>

              <!-- Contenu principal -->
              <div class="fr-fieldset__element">
                <div class="fr-input-group" :class="{ 'fr-input-group--error': errors.contenu }">
                  <label class="fr-label" for="contenu">
                    Contenu <span class="rr-required" aria-hidden="true">*</span>
                    <span class="fr-hint-text">
                      Décrivez votre ressource en détail : exercices, explications, conseils…
                    </span>
                  </label>
                  <textarea
                    id="contenu"
                    v-model="contenu"
                    class="fr-input rr-textarea-large"
                    :class="{ 'fr-input--error': errors.contenu }"
                    rows="10"
                    aria-describedby="contenu-error"
                    :aria-invalid="!!errors.contenu"
                  ></textarea>
                  <p v-if="errors.contenu" id="contenu-error" class="fr-error-text">{{ errors.contenu }}</p>
                </div>
              </div>

              <!-- Actions étape 2 -->
              <div class="fr-fieldset__element">
                <div class="fr-btns-group fr-btns-group--inline">
                  <button
                    type="button"
                    class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line"
                    @click="etapePrecedente"
                  >
                    Précédent
                  </button>
                  <button type="submit" class="fr-btn">
                    Étape suivante
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
        </section>

        <!-- ================================================================
             ÉTAPE 3 — Publication
             ================================================================ -->
        <section v-show="etapeActive === 3" aria-labelledby="etape3-titre">
          <fieldset class="fr-fieldset" aria-labelledby="etape3-titre">
            <legend id="etape3-titre" class="fr-fieldset__legend fr-h5 fr-mb-3w">
              <span class="fr-icon-send-plane-line fr-mr-1w" aria-hidden="true"></span>
              Options de publication
            </legend>

            <!-- Avertissement revalidation -->
            <div class="fr-fieldset__element">
              <div class="fr-callout fr-callout--blue-ecume fr-mb-3w">
                <p class="fr-callout__text">
                  <span class="fr-icon-information-line fr-mr-1w" aria-hidden="true"></span>
                  En soumettant cette modification, votre ressource sera
                  <strong>resoumise à validation</strong> par un modérateur avant d'être à nouveau visible publiquement.
                </p>
              </div>
            </div>

            <!-- Visibilité -->
            <div class="fr-fieldset__element">
              <fieldset class="fr-fieldset" aria-labelledby="visibilite-legend">
                <legend id="visibilite-legend" class="fr-fieldset__legend fr-text--regular fr-text--bold fr-mb-2w">
                  Visibilité de la ressource
                </legend>
                <div class="fr-grid-row fr-grid-row--gutters">
                  <div
                    v-for="opt in visibilites"
                    :key="opt.value"
                    class="fr-col-12 fr-col-md-4"
                  >
                    <div
                      class="rr-visibilite-card"
                      :class="{ 'rr-visibilite-card--active': visibilite === opt.value }"
                      @click="visibilite = opt.value"
                      role="button"
                      :tabindex="0"
                      @keydown.enter.prevent="visibilite = opt.value"
                      @keydown.space.prevent="visibilite = opt.value"
                    >
                      <div class="fr-radio-group rr-visibilite-radio">
                        <input
                          :id="`visibilite-${opt.value}`"
                          v-model="visibilite"
                          type="radio"
                          name="visibilite"
                          :value="opt.value"
                        />
                        <label :for="`visibilite-${opt.value}`" class="fr-label" @click.stop>
                          <span :class="[opt.icon, 'fr-mr-1w']" aria-hidden="true"></span>
                          {{ opt.label }}
                        </label>
                      </div>
                      <p class="fr-text--sm fr-text--grey fr-mb-0 fr-mt-1w rr-visibilite-desc">
                        {{ opt.desc }}
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <!-- Récap -->
            <div class="fr-fieldset__element">
              <div class="fr-p-3w rr-recap-block fr-mb-2w">
                <h3 class="fr-text--bold fr-mb-2w">
                  <span class="fr-icon-list-unordered fr-mr-1w" aria-hidden="true"></span>
                  Récapitulatif
                </h3>
                <dl class="rr-recap-list">
                  <div class="rr-recap-row">
                    <dt>Titre</dt>
                    <dd>{{ titre || '—' }}</dd>
                  </div>
                  <div class="rr-recap-row">
                    <dt>Type</dt>
                    <dd>{{ typesRessource.find(t => t.value === typeRessource)?.label || '—' }}</dd>
                  </div>
                  <div class="rr-recap-row">
                    <dt>Catégorie</dt>
                    <dd>{{ categories.find(c => String(c.idCategorie) === idCategorie)?.nom || '—' }}</dd>
                  </div>
                  <div class="rr-recap-row">
                    <dt>Relation</dt>
                    <dd>{{ typesRelation.find(t => t.value === typeRelation)?.label || '—' }}</dd>
                  </div>
                  <div class="rr-recap-row">
                    <dt>Niveau</dt>
                    <dd>{{ niveauxDifficulte.find(n => n.value === niveauDifficulte)?.label || '—' }}</dd>
                  </div>
                  <div class="rr-recap-row">
                    <dt>Visibilité</dt>
                    <dd>{{ visibilites.find(v => v.value === visibilite)?.label || '—' }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Actions étape 3 -->
            <div class="fr-fieldset__element">
              <div class="fr-btns-group fr-btns-group--right">
                <button
                  type="button"
                  class="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line"
                  :disabled="isSubmitting"
                  @click="etapePrecedente"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  class="fr-btn fr-btn--icon-left fr-icon-send-plane-line"
                  :aria-busy="isSubmitting ? 'true' : 'false'"
                  :disabled="isSubmitting"
                  @click="onSubmit()"
                >
                  {{ isSubmitting ? 'Soumission…' : 'Soumettre la modification' }}
                </button>
              </div>
            </div>
          </fieldset>
        </section>

      </div>

      <!-- Colonne latérale — aide contextuelle -->
      <div class="fr-col-12 fr-col-lg-4">
        <aside class="fr-p-3w rr-side-help" aria-label="Aide à la modification">
          <h2 class="fr-h6 fr-mb-2w">
            <span class="fr-icon-question-line fr-mr-1w" aria-hidden="true"></span>
            Aide
          </h2>

          <template v-if="etapeActive === 1">
            <p class="fr-text--sm fr-mb-2w">
              <strong>Étape 1 :</strong> Modifiez les informations essentielles de votre ressource.
            </p>
            <ul class="fr-text--sm rr-help-list">
              <li>Le <strong>titre</strong> doit être court et explicite.</li>
              <li>La <strong>catégorie</strong> facilite la recherche par d'autres utilisateurs.</li>
              <li>Le <strong>type de relation</strong> permet de cibler votre public.</li>
            </ul>
          </template>

          <template v-else-if="etapeActive === 2">
            <p class="fr-text--sm fr-mb-2w">
              <strong>Étape 2 :</strong> Modifiez le contenu de votre ressource.
            </p>
            <ul class="fr-text--sm rr-help-list">
              <li>Le <strong>contenu</strong> est le cœur de votre ressource — soyez précis et détaillé.</li>
            </ul>
          </template>

          <template v-else>
            <p class="fr-text--sm fr-mb-2w">
              <strong>Étape 3 :</strong> Confirmez et soumettez vos modifications.
            </p>
            <ul class="fr-text--sm rr-help-list">
              <li>Après soumission, votre ressource sera <strong>en attente de validation</strong> par un modérateur.</li>
              <li>Elle ne sera plus visible publiquement tant qu'elle n'est pas revalidée.</li>
            </ul>
          </template>

          <hr class="fr-hr fr-my-2w" />

          <!-- Progression visuelle -->
          <p class="fr-text--sm fr-text--bold fr-mb-1w">Progression</p>
          <div class="rr-progress">
            <div
              v-for="etape in ETAPES"
              :key="etape.id"
              class="rr-progress-step"
              :class="{
                'rr-progress-step--done': etape.id < etapeActive,
                'rr-progress-step--active': etape.id === etapeActive,
              }"
            >
              <div class="rr-progress-dot">
                <span
                  v-if="etape.id < etapeActive"
                  class="fr-icon-check-line fr-icon--xs"
                  aria-hidden="true"
                ></span>
                <span v-else>{{ etape.id }}</span>
              </div>
              <span class="fr-text--sm rr-progress-label">{{ etape.label }}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.rr-page-header {
  border-bottom: 2px solid var(--border-default-grey);
  padding-bottom: 1.5rem;
}

.rr-required {
  color: var(--error-425-625);
  margin-left: 0.25rem;
}

.rr-counter {
  text-align: right;
  color: var(--text-mention-grey);
  font-size: 0.75rem;
}
.rr-counter--warn {
  color: var(--warning-425-625);
  font-weight: 600;
}

.rr-textarea-large {
  min-height: 220px;
  resize: vertical;
}

.rr-visibilite-card {
  border: 2px solid var(--border-default-grey);
  padding: 1rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  height: 100%;
}

.rr-visibilite-card:hover {
  border-color: var(--blue-france-sun-113-625);
  background: var(--background-alt-blue-france);
}

.rr-visibilite-card--active {
  border-color: var(--blue-france-sun-113-625);
  background: var(--background-alt-blue-france);
}

.rr-visibilite-radio {
  pointer-events: none;
}

.rr-visibilite-desc {
  padding-left: 1.5rem;
}

.rr-recap-block {
  background: var(--background-alt-grey);
  border: 1px solid var(--border-default-grey);
}

.rr-recap-list {
  margin: 0;
  padding: 0;
}

.rr-recap-row {
  display: flex;
  gap: 1rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--border-default-grey);
  font-size: 0.875rem;
}

.rr-recap-row:last-child {
  border-bottom: none;
}

.rr-recap-row dt {
  flex: 0 0 110px;
  font-weight: 600;
  color: var(--text-mention-grey);
}

.rr-recap-row dd {
  flex: 1;
  margin: 0;
  word-break: break-word;
}

.rr-side-help {
  border: 1px solid var(--border-default-grey);
  background: var(--background-alt-grey);
  position: sticky;
  top: 1.5rem;
}

.rr-help-list {
  padding-left: 1.25rem;
  line-height: 1.7;
}

.rr-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rr-progress-step {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  opacity: 0.45;
}

.rr-progress-step--active,
.rr-progress-step--done {
  opacity: 1;
}

.rr-progress-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--border-default-grey);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--background-default-grey);
  color: var(--text-mention-grey);
}

.rr-progress-step--active .rr-progress-dot {
  background: var(--blue-france-sun-113-625);
  border-color: var(--blue-france-sun-113-625);
  color: #fff;
}

.rr-progress-step--done .rr-progress-dot {
  background: var(--success-425-625);
  border-color: var(--success-425-625);
  color: #fff;
}

.rr-progress-label {
  color: var(--text-label-grey);
}

.rr-progress-step--active .rr-progress-label {
  font-weight: 700;
  color: var(--text-title-grey);
}

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
  to { transform: rotate(360deg); }
}
</style>
