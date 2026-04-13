import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import AccueilPage from '~/pages/accueil.vue'

const {
  routerAfterEachMock,
  routerBeforeEachMock,
  routerBeforeResolveMock,
  routerReplaceMock,
  routerPushMock,
  routerOnErrorMock,
  logoutMock,
} = vi.hoisted(() => ({
  routerAfterEachMock: vi.fn(),
  routerBeforeEachMock: vi.fn(),
  routerBeforeResolveMock: vi.fn(),
  routerReplaceMock: vi.fn(async () => {}),
  routerPushMock: vi.fn(async () => {}),
  routerOnErrorMock: vi.fn(),
  logoutMock: vi.fn(),
}))

let isLoggedInValue = false

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
        fullPath: '/accueil',
        path: '/accueil',
        name: 'accueil',
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
    isLoggedIn: {
      get value() {
        return isLoggedInValue
      },
    },
    logout: logoutMock,
  }),
}))

async function mountPage() {
  return mountSuspended(AccueilPage, {
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

describe('page accueil', () => {
  beforeEach(() => {
    routerAfterEachMock.mockClear()
    routerBeforeEachMock.mockClear()
    routerBeforeResolveMock.mockClear()
    routerReplaceMock.mockClear()
    routerPushMock.mockClear()
    routerOnErrorMock.mockClear()
    logoutMock.mockClear()
    isLoggedInValue = false
  })

  it('affiche le contenu principal de la page', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Des ressources fiables pour accompagner vos relations personnelles et sociales')
    expect(wrapper.text()).toContain('Découvrir les ressources')
    expect(wrapper.text()).toContain('Accès rapides')
  })

  it('affiche les accès rapides attendus', async () => {
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('Découvrir mes ressources')
    expect(wrapper.text()).toContain('Ajouter une ressource')
    expect(wrapper.text()).toContain('Dernières ressources')
    expect(wrapper.text()).toContain('Ressources recommandées')
    expect(wrapper.text()).toContain('Rechercher une ressource')
  })

  it('fait défiler à gauche', async () => {
    const wrapper = await mountPage()
    const list = wrapper.find('.rr-carousel')

    const scrollByMock = vi.fn()
    Object.defineProperty(list.element, 'scrollBy', {
      value: scrollByMock,
      writable: true,
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(scrollByMock).toHaveBeenCalledWith({ left: -320, behavior: 'smooth' })
  })

  it('fait défiler à droite', async () => {
    const wrapper = await mountPage()
    const list = wrapper.find('.rr-carousel')

    const scrollByMock = vi.fn()
    Object.defineProperty(list.element, 'scrollBy', {
      value: scrollByMock,
      writable: true,
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(scrollByMock).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' })
  })
})