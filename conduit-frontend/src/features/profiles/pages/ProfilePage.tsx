import { useState } from 'react'
import { Link, NavLink, useParams } from 'react-router'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ArticleList } from '@/features/articles/components/ArticleList'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Avatar } from '@/shared/ui/Avatar'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { FollowButton } from '../components/FollowButton'
import { useProfile } from '../hooks/useProfiles'

interface ProfilePageProps {
  tab: 'authored' | 'favorited'
}

function ProfileArticles({ username, tab }: { username: string; tab: ProfilePageProps['tab'] }) {
  const [page, setPage] = useState(0)
  return (
    <ArticleList
      filters={
        tab === 'authored'
          ? { scope: 'global', author: username, page }
          : { scope: 'global', favorited: username, page }
      }
      onPageChange={setPage}
    />
  )
}

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'feed-tab active' : 'feed-tab')

export function ProfilePage({ tab }: ProfilePageProps) {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const query = useProfile(username)
  useDocumentTitle(username)
  const base = `/profile/${encodeURIComponent(username)}`

  return (
    <QueryBoundary query={query} notFound="Profile not found.">
      {(profile) => (
        <div className="profile-page">
          <div className="banner banner-light">
            <div className="container profile-banner">
              <Avatar image={profile.image} size="large" />
              <h1 className="profile-name">{profile.username}</h1>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              {user?.username === profile.username ? (
                <Link to="/settings" className="btn btn-secondary">
                  Edit Profile Settings
                </Link>
              ) : (
                <FollowButton profile={profile} />
              )}
            </div>
          </div>
          <div className="container page">
            <ul className="feed-tabs">
              <li>
                <NavLink to={base} end className={tabClass}>
                  My Articles
                </NavLink>
              </li>
              <li>
                <NavLink to={`${base}/favorites`} className={tabClass}>
                  Favorited Articles
                </NavLink>
              </li>
            </ul>
            <ProfileArticles key={`${username}:${tab}`} username={profile.username} tab={tab} />
          </div>
        </div>
      )}
    </QueryBoundary>
  )
}
