<script setup lang="ts">
import { FetchError } from 'ofetch';

const { signUp } = useApi();
const auth = useAuth();

const prenom = ref('');
const nom = ref('');
const email = ref('');
const password = ref('');
const repeatPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const response = await signUp({
      prenom: prenom.value,
      nom: nom.value,
      email: email.value,
      password: password.value,
      repeatPassword: repeatPassword.value,
    });

    auth.login(response.data.accessToken, response.data.user);
    await navigateTo('/profile');
  } catch (error: unknown) {
    if (error instanceof FetchError && error.status === 400) {
      const apiMessage = Array.isArray(error.data?.message)
        ? error.data.message.join(', ')
        : typeof error.data?.message === 'string'
          ? error.data.message
          : null;
      errorMessage.value =
        apiMessage ?? 'Formulaire invalide. Vérifie les champs.';
    } else if (error instanceof FetchError && error.status === 409) {
      errorMessage.value = 'Un compte existe déjà avec cet email.';
    } else if (error instanceof FetchError) {
      errorMessage.value = `Erreur API (${error.status ?? 'unknown'}). Vérifie que le backend tourne sur ${useRuntimeConfig().public.apiBase}.`;
    } else {
      errorMessage.value = "Erreur inconnue pendant l'inscription.";
    }

    console.error('Sign-up failed:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Sign up</h1>

    <form @submit.prevent="onSubmit">
      <div>
        <label for="prenom">Prenom</label>
        <input
          id="prenom"
          v-model="prenom"
          type="text"
          name="prenom"
          autocomplete="given-name"
          required
        />
      </div>

      <div>
        <label for="nom">Nom</label>
        <input
          id="nom"
          v-model="nom"
          type="text"
          name="nom"
          autocomplete="family-name"
          required
        />
      </div>

      <div>
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          required
        />
      </div>

      <div>
        <label for="password">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
        />
      </div>

      <div>
        <label for="repeat-password">Confirmer le mot de passe</label>
        <input
          id="repeat-password"
          v-model="repeatPassword"
          type="password"
          name="repeat-password"
          autocomplete="new-password"
          required
        />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Création...' : "S'inscrire" }}
      </button>
    </form>

    <p v-if="errorMessage">{{ errorMessage }}</p>
  </main>
</template>
