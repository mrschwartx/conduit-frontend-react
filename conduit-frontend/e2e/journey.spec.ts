import { expect, test, type Page } from '@playwright/test'

const PASSWORD = 'correct-horse-battery'
let counter = 0
const uniqueName = (prefix: string) => `${prefix}${Date.now().toString(36)}${++counter}`

async function register(page: Page, username: string) {
  await page.goto('/register')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page.getByRole('status')).toContainText(`Welcome to Conduit, ${username}!`)
}

test('guests are sent to /login when they try to write', async ({ page }) => {
  await page.goto('/editor')
  await expect(page).toHaveURL(/\/login$/)
})

test('register, publish, comment, favorite, log out', async ({ page }) => {
  const username = uniqueName('author')
  const title = `Journey ${username}`
  await register(page, username)

  await page.goto('/editor')
  await page.getByLabel('Article title').fill(title)
  await page.getByLabel("What's this article about?").fill('An end to end article')
  await page.getByLabel('Write your article').fill('Written in a real browser.')
  await page.getByLabel('Enter tags').fill('browser')
  await page.getByLabel('Enter tags').press('Enter')
  await page.getByRole('button', { name: 'Publish Article' }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

  await page.getByLabel('Write a comment').fill('First!')
  await page.getByRole('button', { name: 'Post Comment' }).click()
  await expect(page.getByText('First!')).toBeVisible()

  await page.goto(`/profile/${username}`)
  await page.getByRole('button', { name: 'Favorite article', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Unfavorite article', exact: true })).toBeVisible()

  await page.goto('/settings')
  await page.getByRole('button', { name: 'Or click here to logout.' }).click()
  await expect(page.getByRole('status')).toContainText("You've been logged out successfully!")
  await expect(page).toHaveURL(/\/$/)
})
