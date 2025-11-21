import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const setProfileCompleteFlag = (userData) => {
  const isComplete = Boolean(userData?.firstname && userData?.lastname && userData?.gender)
  localStorage.setItem('profileComplete', isComplete ? 'true' : 'false')
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    hydrateAuthState()
  }, [])

  const hydrateAuthState = async () => {
    const hasToken = authService.isAuthenticated()

    if (!hasToken) {
      setIsAuthenticated(false)
      setUser(null)
      localStorage.removeItem('profileComplete')
      setLoading(false)
      return
    }

    try {
      const freshUser = await authService.getCurrentUserFromServer()
      setUser(freshUser)
      setIsAuthenticated(true)
      setProfileCompleteFlag(freshUser)
      localStorage.setItem('user', JSON.stringify(freshUser))
    } catch (error) {
      const cachedUser = authService.getCurrentUser()
      if (cachedUser) {
        setUser(cachedUser)
        setIsAuthenticated(true)
        setProfileCompleteFlag(cachedUser)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        localStorage.removeItem('profileComplete')
      }
      console.error('AuthContext: failed to hydrate from server, using cache if available', error)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const result = await authService.register(userData)

      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
        setProfileCompleteFlag(result.user)
        return { success: true, user: result.user }
      }

      return { success: false, error: result.error || 'Ошибка регистрации' }
    } catch (error) {
      console.error('AuthContext: register error', error)
      return { success: false, error: 'Неожиданная ошибка при регистрации' }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const result = await authService.login({ email, password })

      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
        setProfileCompleteFlag(result.user)
        return { success: true }
      }

      return { success: false, error: result.error || 'Ошибка аутентификации' }
    } catch (error) {
      console.error('AuthContext: login error', error)
      return { success: false, error: 'Неожиданная ошибка при входе' }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('profileComplete')
  }

  const updateUser = (updatedUser) => {
    if (!updatedUser) return

    const nextUser = { ...(user || {}), ...updatedUser }
    setUser(nextUser)
    setProfileCompleteFlag(nextUser)
    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUserFromServer()
      setUser(freshUser)
      setIsAuthenticated(true)
      setProfileCompleteFlag(freshUser)
      localStorage.setItem('user', JSON.stringify(freshUser))
      return freshUser
    } catch (error) {
      console.error('AuthContext: refreshUser error', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
