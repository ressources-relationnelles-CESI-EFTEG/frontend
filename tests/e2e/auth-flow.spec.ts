import { test, expect } from '@playwright/test'

test('inscription puis connexion automatique puis accès au tableau de bord', async ({ page }) => {
  const unique = Date.now()
  const email = `elie.test.${unique}@example.com`
  const password = 'password123'

  await page.goto('/inscription')
  await page.waitForLoadState('networkidle')

  await page.locator('#firstname').fill('Elie')
  await page.locator('#lastname').fill('Test')
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

  await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible()
})