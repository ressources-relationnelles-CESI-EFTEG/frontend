import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('accessibilité - page connexion', async ({ page }) => {
  await page.goto('/connexion')

  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})

test('accessibilité - page inscription', async ({ page }) => {
  await page.goto('/inscription')

  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})

test('accessibilité - page aide', async ({ page }) => {
  await page.goto('/aide')

  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})

test('accessibilité - page accessibilite', async ({ page }) => {
  await page.goto('/accessibilite')

  const results = await new AxeBuilder({ page }).analyze()

  expect(results.violations).toEqual([])
})