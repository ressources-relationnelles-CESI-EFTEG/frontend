import { expect, Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/connexion')
  await page.waitForLoadState('networkidle')

  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)

  const submitButton = page.getByRole('button', { name: /se connecter/i })
  await expect(submitButton).toBeVisible()
  await expect(submitButton).toBeEnabled()

  await Promise.all([
    page.waitForURL(/\/tableau-de-bord/, { timeout: 15000 }),
    submitButton.click(),
  ])

  await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible()
}