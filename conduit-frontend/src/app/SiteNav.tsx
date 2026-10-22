import { Link, NavLink } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Avatar } from '@/shared/ui/Avatar'

const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-link active' : 'nav-link')

export function SiteNav() {
  const { user, ready } = useAuth()
  return (
    <nav className="site-nav" aria-label="Main">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          Conduit
        </Link>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
          </li>
          {ready && user && (
            <>
              <li>
                <NavLink to="/editor" end className={linkClass}>
                  New Article
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={linkClass}>
                  Settings
                </NavLink>
              </li>
              <li>
                <NavLink to={`/profile/${encodeURIComponent(user.username)}`} className={linkClass}>
                  <Avatar image={user.image} size="small" />
                  {user.username}
                </NavLink>
              </li>
            </>
          )}
          {ready && !user && (
            <>
              <li>
                <NavLink to="/login" className={linkClass}>
                  Sign in
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={linkClass}>
                  Sign up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
