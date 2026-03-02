<script setup lang="ts">
import { FetchError } from 'ofetch';

const { signIn } = useApi();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const accessToken = ref('');
const signedInUser = ref<{ prenom: string | null; nom: string | null; email: string } | null>(null);

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const response = await signIn({
      email: email.value,
      password: password.value,
    });

    accessToken.value = response.data.accessToken;
    signedInUser.value = {
      prenom: response.data.user.prenom,
      nom: response.data.user.nom,
      email: response.data.user.email,
    };
  } catch (error: unknown) {
    if (error instanceof FetchError && error.status === 401) {
      errorMessage.value = 'Identifiants invalides.';
    } else if (error instanceof FetchError) {
      errorMessage.value = `Erreur API (${error.status ?? 'unknown'}). Vérifie que le backend tourne sur ${useRuntimeConfig().public.apiBase}.`;
    } else {
      errorMessage.value = 'Erreur inconnue pendant la connexion.';
    }

    console.error('Sign-in failed:', error);
    accessToken.value = '';
    signedInUser.value = null;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main>
    <h1>Sign in</h1>

    <form @submit.prevent="onSubmit">
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

      <button type="submit" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>

    <p v-if="errorMessage">{{ errorMessage }}</p>

    <section v-if="signedInUser">
      <h2>Connecté</h2>
      <p>{{ signedInUser.prenom }} {{ signedInUser.nom }} ({{ signedInUser.email }})</p>
      <p>Token: {{ accessToken }}</p>
    </section>
  </main>
</template>
