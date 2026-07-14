import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { emitCodeCreated, emitCodeUpdated } from '../utils/socket'
import { formatPlatformName } from '../utils/platform'
import { getCurrentUser } from '../utils/auth'

const platforms = ['uber', 'airbnb', 'doordash', 'lyft', 'shopify', 'amazon', 'other']

const emptyForm = {
  code: '',
  platform: 'uber',
  description: '',
  discount: '',
  expiryDate: '',
  usageLimit: '',
  tags: ''
}

const MyReferrals = () => {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const user = getCurrentUser()

  const { data: codesData, isLoading } = useQuery(
    ['myCodes', user?.username],
    async () => {
      if (!user) return { codes: [] }
      const response = await axios.get(`/api/users/${user.username}/codes`)
      return response.data
    },
    { enabled: !!user }
  )

  const createMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/referral-codes', data)
      return response.data
    },
    {
      onSuccess: (newCode) => {
        queryClient.invalidateQueries(['myCodes'])
        emitCodeCreated(newCode)
        setShowForm(false)
        setFormData(emptyForm)
      },
      onError: (err) => {
        setError(err.response?.data?.error || 'Failed to create code')
      }
    }
  )

  const updateMutation = useMutation(
    async ({ id, data }) => {
      const response = await axios.put(`/api/referral-codes/${id}`, data)
      return response.data
    },
    {
      onSuccess: (updatedCode) => {
        queryClient.invalidateQueries(['myCodes'])
        emitCodeUpdated(updatedCode)
        setEditingCode(null)
        setFormData(emptyForm)
      },
      onError: (err) => {
        setError(err.response?.data?.error || 'Failed to update code')
      }
    }
  )

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/referral-codes/${id}`)
      return id
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['myCodes'])
      },
      onError: (err) => {
        setError(err.response?.data?.error || 'Failed to delete code')
      }
    }
  )

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      usageLimit: (() => {
        const parsed = parseInt(formData.usageLimit, 10)
        return formData.usageLimit && !isNaN(parsed) ? parsed : undefined
      })(),
      expiryDate: formData.expiryDate || undefined
    }
    if (editingCode) {
      updateMutation.mutate({ id: editingCode._id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleEdit = (code) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      platform: code.platform,
      description: code.description || '',
      discount: code.discount || '',
      expiryDate: code.expiryDate ? code.expiryDate.slice(0, 10) : '',
      usageLimit: code.usageLimit || '',
      tags: code.tags ? code.tags.join(', ') : ''
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCode(null)
    setFormData(emptyForm)
    setError('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">Please log in to manage your referral codes.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Referral Codes</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              + Add Code
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-4">{editingCode ? 'Edit Code' : 'Add New Code'}</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {formatPlatformName(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="text"
                  name="discount"
                  value={formData.discount}
                  onChange={handleChange}
                  placeholder="e.g. $10 off"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g. food, delivery, discount"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingCode
                    ? 'Update Code'
                    : 'Add Code'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading your codes...</p>
          </div>
        ) : codesData?.codes?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-xl text-gray-500">You have no referral codes yet.</p>
            <p className="text-gray-400 mt-2">Click "Add Code" to share your first code!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {codesData?.codes?.map((code) => (
              <div key={code._id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-blue-600">
                      {code.platform.toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">{code.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      code.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {code.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-green-600 font-bold mb-2">{code.discount}</p>

                <code className="bg-gray-100 p-2 rounded block text-center font-mono text-sm mb-3">
                  {code.code}
                </code>

                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>👁️ {code.views} views</span>
                  <span>📤 {code.shares} shares</span>
                  <span>✅ {code.usageCount} uses</span>
                  {code.expiryDate && (
                    <span>⏰ {new Date(code.expiryDate).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(code)}
                    className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 text-sm font-medium"
                  >
                    Edit
                  </button>
                  {confirmDeleteId === code._id ? (
                    <div className="flex-1 flex gap-1">
                      <button
                        onClick={() => {
                          deleteMutation.mutate(code._id)
                          setConfirmDeleteId(null)
                        }}
                        className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm font-medium"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(code._id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyReferrals
