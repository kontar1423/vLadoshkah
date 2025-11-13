import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Демо-регистрация
    login()
    navigate('/личная-информация')
  }

  return (
    <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
      <div className="w-full max-w-4xl">
        <div className="animate-fade-in">
          <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2 text-center">
            Регистрация
          </h1>
          <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8 text-center">
            Создайте аккаунт, чтобы начать
          </p>
        </div>

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
                placeholder="Минимум 8 символов"
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
              />
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <button
              type="submit"
              className="w-full px-6 py-4 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-60 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Зарегистрироваться
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