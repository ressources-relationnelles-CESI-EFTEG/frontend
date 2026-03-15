<template>
  <section class="fr-mt-6w" aria-labelledby="quicklinks-title">
    <h2 id="quicklinks-title" class="fr-h2">Accès rapides</h2>

    <div class="rr-carousel-wrapper">
      <button
        class="fr-btn fr-btn--secondary fr-icon-arrow-left-line"
        type="button"
        @click="scrollLeft"
        aria-label="Faire défiler vers la gauche"
      />

      <ul ref="listEl" class="rr-carousel">
        <li v-for="item in items" :key="item.id" class="rr-carousel-item">
          <NuxtLink class="fr-tile fr-enlarge-link" :to="item.to">
            <div class="fr-tile__body">
              <h3 class="fr-tile__title">
                <span class="fr-tile__link">{{ item.title }}</span>
              </h3>
            </div>
            <div class="fr-tile__img">
              <span :class="item.icon" aria-hidden="true"></span>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <button
        class="fr-btn fr-btn--secondary fr-icon-arrow-right-line"
        type="button"
        @click="scrollRight"
        aria-label="Faire défiler vers la droite"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: {
    id: string
    title: string
    to: string
    icon: string
  }[]
}>()

const listEl = ref<HTMLElement | null>(null)

function scrollLeft() {
  listEl.value?.scrollBy({ left: -300, behavior: 'smooth' })
}

function scrollRight() {
  listEl.value?.scrollBy({ left: 300, behavior: 'smooth' })
}
</script>

<style scoped>
.rr-carousel-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rr-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0;
  list-style: none;
}

.rr-carousel-item {
  flex: 0 0 auto;
  width: 260px;
}
</style>