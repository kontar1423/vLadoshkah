import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  
  // Валидация
  if (formData.password !== formData.confirmPassword) {
    setError('Пароли не совпадают')
    return
  }

  if (formData.password.length < 6) {
    setError('Пароль должен содержать минимум 6 символов')
    return
  }

  setLoading(true)

  try {
    const result = await register({
      email: formData.email,
      password: formData.password,
      role: 'user'
    })

    if (result.success) {
      setRegistrationSuccess(true)
    } else {
      setError(result.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    // Детальная обработка ошибок
    if (error.response?.data?.error) {
      setError(error.response.data.error)
    } else if (error.response?.data?.details) {
      const validationErrors = error.response.data.details
        .map(detail => detail.message)
        .join(', ')
      setError(validationErrors)
    } else if (error.message) {
      setError(error.message)
    } else {
      setError('Произошла ошибка при регистрации')
    }
  } finally {
    setLoading(false)
  }
}


const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const { register } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Валидация
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    setLoading(true)

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        role: 'user'
      })

      if (result.success) {
        setRegistrationSuccess(true)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Произошла ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  // Если регистрация успешна - показываем сообщение о подтверждении email
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
        <div className="w-full max-w-2xl text-center">
            <div className="bg-green-90 rounded-custom p-8">
              <svg 
                className="w-16 h-16 text-green-50 mx-auto mb-4"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              
              <h1 className="text-green-30 font-sf-rounded font-bold text-2xl md:text-3xl mb-4">
                Подтвердите ваш email
              </h1>
              
              <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-6">
                Мы отправили письмо с ссылкой для подтверждения на адрес <strong>{formData.email}</strong>. 
                Пожалуйста, проверьте вашу почту и перейдите по ссылке для активации аккаунта.
              </p>

              <div className="space-y-4">
                <p className="text-green-30 font-inter text-sm">
                  После подтверждения email вы сможете войти в систему и заполнить личную информацию.
                </p>
                
                <Link
                  to="/войти"
                  className="inline-block px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 transition-all duration-200"
                >
                  Перейти к входу
                </Link>
              </div>
            </div>
          </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
      <div className="w-full max-w-4xl">
          <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2 text-center">
            Регистрация
          </h1>
          <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8 text-center">
            Создайте аккаунт, чтобы начать
          </p>
        

        {error && (
          <div className="animate-fade-up mb-6 p-4 bg-red-90 border border-red-40 rounded-custom-small">
            <p className="text-red-20 font-inter font-medium text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
                to="/войти"
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