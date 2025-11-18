import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/userService'

const PersonalInfo = () => {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    personalInfo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Если пользователь не авторизован - перенаправляем на вход
    if (!user) {
      navigate('/войти')
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Отправляем данные на сервер
      const result = await userService.updateUser(user.id, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        gender: formData.gender
      })

      // Обновляем пользователя в контексте
      updateUser({ ...user, ...result })
      
      navigate('/профиль')
    } catch (error) {
      setError('Ошибка при сохранении данных')
      console.error('Error updating user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
      <div className="w-full max-w-4xl">
        <div className="animate-fade-in">
          <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2 text-center">
            Личная информация
          </h1>
          <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8 text-center">
            Заполните вашу личную информацию
          </p>
        </div>

        {error && (
          <div className="animate-fade-up mb-6 p-4 bg-red-90 border border-red-40 rounded-custom-small">
            <p className="text-red-20 font-inter font-medium text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <label htmlFor="firstname" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Имя
              </label>
              <input
                type="text"
                id="firstname"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                placeholder="Введите ваше имя"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <label htmlFor="lastname" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Фамилия
              </label>
              <input
                type="text"
                id="lastname"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                placeholder="Введите вашу фамилию"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <label htmlFor="phone" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Телефон *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                placeholder="+7 (999) 999-99-99"
                disabled={loading}
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <label htmlFor="gender" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                Пол
              </label>
              <div className="relative">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded focus:border-green-40 focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                  disabled={loading}
                >
                  <option value="" disabled className="text-green-40 bg-green-98">Выберите пол</option>
                  <option value="male" className="text-green-40 bg-green-98 py-2">Мужской</option>
                  <option value="female" className="text-green-40 bg-green-98 py-2">Женский</option>
                  <option value="other" className="text-green-40 bg-green-98 py-2">Другое</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <label htmlFor="personalInfo" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
              Личная информация *
            </label>
            <textarea
              id="personalInfo"
              name="personalInfo"
              value={formData.personalInfo}
              onChange={handleChange}
              rows={8}
              className="w-full px-4 py-4 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none text-sm md:text-base"
              placeholder="Расскажите о себе..."
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-60 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Подтвердить'}
              </button>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
              <p className="text-center text-green-40 font-inter font-medium text-xs md:text-sm">
                * - Необязательное поле
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalInfo