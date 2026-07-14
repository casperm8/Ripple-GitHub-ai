import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let response
      if (isLogin) {
        response = await axios.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        })
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        response = await axios.post('/api/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      }

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4\">\n      <div className=\"bg-white p-8 rounded-lg shadow-lg w-full max-w-md\">\n        <h1 className=\"text-3xl font-bold mb-2 text-center\">{isLogin ? 'Login' : 'Sign Up'}</h1>\n        <p className=\"text-center text-gray-600 mb-6\">Join Ripple today</p>\n\n        {error && (\n          <div className=\"bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4\">\n            {error}\n          </div>\n        )}\n\n        <form onSubmit={handleSubmit}>\n          {!isLogin && (\n            <input\n              type=\"text\"\n              name=\"username\"\n              placeholder=\"Username\"\n              required\n              value={formData.username}\n              onChange={handleChange}\n              className=\"w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600\"\n            />\n          )}\n\n          <input\n            type=\"email\"\n            name=\"email\"\n            placeholder=\"Email\"\n            required\n            value={formData.email}\n            onChange={handleChange}\n            className=\"w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600\"\n          />\n\n          <input\n            type=\"password\"\n            name=\"password\"\n            placeholder=\"Password\"\n            required\n            value={formData.password}\n            onChange={handleChange}\n            className=\"w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600\"\n          />\n\n          {!isLogin && (\n            <input\n              type=\"password\"\n              name=\"confirmPassword\"\n              placeholder=\"Confirm Password\"\n              required\n              value={formData.confirmPassword}\n              onChange={handleChange}\n              className=\"w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600\"\n            />\n          )}\n\n          <button\n            type=\"submit\"\n            disabled={loading}\n            className=\"w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium\"\n          >\n            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}\n          </button>\n        </form>\n\n        <div className=\"mt-6 text-center\">\n          <p className=\"text-gray-600 mb-2\">\n            {isLogin ? \"Don't have an account?\" : 'Already have an account?'}\n          </p>\n          <button\n            onClick={() => {\n              setIsLogin(!isLogin)\n              setError('')\n              setFormData({ username: '', email: '', password: '', confirmPassword: '' })\n            }}\n            className=\"text-blue-600 hover:text-blue-700 font-medium\"\n          >\n            {isLogin ? 'Sign Up' : 'Login'}\n          </button>\n        </div>\n      </div>\n    </div>\n  )\n}\n\nexport default Login\n