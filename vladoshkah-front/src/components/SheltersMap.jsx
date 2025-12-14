    import React, { useState, useEffect } from 'react';
    import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
    import 'leaflet/dist/leaflet.css';
    import L from 'leaflet';
    import LapaIcon from '../assets/images/lapa.png'; 
    import { geocodingService } from '../services/geocodingService';

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    const createCustomIcon = (isHighlighted = false) => {
    const size = isHighlighted ? 50 : 35;
    return L.divIcon({
        html: `
        <div style="
            background-color: #00522C;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            overflow: hidden;
        ">
            <img 
            src="${LapaIcon}" 
            alt="Лапа" 
            style="
                width: ${size * 0.6}px;
                height: ${size * 0.6}px;
                filter: brightness(0) invert(1);
            "
            onerror="this.style.display='none'"
            />
        </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
    };

    const SheltersMap = ({ 
    shelters, 
    searchQuery = "",
    highlightedShelters = [] 
    }) => {
    const center = [55.7558, 37.6173];
    const [sheltersWithCoords, setSheltersWithCoords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCoordinates = async () => {
        setLoading(true);
        
        const sheltersWithCoordinates = await Promise.all(
            shelters.map(async (shelter) => {
            let coordinates = null;
            
            // Попытка геокодирования по адресу
            if (shelter.address) {
                try {
                // Нормализуем адрес: убираем дублирование "Москва" и лишние запятые
                let normalizedAddress = shelter.address.trim();
                
                // Убираем дублирование "Москва" в конце адреса
                normalizedAddress = normalizedAddress.replace(/,\s*Москва\s*,?\s*Москва\s*$/i, ', Москва');
                normalizedAddress = normalizedAddress.replace(/,\s*Москва\s*$/i, ', Москва');
                
                // Если адрес уже содержит "Москва", не добавляем его повторно
                if (!normalizedAddress.toLowerCase().includes('москва')) {
                    normalizedAddress = `${normalizedAddress}, Москва`;
                }
                
                const geocodeResult = await geocodingService.getCoordinates(normalizedAddress);
                
                // Преобразуем объект {lat, lng} в массив [lat, lng] для Leaflet
                if (geocodeResult && geocodeResult.lat && geocodeResult.lng) {
                    coordinates = [geocodeResult.lat, geocodeResult.lng];
                    console.log(`✓ Геокодирование успешно для приюта "${shelter.name}":`, coordinates);
                } else {
                    // Выводим предупреждение только если нет fallback вариантов
                    if (!shelter.districtId) {
                        console.warn(`⚠ Геокодирование вернуло null для приюта "${shelter.name}" с адресом "${shelter.address}"`);
                    }
                }
                } catch (error) {
                console.error(`✗ Ошибка геокодирования для приюта "${shelter.name}":`, error);
                }
            } else {
                console.warn(`⚠ У приюта "${shelter.name}" нет адреса`);
            }
            
            // Fallback: координаты по округу
            if (!coordinates && shelter.districtId) {
                coordinates = getCoordinatesByDistrict(shelter.districtId);
                console.log(`📍 Использованы координаты округа для приюта "${shelter.name}":`, coordinates);
            }
            
            // Fallback: случайные координаты в пределах Москвы
            if (!coordinates) {
                coordinates = getFallbackCoordinates(shelter.id);
                console.log(`📍 Использованы fallback координаты для приюта "${shelter.name}":`, coordinates);
            }
            
            return {
                ...shelter,
                coordinates: coordinates
            };
            })
        );
        
        console.log(`✅ Загружено координат для ${sheltersWithCoordinates.length} из ${shelters.length} приютов`);
        setSheltersWithCoords(sheltersWithCoordinates);
        setLoading(false);
        };

        if (shelters && shelters.length > 0) {
            loadCoordinates();
        } else {
            setSheltersWithCoords([]);
            setLoading(false);
        }
    }, [shelters]);

    const getCoordinatesByDistrict = (districtId) => {
        const districtCoordinates = {
        'cao': [55.7558, 37.6176],    // Центральный
        'sao': [55.8353, 37.5245],    // Северный
        'svao': [55.8500, 37.6333],   // Северо-Восточный
        'vao': [55.7870, 37.7830],    // Восточный
        'yuvao': [55.6100, 37.7600],  // Юго-Восточный
        'yao': [55.6100, 37.6800],    // Южный
        'yuzao': [55.6600, 37.5500],  // Юго-Западный
        'zao': [55.7340, 37.4100],    // Западный
        'szao': [55.8270, 37.4300],   // Северо-Западный
        'zelao': [55.9820, 37.1800],  // Зеленоградский
        'tinao': [55.4000, 37.2000],  // Троицкий
        'nao': [55.5500, 37.3500],    // Новомосковский
        };
        
        return districtCoordinates[districtId] || null;
    };


    const getFallbackCoordinates = (shelterId) => {
        const moscowBounds = {
        lat: [55.5, 56.0],
        lng: [37.3, 37.9]
        };
        
        const seed = shelterId || Math.random();
        const lat = moscowBounds.lat[0] + (seed * 37 % 100) / 200;
        const lng = moscowBounds.lng[0] + (seed * 73 % 100) / 200;
        
        return [lat, lng];
    };

    const filteredShelters = sheltersWithCoords.filter(shelter =>
        searchQuery.trim() === "" ||
        shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shelter.address && shelter.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isShelterHighlighted = (shelterId) => {
        return highlightedShelters.includes(shelterId) || 
            (searchQuery && filteredShelters.some(s => s.id === shelterId));
    };

    if (loading) {
        return (
        <div className="w-full h-full flex items-center justify-center bg-green-90 rounded-custom">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-40 mx-auto mb-4"></div>
            <p className="font-inter text-green-40">Загрузка карты...</p>
            </div>
        </div>
        );
    }

    return (
        <div className="w-full h-full relative" style={{ zIndex: 1 }}>
        {searchQuery && (
            <div className="absolute top-4 left-4 z-[1000] bg-green-90 border-2 border-green-40 rounded-custom-small px-4 py-2 shadow-lg">
            <span className="font-inter text-green-30 text-sm">
                Найдено приютов: <strong>{filteredShelters.length}</strong>
                {searchQuery && ` по запросу "${searchQuery}"`}
            </span>
            </div>
        )}

        <MapContainer 
            center={center} 
            zoom={10} 
            style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
            className="rounded-custom leaflet-container-custom"
            zoomControl={true}
        >
            <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {sheltersWithCoords.map((shelter) => {
            const isHighlighted = isShelterHighlighted(shelter.id);
            const isVisible = filteredShelters.some(s => s.id === shelter.id) || searchQuery === "";

            // Проверяем, что координаты есть и это массив [lat, lng]
            if (!isVisible || !shelter.coordinates || !Array.isArray(shelter.coordinates) || shelter.coordinates.length !== 2) {
                if (!shelter.coordinates) {
                    console.warn(`⚠ Приют "${shelter.name}" (ID: ${shelter.id}) не имеет координат`);
                }
                return null;
            }

            return (
                <Marker 
                key={shelter.id} 
                position={shelter.coordinates}
                icon={createCustomIcon(isHighlighted)}
                >
                <Popup>
                    <div 
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                window.location.href = `/shelter/${shelter.id}`;
                            }
                        }}
                        className="p-3 min-w-[250px] cursor-pointer md:cursor-default"
                    >
                    <h3 className={`font-sf-rounded font-bold text-lg mb-1 ${
                        isHighlighted ? 'text-green-40' : 'text-green-40'
                    }`}>
                        {shelter.name}
                        
                    </h3>
                    
                    {shelter.address && (
                        <p className="font-inter text-green-40 text-sm mb-1">
                        <strong>Адрес:</strong> {shelter.address}
                        </p>
                    )}
                    
                    {shelter.phone && (
                        <p className="font-inter text-green-40 text-sm mb-1">
                        <strong>Телефон:</strong> {shelter.phone}
                        </p>
                    )}
                    
                    {shelter.district && (
                        <p className="font-inter text-green-40 text-sm mb-1">
                        <strong>Округ:</strong> {shelter.district}
                        </p>
                    )}
                    
                    <button
                        onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/shelter/${shelter.id}`;
                        }}
                        className="hidden md:block w-full px-3 py-2 bg-green-40 text-green-98 rounded-custom-small text-sm hover:bg-green-40 transition-colors"
                    >
                        Подробнее
                    </button>
                    </div>
                </Popup>
                </Marker>
            );
            })}
        </MapContainer>
        </div>
    );
    };

    export default SheltersMap;