import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { emitUserFollowed } from '../utils/socket'
import { formatPlatformName } from '../utils/platform'
import { getCurrentUser } from '../utils/auth'

const UserProfile = () => {
  const { username } = useParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('codes')
  const [followError, setFollowError] = useState('')
  const [copiedCodeId, setCopiedCodeId] = useState(null)

  const currentUser = getCurrentUser()
  const isOwnProfile = currentUser?.username === username

  const { data: profile, isLoading: profileLoading } = useQuery(
    ['profile', username],
    async () => {
      const response = await axios.get(`/api/users/${username}`)
      return response.data
    }
  )

  const { data: codesData, isLoading: codesLoading } = useQuery(
    ['userCodes', username],
    async () => {
      const response = await axios.get(`/api/users/${username}/codes`)
      return response.data
    },
    { enabled: activeTab === 'codes' }
  )

  const { data: feedData, isLoading: feedLoading } = useQuery(
    ['userFeed', username],
    async () => {
      const response = await axios.get(`/api/users/${username}/feed`)
      return response.data
    },
    { enabled: activeTab === 'feed' }
  )

  const followMutation = useMutation(
    async () => {
      const response = await axios.post(`/api/users/${username}/follow`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', username])
        if (currentUser) {
          emitUserFollowed({
            targetUserId: profile?.id,
            followerId: currentUser.id,
            followerName: currentUser.username
          })
        }
        setFollowError('')
      },
      onError: (err) => {
        setFollowError(err.response?.data?.error || 'Failed to follow user')
      }
    }
  )

  const unfollowMutation = useMutation(
    async () => {
      const response = await axios.delete(`/api/users/${username}/follow`)
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['profile', username])
        setFollowError('')
      },
      onError: (err) => {
        setFollowError(err.response?.data?.error || 'Failed to unfollow user')
      }
    }
  )

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">User not found.</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const isFollowing =
    currentUser &&
    profile.followers &&
    profile.followers.includes(currentUser.id)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                {profile.profile?.avatar ? (
                  <img
                    src={profile.profile.avatar}
                    alt={profile.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">@{profile.username}</h1>
                {(profile.profile?.firstName || profile.profile?.lastName) && (
                  <p className="text-gray-600 text-lg">
                    {profile.profile.firstName} {profile.profile.lastName}
                  </p>
                )}
                {profile.profile?.bio && (
                  <p className="text-gray-500 mt-1">{profile.profile.bio}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div>
                {followError && (
                  <p className="text-red-500 text-sm mb-2">{followError}</p>
                )}
                <button
                  onClick={() =>
                    isFollowing ? unfollowMutation.mutate() : followMutation.mutate()
                  }
                  disabled={followMutation.isLoading || unfollowMutation.isLoading}
                  className={`px-6 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {followMutation.isLoading || unfollowMutation.isLoading
                    ? '...'
                    : isFollowing
                    ? 'Unfollow'
                    : 'Follow'}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{profile.codesCount}</p>
              <p className="text-gray-500 text-sm">Codes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{profile.followersCount}</p>
              <p className="text-gray-500 text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{profile.followingCount}</p>
              <p className="text-gray-500 text-sm">Following</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'codes'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Referral Codes
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Feed
          </button>
        </div>

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <>
            {codesLoading ? (
              <p className="text-center text-gray-600 py-8">Loading codes...</p>
            ) : codesData?.codes?.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                No referral codes yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {codesData?.codes?.map((code) => (
                  <div key={code._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-600">
                          {code.platform.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">{code.description}</p>
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        <p>👁️ {code.views}</p>
                        <p>📤 {code.shares}</p>
                      </div>
                    </div>

                    <p className="text-green-600 font-bold mb-2">{code.discount}</p>

                    <code className="bg-gray-100 p-2 rounded block text-center font-mono text-sm mb-3">
                      {code.code}
                    </code>

                    {code.expiryDate && (
                      <p className="text-xs text-gray-400 mb-3">
                        Expires: {new Date(code.expiryDate).toLocaleDateString()}
                      </p>
                    )}

                    <button
                      onClick={() => handleCopyCode(code.code, code._id)}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      {copiedCodeId === code._id ? '✅ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <>
            {feedLoading ? (
              <p className="text-center text-gray-600 py-8">Loading feed...</p>
            ) : feedData?.codes?.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                No codes in feed yet. Follow more users to see their codes here.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {feedData?.codes?.map((code) => (
                  <div key={code._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-600">
                          {code.platform.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          by{' '}
                          <Link
                            to={`/profile/${code.owner?.username}`}
                            className="text-blue-600 hover:underline"
                          >
                            @{code.owner?.username}
                          </Link>
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                    <p className="text-green-600 font-bold mb-2">{code.discount}</p>

                    <code className="bg-gray-100 p-2 rounded block text-center font-mono text-sm mb-3">
                      {code.code}
                    </code>

                    <button
                      onClick={() => handleCopyCode(code.code, code._id)}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      {copiedCodeId === code._id ? '✅ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserProfile
