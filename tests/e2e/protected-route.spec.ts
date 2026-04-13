import { test, expect } from '@playwright/test'

test('redirige vers /connexion si on tente d accéder au tableau de bord sans être connecté', async ({ page }) => {
  await page.goto('/tableau-de-bord')

  await expect(page).toHaveURL(/\/connexion/)
  await expect(page.getByRole('heading', { name: /connexion à ressources relationnelles/i })).toBeVisible()
})