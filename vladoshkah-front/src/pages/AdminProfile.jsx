import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const { user, refreshUser, updateUser } = useAuth();

    const [shelterInfo, setShelterInfo] = useState(null);
    const [shelterPets, setShelterPets] = useState([]);
    const [favoritePets, setFavoritePets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('favorites');
    const [shelterFavoritesMap, setShelterFavoritesMap] = useState({});
    const lastUserIdRef = useRef(null);


    useEffect(() => {
        const checkRoleAndLoadData = async () => {
            try {
                setLoading(true);
                
                let freshUser = user;
                if (!freshUser) {
                    freshUser = await refreshUser();
                }
                console.log('AdminProfile: Fresh user data:', freshUser);
                
                if (!freshUser || (!isShelterAdminRole(freshUser.role) && freshUser.role !== 'admin')) {
                    console.log('AdminProfile: User is not admin, redirecting to profile');
                    navigate('/profile');
                    return;
                }
                
                console.log('AdminProfile: User is admin, loading admin data');
                
                await loadUserDataFromServer();
                await loadAdminData(freshUser);
                
            } catch (error) {
                console.error('AdminProfile: Error in role check:', error);
                if (error.response?.status === 429) {
                    const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
                    if (cachedUser && (isShelterAdminRole(cachedUser.role) || cachedUser.role === 'admin')) {
                        await loadAdminData(cachedUser);
                        return;
                    }
                }
                navigate('/profile');
            }
        };

        checkRoleAndLoadData();
    }, [navigate]);
    
    useEffect(() => {
        if (location.state?.refresh) {
            console.log('AdminProfile: Refresh flag detected, reloading data');
            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            if (currentUser?.id && (isShelterAdminRole(currentUser.role) || currentUser.role === 'admin')) {
                loadAdminData(currentUser);
            }
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, user, navigate]);
    
    const deletionInProgressRef = useRef(false);

    useEffect(() => {
        const handleFocus = async () => {
            if (deletionInProgressRef.current) {
                console.log('AdminProfile: Skipping refresh on focus - deletion in progress');
                return;
            }
            
            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            if (currentUser?.id && (isShelterAdminRole(currentUser.role) || currentUser.role === 'admin')) {
                console.log('AdminProfile: Window focused, refreshing data');
                try {
                    await loadAdminData(currentUser);
                } catch (error) {
                    console.error('AdminProfile: Error refreshing on focus:', error);
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (deletionInProgressRef.current) {
                console.log('AdminProfile: Skipping refresh on visibility - deletion in progress');
                return;
            }
            
            if (document.visibilityState === 'visible') {
                const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                if (currentUser?.id && (isShelterAdminRole(currentUser.role) || currentUser.role === 'admin')) {
                    console.log('AdminProfile: Page visible, refreshing data');
                    try {
                        await loadAdminData(currentUser);
                    } catch (error) {
                        console.error('AdminProfile: Error refreshing on visibility change:', error);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    useEffect(() => {
        const handleCustomFavoritesUpdate = (event) => {
            const eventUserId = event.detail?.userId;
            const currentUserId = (userData || user)?.id;
            
            if (!eventUserId || eventUserId === currentUserId) {
                console.log('AdminProfile: Custom favorites update, reloading...');
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
            
            if (user) {
                console.log('AdminProfile: Using context user data');
                setUserData(user);
                return;
            }
            
            try {
                const serverUserData = refreshUser
                    ? await refreshUser()
                    : await userService.getCurrentUser();
                console.log('AdminProfile: User data loaded from server:', serverUserData);
                setUserData(serverUserData);
                localStorage.setItem('user', JSON.stringify(serverUserData));
            } catch (refreshError) {
                if (refreshError.response?.status === 429) {
                    const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
                    if (cachedUser) {
                        console.log('AdminProfile: Using cached user data due to 429 error');
                        setUserData(cachedUser);
                        return;
                    }
                }
                throw refreshError;
            }
            
        } catch (error) {
            console.error('AdminProfile: Error loading user data from server:', error);
            const fallbackUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            if (fallbackUser) {
                console.log('AdminProfile: Using fallback user data');
                setUserData(fallbackUser);
            }
        }
    };

    const loadAdminData = async (currentUser) => {
        try {
            console.log('AdminProfile: Loading admin data for user:', currentUser);
            
            await loadFavoritePets();
            
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

    const loadShelterPets = async (shelterId, skipIfDeleting = true) => {
        if (skipIfDeleting && deletionInProgressRef.current) {
            console.log('AdminProfile: Skipping loadShelterPets - deletion in progress');
            return;
        }
        
        try {
            console.log('AdminProfile: Loading shelter pets for shelter ID:', shelterId);
            const pets = await animalService.getAnimalsByShelter(shelterId);
            
            if (!deletionInProgressRef.current) {
                setShelterPets(pets || []);
                console.log('AdminProfile: Shelter pets loaded:', pets?.length || 0);
                
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
                
                if (pets?.length >= 0) {
                    setActiveTab('shelter');
                }
            } else {
                console.log('AdminProfile: Skipping state update - deletion in progress');
            }
        } catch (error) {
            console.error('AdminProfile: Error loading shelter pets:', error);
            if (!deletionInProgressRef.current) {
                setShelterPets([]);
                setShelterFavoritesMap({});
            }
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
            
            const favoriteIds = await favoriteService.getUserFavorites(currentUser.id);
            console.log('AdminProfile: Favorite pets IDs for user', currentUser.id, ':', favoriteIds);
            
            if (!favoriteIds || favoriteIds.length === 0) {
                setFavoritePets([]);
                return;
            }
            
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
        console.log('AdminProfile: Force refreshing favorites...');
        try {
            await loadFavoritePets();
            console.log(' AdminProfile: Favorites force refreshed');
        } catch (error) {
            console.error(' AdminProfile: Error force refreshing favorites:', error);
        }
    };

    const forceRefreshShelterPets = async () => {
        console.log('AdminProfile: Force refreshing shelter pets...');
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
        navigate('/register-shelter');
    };

    const handleAddPet = () => {
        if (shelterInfo) {
            navigate('/add-pet');
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
        navigate('/personal-info');
    };

    const handleDeletePet = async (petId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого питомца? Это действие нельзя отменить.')) {
            return;
        }

        deletionInProgressRef.current = true;

        try {
            console.log('AdminProfile: Deleting pet:', petId, 'Type:', typeof petId);
            await animalService.deleteAnimal(petId);
            console.log('AdminProfile: Pet deleted successfully');
            
            const petIdNum = Number(petId);
            setShelterPets(prev => {
                const filtered = prev.filter(pet => {
                    const petIdToCompare = Number(pet.id);
                    const shouldKeep = petIdToCompare !== petIdNum;
                    if (!shouldKeep) {
                        console.log('AdminProfile: Filtering out pet:', pet.id, 'Type:', typeof pet.id);
                    }
                    return shouldKeep;
                });
                console.log('AdminProfile: Updated shelterPets, removed pet:', petId, 'Previous count:', prev.length, 'New count:', filtered.length);
                return filtered;
            });
            
            setFavoritePets(prev => prev.filter(pet => Number(pet.id) !== petIdNum));
            setShelterFavoritesMap(prev => {
                const updated = { ...prev };
                delete updated[petId];
                delete updated[petIdNum];
                return updated;
            });
            
            window.dispatchEvent(new CustomEvent('petDeleted', { 
                detail: { petId: petIdNum, shelterId: shelterInfo?.id } 
            }));
            
            setTimeout(() => {
                deletionInProgressRef.current = false;
                console.log('AdminProfile: Deletion flag reset, reloads enabled again');
            }, 5000);
            
        } catch (error) {
            console.error('AdminProfile: Error deleting pet:', error);
            alert('Не удалось удалить питомца. Попробуйте еще раз.');
            deletionInProgressRef.current = false;
            if (shelterInfo?.id) {
                await loadShelterPets(shelterInfo.id, false);
            }
        }
    };

    const renderPetsGrid = () => {
        const pets = activeTab === 'favorites' ? favoritePets : shelterPets;
        const emptyMessage = activeTab === 'favorites' 
            ? {
                title: "Нет избранных питомцев",
                message: "Добавляйте питомцев в избранное, нажимая на сердечко на карточках животных",
                buttonText: "Найти питомцев",
                onButtonClick: () => navigate('/find-pet')
            }
            : {
                title: "Нет питомцев в приюте",
                message: "Добавьте первого питомца в ваш приют",
                buttonText: "Добавить питомца",
                onButtonClick: handleAddPet
            };

        return pets.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
                {pets.map((pet) => (
                    <PetCard 
                        key={pet.id}
                        petData={pet}
                        initialFavorite={activeTab === 'favorites' ? true : shelterFavoritesMap[pet.id] === true}
                        onDelete={activeTab === 'shelter' ? handleDeletePet : null}
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
            <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-6 sm:py-8 md:py-10">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                    <main className="flex-1">
                        {!shelterInfo && (
                            <section className="bg-green-90 rounded-custom p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border-2 border-green-80">
                                <div className="text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-80 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h2 className="font-sf-rounded font-bold text-green-30 text-xl sm:text-2xl mb-3 sm:mb-4">
                                        Зарегистрируйте приют
                                    </h2>
                                    <p className="font-inter text-green-40 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                                        Внесите корректные данные о приюте, чьим представителем вы являетесь
                                    </p>
                                    <button
                                        onClick={handleRegisterShelter}
                                        className="px-6 sm:px-8 py-3 sm:py-4 bg-green-70 text-green-100 font-sf-rounded font-semibold text-sm sm:text-base md:text-lg rounded-custom-small hover:bg-green-60 transition-colors shadow-lg"
                                    >
                                        Зарегистрировать приют
                                    </button>
                                </div>
                            </section>
                        )}

                        {shelterInfo && (
                            <section className="bg-green-90 rounded-custom p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-green-50">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                                    <div className="flex-1">
                                        <h2 className="font-sf-rounded font-bold text-green-30 text-xl sm:text-2xl mb-2">
                                            Ваш приют: {shelterInfo.name}
                                        </h2>
                                        {shelterInfo.address && (
                                            <p className="font-inter text-green-40 text-xs sm:text-sm mt-1">
                                                Адрес: {shelterInfo.address}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={handleAddPet}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-green-40 text-green-100 font-sf-rounded font-semibold text-sm sm:text-base rounded-custom-small hover:bg-green-60 cursor-pointer transition-colors"
                                        >
                                            + Добавить питомца
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        
                        <section className="flex flex-col items-center gap-4 sm:gap-6 relative">
                            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative self-stretch w-full gap-3 sm:gap-4">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <h1 className="w-fit mt-[-1.00px] font-sf-rounded font-bold text-green-20 text-xl sm:text-2xl md:text-3xl">
                                        {activeTab === 'favorites' ? 'Избранные питомцы' : 'Питомцы приюта'}
                                    </h1>
                                    <span className="px-2 sm:px-3 py-1 bg-green-40 text-green-100 font-sf-rounded font-medium text-xs sm:text-sm rounded-full">
                                        {activeTab === 'favorites' ? favoritePets.length : shelterPets.length}
                                    </span>
                                </div>
                                
                                {shelterInfo && (
                                    <div className="flex border border-green-80 rounded-custom-small overflow-hidden w-full sm:w-auto">
                                        <button
                                            onClick={() => setActiveTab('favorites')}
                                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-sf-rounded font-medium text-xs sm:text-sm transition-colors ${
                                                activeTab === 'favorites' 
                                                    ? 'bg-green-40 text-green-100' 
                                                    : 'bg-green-90 text-green-40 hover:bg-green-80'
                                            }`}
                                        >
                                            Избранные
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('shelter')}
                                            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 font-sf-rounded font-medium text-xs sm:text-sm transition-colors ${
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

                    <aside className="w-full lg:w-[340px] flex flex-col gap-4 sm:gap-6">
                        <div className="relative bg-green-90 rounded-custom overflow-hidden">
                            <div className="relative h-48 sm:h-56 md:h-64">
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
                                    <svg className="w-16 h-16 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                
                                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                                    <h2 className="font-sf-rounded font-bold text-green-98 text-xl sm:text-2xl md:text-3xl">
                                        {volunteerInfo.name}
                                    </h2>
                                    <div className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-90/30 rounded-custom-small mt-2">
                                        <span className="relative w-fit font-sf-rounded font-medium text-green-98 text-xs sm:text-sm">
                                            {volunteerInfo.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-95 rounded-custom p-4 sm:p-6">
                            <h3 className="font-sf-rounded font-bold text-green-20 text-base sm:text-lg mb-3 sm:mb-4">
                                Личная информация
                            </h3>
                            
                            <div className="space-y-3">
                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-xs sm:text-sm">Телефон</span>
                                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-sm sm:text-base">
                                            {volunteerInfo.phone}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-xs sm:text-sm">Email</span>
                                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-sm sm:text-base break-all">
                                            {volunteerInfo.email}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-green-40 font-inter font-medium text-xs sm:text-sm">Пол</span>
                                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                                        <span className="font-inter font-regular text-green-20 text-sm sm:text-base">
                                            {volunteerInfo.gender}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-90 rounded-custom p-4 sm:p-6">
                            <h3 className="font-sf-rounded font-bold text-green-20 text-base sm:text-lg mb-3 sm:mb-4">
                                О себе
                            </h3>
                            <p className="font-inter font-regular text-green-20 text-sm sm:text-base leading-relaxed">
                                {volunteerInfo.bio}
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleEditProfile}
                                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-sm sm:text-base rounded-custom-small hover:bg-green-60 transition-all duration-200 w-full mb-3"
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
