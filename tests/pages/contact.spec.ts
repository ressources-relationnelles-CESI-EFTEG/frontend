import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ContactPage from '~/pages/contact.vue'
import { nextTick } from 'vue'

async function mountPage() {
  return await mountSuspended(ContactPage, {
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

describe('page contact', () => {
  it('affiche le titre et le formulaire', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Contactez-nous')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Prénom')
    expect(wrapper.text()).toContain('Nom')
    expect(wrapper.text()).toContain('Adresse e-mail')
    expect(wrapper.text()).toContain('Objet')
    expect(wrapper.text()).toContain('Message')
  })

  it('affiche les erreurs si le formulaire est vide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Veuillez renseigner votre prénom.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre nom.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre adresse e-mail.')
    expect(wrapper.text()).toContain('Veuillez renseigner un objet.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre message.')
  })

  it('affiche une erreur si email invalide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('email-invalide')
    await wrapper.find('#subject').setValue('Sujet')
    await wrapper.find('#message').setValue('Bonjour')

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Veuillez saisir une adresse e-mail valide.')
  })

  it('affiche un message de succès si le formulaire est valide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#subject').setValue('Sujet')
    await wrapper.find('#message').setValue('Bonjour')

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect(wrapper.text()).toContain('Message envoyé')
    expect(wrapper.text()).toContain('Votre message a bien été envoyé.')
  })

  it('vide les champs après soumission valide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#subject').setValue('Sujet')
    await wrapper.find('#message').setValue('Bonjour')

    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()

    expect((wrapper.find('#firstname').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#lastname').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#subject').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#message').element as HTMLTextAreaElement).value).toBe('')
  })

  it('réinitialise les champs et les erreurs avec le bouton Réinitialiser', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#subject').setValue('Sujet')
    await wrapper.find('#message').setValue('Bonjour')

    const resetButton = wrapper.find('button.fr-btn--secondary')
    await resetButton.trigger('click')
    await nextTick()

    expect((wrapper.find('#firstname').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#lastname').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#email').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#subject').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('#message').element as HTMLTextAreaElement).value).toBe('')

    expect(wrapper.text()).not.toContain('Veuillez renseigner votre prénom.')
    expect(wrapper.text()).not.toContain('Veuillez renseigner votre nom.')
    expect(wrapper.text()).not.toContain('Veuillez renseigner votre adresse e-mail.')
    expect(wrapper.text()).not.toContain('Veuillez renseigner un objet.')
    expect(wrapper.text()).not.toContain('Veuillez renseigner votre message.')
  })
})