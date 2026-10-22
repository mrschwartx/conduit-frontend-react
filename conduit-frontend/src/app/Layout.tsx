import { Outlet, useLocation } from 'react-router'
import { ToastRegion } from '@/shared/toast/ToastRegion'
import { ErrorBoundary } from './ErrorBoundary'
import { SiteFooter } from './SiteFooter'
import { SiteNav } from './SiteNav'

export function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <SiteNav />
      <main>
        <ToastRegion />
        {/* Keyed by path so a crashed page recovers when the user navigates away. */}
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <SiteFooter />
    </>
  )
}
