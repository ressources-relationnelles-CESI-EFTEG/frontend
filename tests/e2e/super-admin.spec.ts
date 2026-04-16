import { test, expect } from '@playwright/test'
import { loginAs } from './utils/auth'

const USER_EMAIL = 'Citoyen@test.fr'
const USER_PASSWORD = 'testtest'

const SUPER_ADMIN_EMAIL = 'SuperAdmin@test.fr'
const SUPER_ADMIN_PASSWORD = 'testtest'

const ADMIN_EMAIL = 'Adminadmin@test.fr'

test('accès autorisé super admin à la page /super-admin', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)

  await page.goto('/super-admin')
  await page.waitForLoadState('networkidle')

  await expect(page.getByRole('heading', { name: /gestion des super_admin/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /actualiser/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /^rechercher$/i })).toBeVisible()
})

test('refus d accès super admin pour un user normal', async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD)

  await page.goto('/super-admin')
  await page.waitForLoadState('networkidle')

  await expect(page).not.toHaveURL(/\/super-admin$/)
  await expect(page.getByRole('heading', { name: /gestion des super_admin/i })).not.toBeVisible()
})

test('super admin : rechercher un compte existant', async ({ page }) => {
  await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD)

  await page.goto('/super-admin')
  await page.waitForLoadState('networkidle')

  await page.locator('#search-users-input').fill(ADMIN_EMAIL)
  await page.getByRole('button', { name: /^rechercher$/i }).click()

  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible({ timeout: 15000 })
})