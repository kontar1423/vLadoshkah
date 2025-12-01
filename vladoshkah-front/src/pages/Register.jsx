import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      const profileComplete = localStorage.getItem('profileComplete')
      navigate(profileComplete === 'true' ? '/profile' : '/personal-info')
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Введите корректный email')
      return
    }

    setLoading(true)

    try {
      console.log(' Register: Starting registration...');
      
      const result = await registerUser({
        email: formData.email,
        password: formData.password
      })

      console.log('Register: Registration result:', result);

      if (result.success) {
        console.log('Register: Successful! Redirecting to personal info...');
        navigate('/personal-info');
      } else {
        console.error(' Register: Failed with error:', result.error);
        setError(result.error || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Register: Unexpected error:', error);
      setError('Произошла непредвиденная ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
            Регистрация
          </h1>
          <p className="text-green-40 font-inter font-medium text-base md:text-lg">
            Создайте аккаунт, чтобы начать
          </p>
        </div>

        {error && (
          <div className="animate-fade-up mb-6 p-4 bg-red-90 border border-red-40 rounded-custom-small">
            <p className="text-red-20 font-inter font-medium text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="email" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                placeholder="example@mail.com"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <label htmlFor="password" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                placeholder="Минимум 6 символов"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="confirmPassword" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Подтвердите пароль
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                placeholder="Повторите пароль"
                disabled={loading}
              />
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-60 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <p className="text-center text-green-30 font-inter font-medium text-sm md:text-base">
              Уже есть аккаунт?{' '}
              <Link
                to="/login"
                className="text-green-50 hover:text-green-60 font-semibold transition-colors underline"
              >
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
