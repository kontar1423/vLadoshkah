import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        navigate('/профиль')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
      <div className="w-full max-w-4xl">
          <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2 text-center">
            Войти
          </h1>
          <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8 text-center">
            Войдите в свой аккаунт
          </p>

        {error && (
          <div className="animate-fade-up mb-6 p-4 bg-red-90 border border-red-40 rounded-custom-small">
            <p className="text-red-20 font-inter font-medium text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="email" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                placeholder="example@mail.com"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="password" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                placeholder="Введите пароль"
                disabled={loading}
              />
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-60 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-center text-green-30 font-inter font-medium text-sm md:text-base">
              Еще нет аккаунта?{' '}
              <Link
                to="/регистрация"
                className="text-green-50 hover:text-green-60 font-semibold transition-colors underline"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login