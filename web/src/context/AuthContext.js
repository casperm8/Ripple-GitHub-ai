import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { initializeSocket } from '../utils/socket'

const AuthContext = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      initializeSocket(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const login = (token, user) => {
    setToken(token)
    setUser(user)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    initializeSocket(token)
  }

  const logout = () => {\n    setToken(null)\n    setUser(null)\n    localStorage.removeItem('token')\n    localStorage.removeItem('user')\n    delete axios.defaults.headers.common['Authorization']\n    navigate('/login')\n  }\n\n  return { user, token, loading, login, logout, isAuthenticated: !!token }\n}\n\nexport default AuthContext\n