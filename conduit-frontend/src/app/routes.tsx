import type { RouteObject } from 'react-router'
import { ArticlePage } from '@/features/articles/pages/ArticlePage'
import { EditorPage } from '@/features/articles/pages/EditorPage'
import { HomePage } from '@/features/articles/pages/HomePage'
import { GuestOnly } from '@/features/auth/components/GuestOnly'
import { RequireAuth } from '@/features/auth/components/RequireAuth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { LogoutPage } from '@/features/auth/pages/LogoutPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { SettingsPage } from '@/features/auth/pages/SettingsPage'
import { ProfilePage } from '@/features/profiles/pages/ProfilePage'
import { ErrorFallback } from './ErrorBoundary'
import { Layout } from './Layout'
import { NotFoundPage } from './NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'article/:slug', element: <ArticlePage /> },
      { path: 'profile/:username', element: <ProfilePage tab="authored" /> },
      { path: 'profile/:username/favorites', element: <ProfilePage tab="favorited" /> },
      { path: 'logout', element: <LogoutPage /> },
      {
        element: <GuestOnly />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: 'settings', element: <SettingsPage /> },
          { path: 'editor', element: <EditorPage /> },
          { path: 'editor/:slug', element: <EditorPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
