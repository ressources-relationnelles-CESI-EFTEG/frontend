<script setup lang="ts">
import { FetchError } from 'ofetch';

const { getUser, updateUser } = useApi();
const auth = useAuth();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  description: '',
  phraseAccroche: '',
  region: '',
});

const regions = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  "Provence-Alpes-Côte d'Azur",
  'Guadeloupe',
  'Guyane',
  'Martinique',
  'Mayotte',
  'La Réunion',
];

onMounted(async () => {
  if (!auth.user.value) return;

  try {
    const user = await getUser(auth.user.value.idUtilisateur);
    form.prenom = user.prenom ?? '';
    form.nom = user.nom ?? '';
    form.email = user.email;
    form.telephone = user.telephone ?? '';
    form.description = user.description ?? '';
    form.phraseAccroche = user.phraseAccroche ?? '';
    form.region = user.region ?? '';
  } catch (error) {
    console.error('Failed to load profile:', error);
    errorMessage.value = 'Impossible de charger le profil.';
  } finally {
    loading.value = false;
  }
});

async function onSubmit() {
  if (!auth.user.value) return;

  errorMessage.value = '';
  successMessage.value = '';
  saving.value = true;

  try {
    const updatedUser = await updateUser(auth.user.value.idUtilisateur, {
      prenom: form.prenom || undefined,
      nom: form.nom || undefined,
      email: form.email || undefined,
      telephone: form.telephone || undefined,
      description: form.description || undefined,
      phraseAccroche: form.phraseAccroche || undefined,
      region: form.region || undefined,
    });

    auth.login(auth.token.value!, updatedUser);
    successMessage.value = 'Profil mis à jour avec succès.';
  } catch (error: unknown) {
    if (error instanceof FetchError && error.status === 400) {
      const apiMessage = Array.isArray(error.data?.message)
        ? error.data.message.join(', ')
        : typeof error.data?.message === 'string'
          ? error.data.message
          : null;
      errorMessage.value = apiMessage ?? 'Données invalides.';
    } else {
      errorMessage.value = 'Erreur lors de la mise à jour du profil.';
    }
    console.error('Profile update failed:', error);
  } finally {
    saving.value = false;
  }
}

function onLogout() {
  auth.logout();
  navigateTo('/sign-in');
}
</script>

<template>
  <main class="profile-page">
    <h1>Mon compte</h1>

    <p v-if="loading" class="loading">Chargement du profil...</p>

    <form v-else @submit.prevent="onSubmit" class="profile-form">
      <div class="form-group">
        <label for="prenom">Prénom</label>
        <input id="prenom" v-model="form.prenom" type="text" />
      </div>

      <div class="form-group">
        <label for="nom">Nom</label>
        <input id="nom" v-model="form.nom" type="text" />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" v-model="form.email" type="email" />
      </div>

      <div class="form-group">
        <label for="telephone">Téléphone</label>
        <input id="telephone" v-model="form.telephone" type="tel" />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" v-model="form.description" rows="4"></textarea>
      </div>

      <div class="form-group">
        <label for="phraseAccroche">Phrase d'accroche</label>
        <input id="phraseAccroche" v-model="form.phraseAccroche" type="text" />
      </div>

      <div class="form-group">
        <label for="region">Région</label>
        <select id="region" v-model="form.region">
          <option value="">-- Sélectionner une région --</option>
          <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>

      <div class="actions">
        <button type="submit" :disabled="saving" class="btn-save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
        </button>
        <button type="button" class="btn-logout" @click="onLogout">
          Se déconnecter
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.loading {
  text-align: center;
  color: #666;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.message {
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.message.error {
  background: #fee;
  color: #c00;
}

.message.success {
  background: #efe;
  color: #060;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-save {
  padding: 0.6rem 1.2rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-logout {
  padding: 0.6rem 1.2rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
</style>
