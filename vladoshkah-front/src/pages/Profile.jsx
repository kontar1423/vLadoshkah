import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PetCard from '../components/PetCard'
import { animalService } from '../services/animalService'
import { shelterService } from '../services/shelterService'
import { favoriteService } from '../services/favoriteService'
import { useAuth } from '../context/AuthContext'
import { getPhotoUrl } from '../utils/photoHelpers' 
import { isShelterAdminRole } from '../utils/roleUtils'

const Profile = ({ isInAdminPanel = false }) => {
    const [favoritePets, setFavoritePets] = useState([])
    const [shelterPets, setShelterPets] = useState([])
    const [shelterInfo, setShelterInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('favorites')
    const [shelterFavoritesMap, setShelterFavoritesMap] = useState({})
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        loadProfileData();
    }, [user]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            await loadFavoritePets();
            const canManageShelter = isShelterAdminRole(user?.role);
            
            if (canManageShelter) {
                await loadShelterData();
            }
            
        } catch (error) {
            console.error('Profile: Ошибка загрузки данных:', error);
        } finally {
            setLoading(false);
        }
    }

    const loadShelterData = async () => {
        try {
            let shelterId = user?.shelter_id;
            let shelter = null;

            if (shelterId) {
                shelter = await shelterService.getShelterById(shelterId);
            }

            if (!shelter && user?.id) {
                const shelterByAdmin = await shelterService.getShelterByAdminId(user.id);

                if (shelterByAdmin) {
                    shelter = shelterByAdmin;
                    shelterId = shelterByAdmin.id;

                    if (!user?.shelter_id && updateUser) {
                        updateUser({ shelter_id: shelterByAdmin.id });
                    }
                }
            }

            if (shelter && shelterId) {
                setShelterInfo(shelter);
                await loadShelterPets(shelterId);
                if (isShelterAdminRole(user?.role)) {
                    setActiveTab('shelter');
                }
            } else {
                setShelterInfo(null);
                setShelterPets([]);
            }
        } catch (error) {
            console.error('Profile: Ошибка загрузки приюта:', error);
            setShelterInfo(null);
            setShelterPets([]);
        }
    }

    const loadShelterPets = async (shelterId) => {
        try {
            const pets = await shelterService.getShelterAnimals(shelterId);
            setShelterPets(pets || []);
            
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
        } catch (error) {
            console.error('Profile: Ошибка загрузки питомцев:', error);
            setShelterPets([]);
            setShelterFavoritesMap({});
        }
    }

    const loadFavoritePets = async () => {
        try {
            if (!user?.id) {
                setFavoritePets([]);
                return;
            }
            
            const favoriteIds = await favoriteService.getUserFavorites(user.id);
            
            if (!favoriteIds || favoriteIds.length === 0) {
                setFavoritePets([]);
                return;
            }

            const petPromises = favoriteIds.map(async (petId) => {
                try {
                    const pet = await animalService.getAnimalById(petId);
                    return pet;
                } catch (error) {
                    console.error(`Profile: Ошибка загрузки питомца ${petId}:`, error);
                    return null;
                }
            });
            
            const results = await Promise.all(petPromises);
            const validPets = results.filter(pet => pet !== null && pet.id);
            
            setFavoritePets(validPets);
            
        } catch (error) {
            console.error('Profile: Ошибка загрузки избранных питомцев:', error);
            setFavoritePets([]);
        }
    }

    useEffect(() => {
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

        window.addEventListener('favoritesUpdated', handleShelterFavoritesUpdate);
        return () => {
            window.removeEventListener('favoritesUpdated', handleShelterFavoritesUpdate);
        };
    }, [user?.id]);

    const handleAddPet = () => {
        if (shelterInfo) {
            navigate('/add-pet');
        } else {
            alert('Сначала зарегистрируйте приют');
        }
    }

    const handleRegisterShelter = () => {
        navigate('/register-shelter');
    }

    const handleEditProfile = () => {
        navigate('/personal-info');
    }

    const canManageShelter = isShelterAdminRole(user?.role);

    const shouldShowShelterRegistration = 
        canManageShelter && 
        !shelterInfo;

    const shouldShowShelterManagement = 
        canManageShelter && 
        Boolean(shelterInfo);

    const renderPetsGrid = () => {
        const pets = activeTab === 'favorites' ? favoritePets : shelterPets;
        
        if (pets.length === 0) {
            return (
                <div className="text-center py-12 w-full">
                    <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                        <svg className="w-16 h-16 text-green-60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                activeTab === 'favorites' 
                                    ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    : "M12 4v16m8-8H4"
                            } />
                        </svg>
                        <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                            {activeTab === 'favorites' ? 'Нет избранных питомцев' : 'Нет питомцев в приюте'}
                        </h3>
                        <p className="font-inter text-green-20 mb-4">
                            {activeTab === 'favorites' 
                                ? 'Добавляйте питомцев в избранное, нажимая на сердечко на карточках животных'
                                : 'Добавьте первого питомца в ваш приют'
                            }
                        </p>
                        <button
                            onClick={activeTab === 'favorites' ? () => navigate('/find-pet') : handleAddPet}
                            className="px-6 py-2 bg-green-50 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 transition-all duration-200"
                        >
                            {activeTab === 'favorites' ? 'Найти питомцев' : 'Добавить питомца'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
                {pets.map((pet) => (
                    <PetCard 
                        key={pet.id}
                        petData={pet}
                        initialFavorite={activeTab === 'favorites' ? true : shelterFavoritesMap[pet.id] === true}
                        showShelterInfo={activeTab !== 'shelter'}
                    />
                ))}
            </div>
        );
    }

    const getProfilePhotoUrl = () => {
        if (!user) return null;

        if (user.photoUrl) {
            return getPhotoUrl({ url: user.photoUrl });
        }

        if (user.photos && user.photos.length > 0) {
            return getPhotoUrl(user.photos[0]);
        }

        return null;
    }

    const profileImage = getProfilePhotoUrl();

    const getUserStatus = () => {
        if (user?.role === 'admin') return 'Администратор системы';
        if (isShelterAdminRole(user?.role)) {
            return shelterInfo ? 'Администратор приюта' : 'Администратор приюта (приют не зарегистрирован)';
        }
        return 'Подтвержденный волонтер';
    };

    return (
        <div className={`min-h-screen ${isInAdminPanel ? 'bg-transparent' : 'bg-green-95'}`}>
            <div className="max-w-container mx-auto px-4 md:px-8 lg:px-16 py-10">
                
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    <main className="flex-1">
                        {shouldShowShelterRegistration && (
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

                        {shouldShowShelterManagement && (
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
                                        {shelterInfo.rating && (
                                            <p className="font-inter text-green-40 text-sm mt-1">
                                                Рейтинг: {shelterInfo.rating} ★ ({shelterInfo.total_ratings} оценок)
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleAddPet}
                                            className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 cursor-pointer transition-colors"
                                        >
                                            + Добавить питомца
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="flex flex-col items-center gap-6">
                            <header className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-4">
                                    <h1 className="font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                                        {shouldShowShelterManagement && activeTab === 'shelter' ? 'Питомцы приюта' : 'Избранные питомцы'}
                                    </h1>
                                    <span className="px-3 py-1 bg-green-50 text-green-100 font-sf-rounded font-medium text-sm rounded-full">
                                        {shouldShowShelterManagement && activeTab === 'shelter' ? shelterPets.length : favoritePets.length}
                                    </span>
                                </div>
                                
                                {shouldShowShelterManagement && (
                                    <div className="flex border border-green-80 rounded-custom-small overflow-hidden">
                                        <button
                                            onClick={() => setActiveTab('favorites')}
                                            className={`px-4 py-2 font-sf-rounded font-medium text-sm transition-colors ${
                                                activeTab === 'favorites' 
                                                    ? 'bg-green-50 text-green-100' 
                                                    : 'bg-green-90 text-green-40 hover:bg-green-80'
                                            }`}
                                        >
                                            Избранные
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('shelter')}
                                            className={`px-4 py-2 font-sf-rounded font-medium text-sm transition-colors ${
                                                activeTab === 'shelter' 
                                                    ? 'bg-green-50 text-green-100' 
                                                    : 'bg-green-90 text-green-40 hover:bg-green-80'
                                            }`}
                                        >
                                            Питомцы приюта
                                        </button>
                                    </div>
                                )}
                            </header>

                            {loading ? (
                                <div className="text-center py-12 w-full">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-50 mx-auto"></div>
                                    <p className="text-green-30 mt-4 font-inter font-medium">
                                        Загрузка данных профиля...
                                    </p>
                                </div>
                            ) : (
                                renderPetsGrid()
                            )}
                        </section>
                    </main>

                    <aside className="lg:w-80 flex flex-col gap-6">
                        <div className="relative bg-green-90 rounded-custom overflow-hidden">
                            <div className="relative h-64">
                                {profileImage ? (
                                    <>
                                        <img
                                            className="w-full h-full object-cover"
                                            alt="Фото профиля"
                                            src={profileImage}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-green-80 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                )}
                                
                                <div className="absolute bottom-6 left-6 right-6">
                                    <h2 className="font-sf-rounded font-bold text-green-98 text-2xl md:text-3xl">
                                        {user?.firstname && user?.lastname 
                                            ? `${user.firstname} ${user.lastname}`
                                            : user?.email?.split('@')[0] || 'Пользователь'
                                        }
                                    </h2>
                                    <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-green-90/30 rounded-custom-small mt-2">
                                        <span className="font-sf-rounded font-medium text-green-98 text-sm">
                                            {getUserStatus()}
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
                                <div>
                                    <span className="text-green-40 font-inter font-medium text-sm">Телефон</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30 mt-1">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {user?.phone || "Не указан"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-green-40 font-inter font-medium text-sm">Email</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30 mt-1">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {user?.email || "Email не указан"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-green-40 font-inter font-medium text-sm">О себе</span>
                                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30 mt-1 min-h-[80px]">
                                        <span className="font-inter font-regular text-green-20 text-base">
                                            {user?.bio || user?.personalInfo || "Расскажите о себе в личной информации"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleEditProfile}
                                className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 transition-all duration-200 w-full"
                            >
                                Редактировать профиль
                            </button>
                        </div>

                        {!canManageShelter && (
                            <div className="text-right mt-4">
                                <p className="text-green-40 font-inter text-xs">
                                    Вы являетесь представителем приюта? Свяжитесь с нами по{' '}
                                    <a 
                                        href="mailto:admin@vladoshkah.ru" 
                                        className="text-green-50 font-inter font-medium underline hover:text-green-60 transition-colors"
                                    >
                                        почте
                                    </a>
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Profile;
