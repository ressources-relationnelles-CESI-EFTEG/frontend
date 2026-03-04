<script setup lang="ts">
import { FetchError } from 'ofetch';

const { signIn } = useApi();
const auth = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function onSubmit() {
  errorMessage.value = '';
  loading.value = true;

  try {
    const response = await signIn({
      email: email.value,
      password: password.value,
    });

    auth.login(response.data.accessToken, response.data.user);
    await navigateTo('/profile');
  } catch (error: unknown) {
    if (error instanceof FetchError && error.status === 401) {
      errorMessage.value = 'Identifiants invalides.';
    } else if (error instanceof FetchError) {
      errorMessage.value = `Erreur API (${error.status ?? 'unknown'}). Vérifie que le backend tourne sur ${useRuntimeConfig().public.apiBase}.`;
    } else {
      errorMessage.value = 'Erreur inconnue pendant la connexion.';
    }

    console.error('Sign-in failed:', error);
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
  </main>
</template>
