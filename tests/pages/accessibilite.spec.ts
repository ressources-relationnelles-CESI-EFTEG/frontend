import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AccessibilitePage from '~/pages/accessibilite.vue'

async function mountPage() {
  return mountSuspended(AccessibilitePage, {
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : to?.path || \'#\'"><slot /></a>',
        },
        RouterLink: {
          props: ['to'],
          template: '<a :href="typeof to === \'string\' ? to : to?.path || \'#\'"><slot /></a>',
        },
      },
    },
  })
}

describe('page accessibilite', () => {
  it('affiche le contenu principal', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Accessibilité')
    expect(wrapper.text()).toContain('Ressources relationnelles s’inscrit dans une démarche de conception accessible')
    expect(wrapper.text()).toContain('État de conformité')
    expect(wrapper.text()).toContain('Le site est actuellement en cours d’amélioration continue')
  })

  it('affiche le lien vers la page de contact', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Nous contacter')
    expect(wrapper.text()).toContain('Contactez-nous')
  })
})