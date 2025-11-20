    import React from 'react';
    import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
    import 'leaflet/dist/leaflet.css';
    import L from 'leaflet';
    import LapaIcon from '../assets/images/lapa.png'; 

    // Фикс для отображения маркеров в React-Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Создаем кастомную иконку с изображением лапы
    const createCustomIcon = (isHighlighted = false) => {
    const size = isHighlighted ? 40 : 35;
    const borderWidth = isHighlighted ? 4 : 3;
    
    return L.divIcon({
        html: `
        <div style="
            background-color: ${isHighlighted ? '#00522C' : '#00522C'};
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            transition: all 0.3s ease;
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
    onShelterClick, 
    searchQuery = "",
    highlightedShelters = [] 
    }) => {
    const center = [55.7558, 37.6173];

    // Функция для получения координат по ID приюта
    const getCoordinatesByShelterId = (shelterId) => {
        const districtCoordinates = {
        'cao': [55.7558, 37.6176],
        'sao': [55.8353, 37.5245],
        'svao': [55.8500, 37.6333],
        'vao': [55.7870, 37.7830],
        'yuvao': [55.6100, 37.7600],
        'yao': [55.6100, 37.6800],
        'yuzao': [55.6600, 37.5500],
        'zao': [55.7340, 37.4100],
        'szao': [55.8270, 37.4300],
        'zelao': [55.9820, 37.1800],
        'tinao': [55.4000, 37.2000],
        'nao': [55.5500, 37.3500],
        };

        const seed = shelterId || Math.random();
        const districts = Object.keys(districtCoordinates);
        const districtKey = districts[seed % districts.length];
        const baseCoords = districtCoordinates[districtKey];
        
        const lat = baseCoords[0] + (Math.random() - 0.5) * 0.05;
        const lng = baseCoords[1] + (Math.random() - 0.5) * 0.05;
        
        return [lat, lng];
    };

    // Фильтрация приютов по поисковому запросу
    const filteredShelters = shelters.filter(shelter =>
        searchQuery.trim() === "" ||
        shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (shelter.address && shelter.address.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Подсветка приютов, соответствующих поиску
    const isShelterHighlighted = (shelterId) => {
        return highlightedShelters.includes(shelterId) || 
            (searchQuery && filteredShelters.some(s => s.id === shelterId));
    };

    return (
        <div className="w-full h-full relative" style={{ zIndex: 1 }}>
        {/* Информация о результатах поиска */}
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
            style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative',
            zIndex: 1
            }}
            className="rounded-custom leaflet-container-custom"
            zoomControl={true}
        >
            <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {shelters.map((shelter) => {
            const coordinates = getCoordinatesByShelterId(shelter.id);
            const isHighlighted = isShelterHighlighted(shelter.id);
            const isVisible = filteredShelters.some(s => s.id === shelter.id) || searchQuery === "";

            if (!isVisible) return null;

            return (
                <Marker 
                key={shelter.id} 
                position={coordinates}
                icon={createCustomIcon(isHighlighted)}
                eventHandlers={{
                    click: () => {
                    if (onShelterClick) {
                        onShelterClick(shelter);
                    }
                    }
                }}
                >
                <Popup>
                    <div className="p-3  min-w-[250px]">
                    <h3 className={`font-sf-rounded font-bold text-lg mb-2 ${
                        isHighlighted ? 'text-green-40' : 'text-green-30'
                    }`}>
                        {shelter.name}
                        {isHighlighted && (
                        <span className="ml-2 text-xs bg-green-40 text-green-90 px-2 py-1 rounded-full">
                            Найден
                        </span>
                        )}
                    </h3>
                    
                    {shelter.address && (
                        <p className="font-inter text-green-60 text-sm mb-2">
                        <strong>Адрес:</strong> {shelter.address}
                        </p>
                    )}
                    
                    {shelter.phone && (
                        <p className="font-inter text-green-60 text-sm mb-2">
                        <strong>Телефон:</strong> {shelter.phone}
                        </p>
                    )}
                    
                    {shelter.district && (
                        <p className="font-inter text-green-60 text-sm mb-3">
                        <strong>Округ:</strong> {shelter.district}
                        </p>
                    )}
                    
                    <div className="flex gap-2">
                        <button
                        onClick={() => window.location.href = `/приют/${shelter.id}`}
                        className="flex-1 px-3 py-2 bg-green-30 text-green-90 rounded-custom-small text-sm hover:bg-green-40 transition-colors text-center"
                        >
                        Подробнее
                        </button>
                    </div>
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