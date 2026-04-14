import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import InscriptionPage from '~/pages/inscription.vue'

const {
  navigateToMock,
  loginMock,
  fetchMock,
  routerAfterEachMock,
  routerBeforeEachMock,
  routerBeforeResolveMock,
  routerReplaceMock,
  routerPushMock,
  routerOnErrorMock,
} = vi.hoisted(() => ({
  navigateToMock: vi.fn((path: string) => path),
  loginMock: vi.fn(),
  fetchMock: vi.fn(),
  routerAfterEachMock: vi.fn(),
  routerBeforeEachMock: vi.fn(),
  routerBeforeResolveMock: vi.fn(),
  routerReplaceMock: vi.fn(async () => {}),
  routerPushMock: vi.fn(async () => {}),
  routerOnErrorMock: vi.fn(),
}))

let isLoggedInValue = false

vi.stubGlobal('$fetch', fetchMock)

mockNuxtImport('useRuntimeConfig', () => {
  return () => ({
    app: {
      baseURL: '/',
    },
    public: {
      apiBase: 'http://localhost:3000',
    },
  })
})

mockNuxtImport('navigateTo', () => {
  return navigateToMock
})

mockNuxtImport('useRouter', () => {
  return () => ({
    beforeEach: routerBeforeEachMock,
    beforeResolve: routerBeforeResolveMock,
    afterEach: routerAfterEachMock,
    onError: routerOnErrorMock,
    replace: routerReplaceMock,
    push: routerPushMock,
    resolve: (to: any) => ({
      href: typeof to === 'string' ? to : to?.path || '/',
      fullPath: typeof to === 'string' ? to : to?.path || '/',
      path: typeof to === 'string' ? to : to?.path || '/',
      matched: [],
      meta: {},
      name: undefined,
      params: {},
      query: {},
      hash: '',
    }),
    currentRoute: {
      value: {
        fullPath: '/inscription',
        path: '/inscription',
        name: 'inscription',
        params: {},
        query: {},
        hash: '',
        matched: [],
        meta: {},
      },
    },
    options: {
      history: {
        base: '/',
      },
    },
  })
})

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    login: loginMock,
    isLoggedIn: {
      get value() {
        return isLoggedInValue
      },
    },
  }),
}))

async function mountPage() {
  return mountSuspended(InscriptionPage, {
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

describe('page inscription', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    loginMock.mockClear()
    fetchMock.mockReset()
    routerAfterEachMock.mockClear()
    routerBeforeEachMock.mockClear()
    routerBeforeResolveMock.mockClear()
    routerReplaceMock.mockClear()
    routerPushMock.mockClear()
    routerOnErrorMock.mockClear()
    isLoggedInValue = false
  })

  it('affiche le titre et le formulaire', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Inscription à Ressources relationnelles')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Prénom')
    expect(wrapper.text()).toContain('Nom')
    expect(wrapper.text()).toContain('Adresse e-mail')
    expect(wrapper.text()).toContain('Mot de passe')
    expect(wrapper.text()).toContain('Confirmer le mot de passe')
    expect(wrapper.text()).toContain('Créer un compte')
  })

  it('affiche les erreurs si le formulaire est vide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Veuillez renseigner votre prénom.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre nom.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre adresse e-mail.')
    expect(wrapper.text()).toContain('Veuillez renseigner votre mot de passe.')
    expect(wrapper.text()).toContain('Veuillez confirmer votre mot de passe.')
  })

  it('affiche une erreur si email invalide', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('abc')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Veuillez saisir une adresse e-mail valide.')
  })

  it('affiche une erreur si mot de passe trop court', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('1234567')
    await wrapper.find('#confirmPassword').setValue('1234567')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Le mot de passe doit contenir au moins 8 caractères.')
  })

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('different123')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Les mots de passe ne correspondent pas.')
  })

  it('appelle register puis login, stocke la session et redirige si formulaire valide', async () => {
    fetchMock
      .mockResolvedValueOnce({
        message: 'Compte créé avec succès',
        user: {
          id: 1,
          firstname: 'Elie',
          lastname: 'Test',
          email: 'elie@test.fr',
          role: 'user',
        },
      })
      .mockResolvedValueOnce({
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
        user: {
          id: 1,
          firstname: 'Elie',
          lastname: 'Test',
          email: 'elie@test.fr',
          role: 'user',
        },
      })

    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/auth/register', {
      baseURL: 'http://localhost:3000',
      method: 'POST',
      body: {
        firstname: 'Elie',
        lastname: 'Test',
        email: 'elie@test.fr',
        password: 'password123',
        confirmPassword: 'password123',
      },
    })

    expect(fetchMock).toHaveBeenNthCalledWith(2, '/auth/login', {
      baseURL: 'http://localhost:3000',
      method: 'POST',
      body: {
        email: 'elie@test.fr',
        password: 'password123',
      },
    })

    expect(loginMock).toHaveBeenCalledWith({
      accessToken: 'token-123',
      refreshToken: 'refresh-456',
      user: {
        id: 1,
        firstname: 'Elie',
        lastname: 'Test',
        email: 'elie@test.fr',
        role: 'user',
      },
    })

    expect(navigateToMock).toHaveBeenCalledWith('/tableau-de-bord')
  })

  it('affiche le message API si le backend renvoie une string', async () => {
    fetchMock.mockRejectedValueOnce({
      data: {
        message: 'Adresse e-mail déjà utilisée',
      },
    })

    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Inscription impossible')
    expect(wrapper.text()).toContain('Adresse e-mail déjà utilisée')
  })

  it('affiche les messages API concaténés si le backend renvoie un tableau', async () => {
    fetchMock.mockRejectedValueOnce({
      data: {
        message: ['Erreur 1', 'Erreur 2'],
      },
    })

    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Erreur 1 Erreur 2')
  })

  it('affiche le message générique si le backend ne renvoie rien d exploitable', async () => {
    fetchMock.mockRejectedValueOnce({})

    const wrapper = await mountPage()

    await wrapper.find('#firstname').setValue('Elie')
    await wrapper.find('#lastname').setValue('Test')
    await wrapper.find('#email').setValue('elie@test.fr')
    await wrapper.find('#password').setValue('password123')
    await wrapper.find('#confirmPassword').setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('L’inscription a échoué. Veuillez réessayer.')
  })
})