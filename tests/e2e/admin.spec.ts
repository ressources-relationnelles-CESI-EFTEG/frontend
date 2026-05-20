import { test, expect } from '@playwright/test'
import { loginAs } from './utils/auth'

const USER_EMAIL = 'Citoyen@test.fr'
const USER_PASSWORD = 'testtest'

const ADMIN_EMAIL = 'Adminadmin@test.fr'
const ADMIN_PASSWORD = 'testtest'

test('accès autorisé admin à la page /admin', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)

  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: /gestion des comptes/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /nouveau compte/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /actualiser/i })).toBeVisible()
})

test('refus d accès admin pour un user normal', async ({ page }) => {
  await loginAs(page, USER_EMAIL, USER_PASSWORD)

  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  await expect(page).not.toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: /gestion des comptes/i })).not.toBeVisible()
})

test('gestion users admin : créer puis supprimer un compte utilisateur', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)

  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveURL(/\/admin$/)

  await page.getByRole('button', { name: /nouveau compte/i }).click()
  await expect(page.getByRole('heading', { name: /créer un compte/i })).toBeVisible()

  const unique = Date.now()
  const email = `admin-created-${unique}@example.com`

  await page.locator('#prenom').fill('Test')
  await page.locator('#nom').fill('Admin')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill('testtest')
  await page.locator('#confirmPassword').fill('testtest')
  await page.locator('#role').selectOption('CITOYEN')
  await page.locator('#statut').selectOption('ACTIF')

  const createButton = page.getByRole('button', { name: /créer le compte/i })
  await expect(createButton).toBeVisible()
  await expect(createButton).toBeEnabled()

  await createButton.click()

  const createdRow = page.locator('tbody tr').filter({ hasText: email })
  const errorAlert = page.locator('.fr-alert--error')

  await Promise.race([
    createdRow.waitFor({ state: 'visible', timeout: 15000 }),
    errorAlert.waitFor({ state: 'visible', timeout: 15000 }),
  ])

  if (await errorAlert.isVisible()) {
    const errorText = await errorAlert.textContent()
    throw new Error(`Création admin en erreur: ${errorText}`)
  }

  await expect(createdRow).toBeVisible()

  page.once('dialog', async (dialog) => {
    await dialog.accept()
  })

  await createdRow.getByRole('button', { name: /supprimer/i }).click()

  await expect(page.getByText(/le compte a bien été supprimé/i)).toBeVisible({ timeout: 15000 })
  await expect(page.locator('tbody tr').filter({ hasText: email })).not.toBeVisible()
})