import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AidePage from '~/pages/aide.vue'

async function mountPage() {
  return mountSuspended(AidePage, {
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

describe('page aide', () => {
  it('affiche le contenu principal', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Aide')
    expect(wrapper.text()).toContain('Cette page rassemble les principales informations pour vous aider à utiliser la plateforme Ressources relationnelles.')
    expect(wrapper.text()).toContain('À quoi sert la plateforme ?')
    expect(wrapper.text()).toContain('Comment se connecter ?')
    expect(wrapper.text()).toContain('Comment créer un compte ?')
    expect(wrapper.text()).toContain('Où retrouver mes ressources ?')
    expect(wrapper.text()).toContain('Que faire en cas de problème ?')
  })

  it('affiche les accès rapides attendus', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Connexion')
    expect(wrapper.text()).toContain('Inscription')
    expect(wrapper.text()).toContain('Mes ressources')
    expect(wrapper.text()).toContain('Contactez-nous')
    expect(wrapper.text()).toContain('Accessibilité')
  })
})