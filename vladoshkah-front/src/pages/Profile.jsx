import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PetCard from '../components/PetCard'
import { animalService } from '../services/animalService'
import { userService } from '../services/userService'
import { favoriteService } from '../services/favoriteService'
import { useAuth } from '../context/AuthContext'
import { getPhotoUrl } from '../utils/photoHelpers' 

const Profile = () => {
    const [favoritePets, setFavoritePets] = useState([])
    const [loading, setLoading] = useState(true)
    const [userData, setUserData] = useState(null)
    const { user, refreshUser } = useAuth()
    const navigate = useNavigate()
    const lastUserIdRef = useRef(null)

    const getFavoriteStorageKey = () => {
        const currentUser = userData || user;
        return currentUser ? `favoritePets_${currentUser.id}` : 'favoritePets_anonymous';
    };

    useEffect(() => {
        console.log('Profile: Component mounted or user updated');
        console.log('Profile: Current user from context:', user);
        
        if (!user?.id) return;

        if (lastUserIdRef.current === user.id) return;
        lastUserIdRef.current = user.id;

        checkAccessAndLoadData();
    }, [user?.id])

    useEffect(() => {
        const handleStorageChange = (event) => {
            const storageKey = getFavoriteStorageKey();
            if (event.key === storageKey || !event.key) {
                console.log('🔄 Profile: Storage changed for current user, reloading favorites...');
                loadFavoritePets();
            }
        };

        const handleCustomFavoritesUpdate = (event) => {
            const eventUserId = event.detail?.userId;
            const currentUserId = (userData || user)?.id;
            
            if (!eventUserId || eventUserId === currentUserId) {
                console.log('🔄 Profile: Custom favorites update, reloading...');
                loadFavoritePets();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('favoritesUpdated', handleCustomFavoritesUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('favoritesUpdated', handleCustomFavoritesUpdate);
        };
    }, [user?.id, userData?.id]); 

    const checkAccessAndLoadData = async () => {
        try {
            setLoading(true);
            
            const token = localStorage.getItem('accessToken');
            const profileComplete = localStorage.getItem('profileComplete');
            
            console.log('Profile: Access check - Token:', !!token, 'ProfileComplete:', profileComplete);
            
            if (!token) {
                navigate('/регистрация');
                return;
            }

            if (profileComplete !== 'true') {
                navigate('/личная-информация');
                return;
            }

            console.log('Profile: Access granted - loading data...');
            await loadUserDataFromServer();
            await loadFavoritePets();
            
        } catch (error) {
            console.error('Profile: Error in checkAccessAndLoadData:', error);
        } finally {
            setLoading(false);
        }
    }

    const loadUserDataFromServer = async () => {
        try {
            console.log('Profile: Loading fresh user data from server...');
            
            const serverUserData = refreshUser
                ? await refreshUser()
                : await userService.getCurrentUser();
            console.log('Profile: User data loaded from server:', serverUserData);
            
            setUserData(serverUserData);
            localStorage.setItem('user', JSON.stringify(serverUserData));
            
        } catch (error) {
            console.error('Profile: Error loading user data from server:', error);
            if (user) {
                console.log('Profile: Using context data as fallback');
                setUserData(user);
            }
        }
    }

    const loadFavoritePets = async () => {
        try {
            console.log('Profile: Loading favorite pets...');
            
            const currentUser = userData || user;
            if (!currentUser?.id) {
                console.log('Profile: No user ID available');
                setFavoritePets([]);
                return;
            }
            
            const storageKey = getFavoriteStorageKey();
            const favoriteIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const uniqueFavoriteIds = [...new Set(favoriteIds)];
            
            console.log('📋 Profile: Favorite pets IDs for user', currentUser.id, ':', uniqueFavoriteIds);
            
            if (uniqueFavoriteIds.length === 0) {
                setFavoritePets([]);
                return;
            }
            const petPromises = uniqueFavoriteIds.map(async (petId) => {
                try {
                    console.log(`Profile: Loading pet ${petId}...`);
                    const pet = await animalService.getAnimalById(petId);
                    console.log(`Profile: Pet ${petId} loaded:`, pet?.name);
                    return pet;
                } catch (error) {
                    console.error(`Profile: Error loading pet ${petId}:`, error);
                    return null;
                }
            });
            
            const results = await Promise.all(petPromises);
            const validPets = results.filter(pet => pet !== null && pet.id);
            
            console.log(`Profile: Loaded ${validPets.length} favorite pets for user ${currentUser.id}:`, 
                validPets.map(pet => ({ id: pet.id, name: pet.name }))
            );
            
            setFavoritePets(validPets);
            
        } catch (error) {
            console.error('Profile: Error loading favorite pets:', error);
            setFavoritePets([]);
        }
    }
    const forceRefreshFavorites = async () => {
        console.log('🔄 Profile: Force refreshing favorites...');
        setLoading(true);
        try {
            await loadFavoritePets();
            console.log(' Profile: Favorites force refreshed');
        } catch (error) {
            console.error(' Profile: Error force refreshing favorites:', error);
        } finally {
            setLoading(false);
        }
    }

    const getProfilePhotoUrl = () => {
        const currentUser = userData || user;
        
        if (!currentUser) {
            console.log(' Profile: No user data available');
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
    }

    const getVolunteerInfo = () => {
        const currentUser = userData || user;
        
        if (!currentUser) {
            return {
                name: "Пользователь",
                status: "Подтвержденный волонтер",
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
            status: "Подтвержденный волонтер",
            phone: currentUser.phone || "Не указан",
            email: currentUser.email || "Email не указан",
            gender: displayGender,
            bio: displayBio,
            image: profileImage
        };
    }

    const refreshProfile = async () => {
        console.log(' Profile: Manual refresh requested');
        setLoading(true);
        
        try {
            await loadUserDataFromServer();
            await loadFavoritePets();
            console.log('Profile: Manual refresh completed');
        } catch (error) {
            console.error('Profile: Manual refresh failed:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleEditProfile = () => {
        console.log('Profile: Navigating to edit profile');
        navigate('/личная-информация');
    }

    const volunteerInfo = getVolunteerInfo();

    return (
        <div className="min-h-screen bg-green-95">
            <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
                
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    <main className="flex-1">
                        <section className="flex flex-col items-center gap-6 relative">
                            <header className="flex items-center gap-6 relative self-stretch w-full">
                                <h1 className="w-fit mt-[-1.00px] font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                                    Мои питомцы
                                </h1>
                                <div className="flex gap-2">

                                </div>
                            </header>

                            {loading ? (
                                <div className="text-center py-12 w-full">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-50 mx-auto"></div>
                                    <p className="text-green-30 mt-4 font-inter font-medium">
                                        Загрузка данных профиля...
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {favoritePets.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                            {favoritePets.map((pet) => (
                                                <PetCard 
                                                    key={pet.id}
                                                    petData={pet}
                                                    initialFavorite={true}
                                                    onFavoriteChange={forceRefreshFavorites} 
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
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                                                    Нет избранных питомцев
                                                </h3>
                                                <p className="font-inter text-green-20 mb-4">
                                                    Добавляйте питомцев в избранное, нажимая на сердечко на карточках животных
                                                </p>
                                                <button
                                                    onClick={() => navigate('/найти-питомца')}
                                                    className="px-6 py-2 bg-green-50 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 transition-all duration-200"
                                                >
                                                    Найти питомцев
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </main>

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
                                                console.error('Profile: Image failed to load:', volunteerInfo.image);
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
                                                console.log('Profile: Image loaded successfully:', volunteerInfo.image);
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
                                    <span className="text-6xl"></span>
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
                                className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 transition-all duration-200 w-full"
                            >
                                Редактировать профиль
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default Profile;