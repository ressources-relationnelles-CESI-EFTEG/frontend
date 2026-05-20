import { test, expect } from '@playwright/test'

test('le tableau de bord affiche au minimum sa structure principale après authentification', async ({ page }) => {
  const unique = Date.now()
  const email = `elie.dashboard.${unique}@example.com`
  const password = 'password123'

  await page.goto('/inscription')
  await page.waitForLoadState('networkidle')

  await page.locator('#firstname').fill('Elie')
  await page.locator('#lastname').fill('Dashboard')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('#confirmPassword').fill(password)

  const submitButton = page.getByRole('button', { name: /créer un compte/i })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()

  await Promise.all([
    page.waitForURL(/\/tableau-de-bord/, { timeout: 15000 }),
    submitButton.click(),
  ])

  await expect(page.getByRole('link', { name: /modifier mon profil/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /mon évolution/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /ressources recommandées/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /prochaine séance/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /messages récents/i })).toBeVisible()
})