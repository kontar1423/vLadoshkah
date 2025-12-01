import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { getPhotoUrl } from '../../utils/photoHelpers';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstname: '',
        lastname: '',
        phone: '',
        gender: '',
        role: 'user',
        bio: ''
    });
    const [photoFile, setPhotoFile] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            alert('Не удалось загрузить пользователей');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    formDataToSend.append(key, formData[key]);
                }
            });
            if (photoFile) {
                formDataToSend.append('photo', photoFile);
            }

            await userService.createUser(formDataToSend);
            alert('Пользователь успешно создан');
            setShowCreateForm(false);
            setFormData({
                email: '',
                password: '',
                firstname: '',
                lastname: '',
                phone: '',
                gender: '',
                role: 'user',
                bio: ''
            });
            setPhotoFile(null);
            loadUsers();
        } catch (error) {
            console.error('Ошибка создания пользователя:', error);
            alert(error.response?.data?.error || 'Не удалось создать пользователя');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email || '',
            password: '',
            firstname: user.firstname || '',
            lastname: user.lastname || '',
            phone: user.phone || '',
            gender: user.gender || '',
            role: user.role || 'user',
            bio: user.bio || user.personalInfo || ''
        });
        setPhotoFile(null);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] || key === 'role') {
                    formDataToSend.append(key, formData[key]);
                }
            });
            if (photoFile) {
                formDataToSend.append('photo', photoFile);
            }

            await userService.updateUserById(editingUser.id, formDataToSend);
            alert('Пользователь успешно обновлен');
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                firstname: '',
                lastname: '',
                phone: '',
                gender: '',
                role: 'user',
                bio: ''
            });
            setPhotoFile(null);
            loadUsers();
        } catch (error) {
            console.error('Ошибка обновления пользователя:', error);
            alert(error.response?.data?.error || 'Не удалось обновить пользователя');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await userService.deleteUser(userId);
            alert('Пользователь успешно удален');
            loadUsers();
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            alert(error.response?.data?.error || 'Не удалось удалить пользователя');
        }
    };

    const getRoleLabel = (role) => {
        const roles = {
            'user': 'Пользователь',
            'shelter_admin': 'Админ приюта',
            'admin': 'Админ сайта'
        };
        return roles[role] || role;
    };

    const getGenderLabel = (gender) => {
        const genders = {
            'male': 'Мужской',
            'female': 'Женский',
            'other': 'Другое'
        };
        return genders[gender] || 'Не указан';
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-50 mx-auto mb-4"></div>
                <div className="text-green-30">Загрузка пользователей...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-green-30 font-sf-rounded font-bold text-2xl">Управление пользователями</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                >
                    {showCreateForm ? 'Отмена' : '+ Создать пользователя'}
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-green-90 rounded-custom p-6 mb-6 border-2 border-green-80">
                    <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">Создать пользователя</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Пароль *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Имя</label>
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Фамилия</label>
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Пол</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Не указан</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Роль *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="user">Пользователь</option>
                                    <option value="shelter_admin">Админ приюта</option>
                                    <option value="admin">Админ сайта</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Фото</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">О себе</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                        >
                            Создать
                        </button>
                    </form>
                </div>
            )}

            {editingUser && (
                <div className="bg-green-90 rounded-custom p-6 mb-6 border-2 border-green-80">
                    <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">Редактировать пользователя</h3>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Новый пароль (оставьте пустым, чтобы не менять)</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Имя</label>
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Фамилия</label>
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Пол</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Не указан</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Роль *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="user">Пользователь</option>
                                    <option value="shelter_admin">Админ приюта</option>
                                    <option value="admin">Админ сайта</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Новое фото</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">О себе</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                            >
                                Сохранить
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                className="px-6 py-3 bg-green-80 text-green-30 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-70 transition-all"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-green-90 border-b-2 border-green-80">
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Фото</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Имя</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Email</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Роль</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Пол</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Телефон</th>
                            <th className="px-4 py-3 text-left text-green-30 font-sf-rounded font-semibold">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-green-80 hover:bg-green-90">
                                <td className="px-4 py-3">
                                    {user.photoUrl || (user.photos && user.photos.length > 0) ? (
                                        <img
                                            src={getPhotoUrl(user.photoUrl ? { url: user.photoUrl } : user.photos[0])}
                                            alt={user.firstname || user.email}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-green-80 flex items-center justify-center text-green-30 font-sf-rounded font-bold">
                                            {(user.firstname?.[0] || user.email?.[0] || 'U').toUpperCase()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-green-20 font-inter">
                                    {user.firstname && user.lastname
                                        ? `${user.firstname} ${user.lastname}`
                                        : user.firstname || user.lastname || 'Не указано'}
                                </td>
                                <td className="px-4 py-3 text-green-20 font-inter">{user.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-sf-rounded font-semibold ${
                                        user.role === 'admin' ? 'bg-green-30 text-green-100' :
                                        user.role === 'shelter_admin' ? 'bg-green-50 text-green-100' :
                                        'bg-green-80 text-green-30'
                                    }`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-green-20 font-inter">{getGenderLabel(user.gender)}</td>
                                <td className="px-4 py-3 text-green-20 font-inter">{user.phone || 'Не указан'}</td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="px-3 py-1 bg-green-30 text-green-100 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-20 transition-all"
                                        >
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="px-3 py-1 bg-green-80 text-green-30 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-70 transition-all"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersManagement;


