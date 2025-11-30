// AdminProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shelterService } from '../services/shelterService';
import { animalService } from '../services/animalService';
import { userService } from '../services/userService';
import { favoriteService } from '../services/favoriteService';
import PetCard from '../components/PetCard';
import { getPhotoUrl } from '../utils/photoHelpers';
import { isShelterAdminRole } from '../utils/roleUtils';

const AdminProfile = () => {
    const navigate = useNavigate();
    const { user, refreshUser, updateUser } = useAuth();

    const [shelterInfo, setShelterInfo] = useState(null);
    const [shelterPets, setShelterPets] = useState([]);
    const [favoritePets, setFavoritePets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' или 'shelter'
    const [shelterFavoritesMap, setShelterFavoritesMap] = useState({});
    const lastUserIdRef = useRef(null);


    // Проверка роли и загрузка данных
    useEffect(() => {
        const checkRoleAndLoadData = async () => {
            try {
                setLoading(true);
                
                // Сначала обновляем данные пользователя
                const freshUser = await refreshUser();
                console.log('AdminProfile: Fresh user data:', freshUser);
                
                // Проверяем роль
                if (!freshUser || (!isShelterAdminRole(freshUser.role) && freshUser.role !== 'admin')) {
                    console.log('AdminProfile: User is not admin, redirecting to profile');
                    navigate('/профиль');
                    return;
                }
                
                console.log('AdminProfile: User is admin, loading admin data');
                
                // Загружаем полные данные пользователя
                await loadUserDataFromServer();
                // Загружаем данные админа
                await loadAdminData(freshUser);
                
            } catch (error) {
                console.error('AdminProfile: Error in role check:', error);
                navigate('/профиль');
            }
        };

        checkRoleAndLoadData();
    }, [navigate]);

    useEffect(() => {
        const handleCustomFavoritesUpdate = (event) => {
            const eventUserId = event.detail?.userId;
            const currentUserId = (userData || user)?.id;
            
            if (!eventUserId || eventUserId === currentUserId) {
                console.log('🔄 AdminProfile: Custom favorites update, reloading...');
                loadFavoritePets();
            }
        };

        const handleShelterFavoritesUpdate = (event) => {
            const eventUserId = event.detail?.userId;
            const eventAnimalId = event.detail?.animalId;
            const eventIsFavorite = event.detail?.isFavorite;
            
            if (eventAnimalId && eventUserId === user?.id && eventIsFavorite !== undefined) {
                setShelterFavoritesMap(prev => ({
                    ...prev,
                    [eventAnimalId]: eventIsFavorite
                }));
            }
        };

        window.addEventListener('favoritesUpdated', handleCustomFavoritesUpdate);
        window.addEventListener('favoritesUpdated', handleShelterFavoritesUpdate);

        return () => {
            window.removeEventListener('favoritesUpdated', handleCustomFavoritesUpdate);
            window.removeEventListener('favoritesUpdated', handleShelterFavoritesUpdate);
        };
    }, [user?.id, userData?.id]);

    const loadUserDataFromServer = async () => {
        try {
            console.log('AdminProfile: Loading fresh user data from server...');
            
            const serverUserData = refreshUser
                ? await refreshUser()
                : await userService.getCurrentUser();
            console.log('AdminProfile: User data loaded from server:', serverUserData);
            
            setUserData(serverUserData);
            localStorage.setItem('user', JSON.stringify(serverUserData));
            
        } catch (error) {
            console.error('AdminProfile: Error loading user data from server:', error);
            if (user) {
                console.log('AdminProfile: Using context data as fallback');
                setUserData(user);
            }
        }
    };

    const loadAdminData = async (currentUser) => {
        try {
            console.log('AdminProfile: Loading admin data for user:', currentUser);
            
            // Загружаем избранные питомцы
            await loadFavoritePets();
            
            // Если у пользователя есть приют, загружаем его данные
            if (currentUser?.shelter_id) {
                await loadShelterInfo(currentUser.shelter_id);
                await loadShelterPets(currentUser.shelter_id);
                return;
            }

            if (currentUser?.id) {
                console.log('AdminProfile: Trying to resolve shelter by admin_id...');
                const shelterByAdmin = await shelterService.getShelterByAdminId(currentUser.id);

                if (shelterByAdmin?.id) {
                    console.log('AdminProfile: Shelter found by admin_id:', shelterByAdmin.id);
                    setShelterInfo(shelterByAdmin);
                    await loadShelterPets(shelterByAdmin.id);

                    if (!currentUser.shelter_id && updateUser) {
                        updateUser({ shelter_id: shelterByAdmin.id });
                    }
                    return;
                }
            }

            console.log('AdminProfile: No shelter found for user');
            setShelterInfo(null);
            setShelterPets([]);
            
        } catch (error) {
            console.error('AdminProfile: Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadShelterInfo = async (shelterId) => {
        try {
            console.log('AdminProfile: Loading shelter info for ID:', shelterId);
            const shelter = await shelterService.getShelterById(shelterId);
            setShelterInfo(shelter);
            console.log('AdminProfile: Shelter info loaded:', shelter);
        } catch (error) {
            console.error('AdminProfile: Error loading shelter info:', error);
            setShelterInfo(null);
        }
    };

    const loadShelterPets = async (shelterId) => {
        try {
            console.log('AdminProfile: Loading shelter pets for shelter ID:', shelterId);
            const pets = await animalService.getAnimalsByShelter(shelterId);
            setShelterPets(pets || []);
            console.log('AdminProfile: Shelter pets loaded:', pets?.length || 0);
            
            // Проверяем избранные для питомцев приюта
            if (pets && pets.length > 0 && user?.id) {
                try {
                    const animalIds = pets.map(pet => pet.id);
                    const favoritesResult = await favoriteService.checkFavoritesBulk(user.id, animalIds);
                    setShelterFavoritesMap(favoritesResult || {});
                } catch (favoritesError) {
                    console.error('Error loading favorites for shelter pets:', favoritesError);
                    setShelterFavoritesMap({});
                }
            } else {
                setShelterFavoritesMap({});
            }
            
            // Если есть приют — по умолчанию открываем вкладку «Питомцы приюта», чтобы их было видно
            if (pets?.length >= 0) {
                setActiveTab('shelter');
            }
        } catch (error) {
            console.error('AdminProfile: Error loading shelter pets:', error);
            setShelterPets([]);
            setShelterFavoritesMap({});
        }
    };

    const loadFavoritePets = async () => {
        try {
            console.log('AdminProfile: Loading favorite pets...');
            
            const currentUser = userData || user;
            if (!currentUser?.id) {
                console.log('AdminProfile: No user ID available');
                setFavoritePets([]);
                return;
            }
            
            // Получаем список избранных из API
            const favoriteIds = await favoriteService.getUserFavorites(currentUser.id);
            console.log('📋 AdminProfile: Favorite pets IDs for user', currentUser.id, ':', favoriteIds);
            
            if (!favoriteIds || favoriteIds.length === 0) {
                setFavoritePets([]);
                return;
            }
            
            // Загружаем полную информацию о каждом питомце
            const petPromises = favoriteIds.map(async (petId) => {
                try {
                    console.log(`AdminProfile: Loading pet ${petId}...`);
                    const pet = await animalService.getAnimalById(petId);
                    console.log(`AdminProfile: Pet ${petId} loaded:`, pet?.name);
                    return pet;
                } catch (error) {
                    console.error(`AdminProfile: Error loading pet ${petId}:`, error);
                    return null;
                }
            });
            
            const results = await Promise.all(petPromises);
            const validPets = results.filter(pet => pet !== null && pet.id);
            
            console.log(`AdminProfile: Loaded ${validPets.length} favorite pets for user ${currentUser.id}:`, 
                validPets.map(pet => ({ id: pet.id, name: pet.name }))
            );
            
            setFavoritePets(validPets);
            
        } catch (error) {
            console.error('AdminProfile: Error loading favorite pets:', error);
            setFavoritePets([]);
        }
    };

    const forceRefreshFavorites = async () => {
        console.log('🔄 AdminProfile: Force refreshing favorites...');
        try {
            await loadFavoritePets();
            console.log(' AdminProfile: Favorites force refreshed');
        } catch (error) {
            console.error(' AdminProfile: Error force refreshing favorites:', error);
        }
    };

    const forceRefreshShelterPets = async () => {
        console.log('🔄 AdminProfile: Force refreshing shelter pets...');
        try {
            if (userData?.shelter_id) {
                await loadShelterPets(userData.shelter_id);
            }
            console.log(' AdminProfile: Shelter pets force refreshed');
        } catch (error) {
            console.error(' AdminProfile: Error force refreshing shelter pets:', error);
        }
    };

    const getProfilePhotoUrl = () => {
        const currentUser = userData || user;
        
        if (!currentUser) {
            console.log('AdminProfile: No user data available');
            return null;
        }

        if (currentUser.photoUrl) {
            const processedUrl = getPhotoUrl({ url: currentUser.photoUrl });
            return processedUrl;
        }

        if (currentUser.photos && currentUser.photos.length > 0) {
            const processedUrl = getPhotoUrl(currentUser.photos[0]);
            return processedUrl;
        }

        return null;
    };

    // Данные пользователя для сайдбара
    const getVolunteerInfo = () => {
        const currentUser = userData || user;
        
        if (!currentUser) {
            return {
                name: "Пользователь",
                status: "Администратор приюта",
                phone: "Не указан",
                email: "Email не указан",
                gender: "Не указан",
                bio: "Заполните информацию о себе",
                image: null
            };
        }
        
        let displayName = "Пользователь";
        if (currentUser.firstname && currentUser.lastname) {
            displayName = `${currentUser.firstname} ${currentUser.lastname}`;
        } else if (currentUser.firstname) {
            displayName = currentUser.firstname;
        } else if (currentUser.lastname) {
            displayName = currentUser.lastname;
        } else if (currentUser.email) {
            displayName = currentUser.email.split('@')[0];
        }
        
        let displayGender = "Не указан";
        if (currentUser.gender === 'male') {
            displayGender = 'Мужской';
        } else if (currentUser.gender === 'female') {
            displayGender = 'Женский';
        } else if (currentUser.gender === 'other') {
            displayGender = 'Другое';
        }
        
        const displayBio = currentUser.personalInfo || currentUser.bio || "Расскажите о себе в личной информации";
        
        const profileImage = getProfilePhotoUrl();
        
        return {
            name: displayName,
            status: currentUser.role === 'admin' ? 'Администратор системы' : 'Администратор приюта',
            phone: currentUser.phone || "Не указан",
            email: currentUser.email || "Email не указан",
            gender: displayGender,
            bio: displayBio,
            image: profileImage
        };
    };

    const handleRegisterShelter = () => {
        navigate('/регистрация-приюта');
    };

    const handleAddPet = () => {
        if (shelterInfo) {
            navigate('/добавить-питомца');
        } else {
            alert('Сначала зарегистрируйте приют');
        }
    };

    const handleEditShelter = () => {
        if (shelterInfo) {
            alert('Функция редактирования приюта в разработке');
        }
    };

    const handleEditProfile = () => {
        console.log('AdminProfile: Navigating to edit profile');
        navigate('/личная-информация');
    };

    const renderPetsGrid = () => {
        const pets = activeTab === 'favorites' ? favoritePets : shelterPets;
        const emptyMessage = activeTab === 'favorites' 
            ? {
                title: "Нет избранных питомцев",
                message: "Добавляйте питомцев в избранное, нажимая на сердечко на карточках животных",
                buttonText: "Найти питомцев",
                onButtonClick: () => navigate('/найти-питомца')
            }
            : {
                title: "Нет питомцев в приюте",
                message: "Добавьте первого питомца в ваш приют",
                buttonText: "Добавить питомца",
                onButtonClick: handleAddPet
            };

        return pets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {pets.map((pet) => (
                    <PetCard 
                        key={pet.id}
                        petData={pet}
                        initialFavorite={activeTab === 'favorites' ? true : shelterFavoritesMap[pet.id] === true}
                        onFavoriteChange={activeTab === 'favorites' ? forceRefreshFavorites : forceRefreshShelterPets}
                        showShelterInfo={activeTab !== 'shelter'}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 w-full">
                <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                    <svg 
                        className="w-16 h-16 text-green-60 mx-auto mb-4"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            activeTab === 'favorites' 
                                ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                : "M12 4v16m8-8H4"
                        } />
                    </svg>
                    <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                        {emptyMessage.title}
                    </h3>
                    <p className="font-inter text-green-20 mb-4">
                        {emptyMessage.message}
                    </p>
                    <button
                        onClick={emptyMessage.onButtonClick}
                        className="px-6 py-2 bg-green-50 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 transition-all duration-200"
                    >
                        {emptyMessage.buttonText}
                    </button>
                </div>
            </div>
        );
    };

    const volunteerInfo = getVolunteerInfo();

    if (loading) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-50 mx-auto mb-4"></div>
                    <div className="text-lg text-green-30">Загрузка профиля администратора...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-95">
            <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Основной контент */}
                    <main className="flex-1">
                        {/* Блок регистрации приюта (показывается только если приюта нет) */}
                        {!shelterInfo && (
                            <section className="bg-green-90 rounded-custom p-8 mb-8 border-2 border-green-80">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-green-80 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-4">
                                        Зарегистрируйте приют
                                    </h2>
                                    <p className="font-inter text-green-40 text-base mb-6 max-w-md mx-auto">
                                        Внесите корректные данные о приюте, чьим представителем вы являетесь
                                    </p>
                                    <button
                                        onClick={handleRegisterShelter}
                                        className="px-8 py-4 bg-green-70 text-green-100 font-sf-rounded font-semibold text-lg rounded-custom-small hover:bg-green-60 transition-colors shadow-lg"
                                    >
                                        Зарегистрировать приют
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Блок управления приютом (показывается только если приют есть) */}
                        {shelterInfo && (
                            <section className="bg-green-90 rounded-custom p-6 mb-8 border-2 border-green-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-2">
                                            Ваш приют: {shelterInfo.name}
                                        </h2>
                                        {shelterInfo.address && (
                                            <p className="font-inter text-green-40 text-sm mt-1">
                                                Адрес: {shelterInfo.address}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleAddPet}
                                            className="px-6 py-3 bg-green-40 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 cursor-pointer transition-colors"
                                        >
                                            + Добавить питомца
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        
                        <section className="flex flex-col items-center gap-6 relative">
                            <header className="flex items-center justify-between relative self-stretch w-full">
                                <div className="flex items-center gap-4">
                                    <h1 className="w-fit mt-[-1.00px] font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                                        {activeTab === 'favorites' ? 'Избранные питомцы' : 'Питомцы приюта'}
                                    </h1>
                                    <span className="px-3 py-1 bg-green-40 text-green-100 font-sf-rounded font-medium text-sm rounded-full">
                                        {activeTab === 'favorites' ? favoritePets.length : shelterPets.length}
                                    </span>
                                </div>
                                
                                {/* Переключение табов (показывается только если есть приют) */}
                                {shelterInfo && (
                                    <div className="flex border border-green-80 rounded-custom-small overflow-hidden">
                                        <button
                                            onClick={() => setActiveTab('favorites')}
                                            className={`px-4 py-2 font-sf-rounded font-medium text-sm transition-colors ${
                                                activeTab === 'favorites' 
                                                    ? 'bg-green-40 text-green-100' 
                                                    : 'bg-green-90 text-green-40 hover:bg-green-80'
                                            }`}
                                        >
                                            Избранные
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('shelter')}
                                            className={`px-4 py-2 font-sf-rounded font-medium text-sm transition-colors ${
                                                activeTab === 'shelter' 
                                                    ? 'bg-green-40 text-green-100' 
                                                    : 'bg-green-90 text-green-40 hover:bg-green-80'
                                            }`}
                                        >
                                            Питомцы приюта
                                        </button>
                                    </div>
                                )}
                            </header>

                            {renderPetsGrid()}
                        </section>
                    </main>

                    {/* Сайдбар с информацией о пользователе */}
                    <aside className="lg:w-[340px] flex flex-col gap-6">
                        <div className="relative bg-green-90 rounded-custom overflow-hidden">
                            <div className="relative h-64">
                                {volunteerInfo.image ? (
                                    <>
                                        <img
                                            className="w-full h-full object-cover"
                                            alt="Фото профиля"
                                            src={volunteerInfo.image}
                                            onError={(e) => {
                                                console.error('AdminProfile: Image failed to load:', volunteerInfo.image);
                                                e.target.style.display = 'none';
                                                const container = e.target.parentElement;
                                                if (container) {
                                                    const fallback = container.querySelector('.fallback-avatar');
                                                    if (fallback) {
                                                        fallback.style.display = 'flex';
                                                    }
                                                }
                                            }}
                                            onLoad={() => {
                                                console.log('AdminProfile: Image loaded successfully:', volunteerInfo.image);
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"></div>
                                    </>
                                ) : null}
                                <div 
                                    className={`fallback-avatar w-full h-full bg-green-80 flex items-center justify-center ${
                                        volunteerInfo.image ? 'hidden' : 'flex'
                                    }`}
                                >
                                    <span className="text-6xl">👤</span>
                                </div>
                                
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h2 className="font-sf-rounded font-bold text-green-98 text-2xl md:text-3xl">
                                        {volunteerInfo.name}
                                    </h2>
                                    <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-green-90/30 rounded-custom-small mt-2">
                                        <span className="relative w-fit font-sf-rounded font-medium text-green-98 text-sm">
                                            {volunteerInfo.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-95 rounded-custom p-6">
                            <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-4">
                                Личная информация
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-sm">Телефон</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {volunteerInfo.phone}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-sm">Email</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {volunteerInfo.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-sm">Пол</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {volunteerInfo.gender}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-90 rounded-custom p-6">
                            <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-4">
                                О себе
                            </h3>
                            <p className="font-inter font-regular text-green-20 text-base leading-relaxed">
                                {volunteerInfo.bio}
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleEditProfile}
                                className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 transition-all duration-200 w-full mb-3"
                            >
                                Редактировать профиль
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
