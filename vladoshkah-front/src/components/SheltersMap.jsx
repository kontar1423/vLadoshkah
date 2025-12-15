import React, { useState, useEffect, useRef } from 'react';
import { YMaps, Map, Placemark, ZoomControl } from '@pbe/react-yandex-maps';
import { geocodingService } from '../services/geocodingService';

const YANDEX_MAP_KEY = import.meta.env.VITE_YANDEX_MAP_KEY || '';
const LAPA_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACoAAAAoCAYAAACIC2hQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAPuSURBVHgBxVlNUhNBFP66J5ZVikVc4M5y3AGhynACYecuIRwAbwA5AeEExpVL4gEk4QTgSneEIog7hq0uDGWVZWHS7eueMCTz1z0kkK8KJsm87v6mu9/3Xr9hyIKymwd7VANzSoB06ZcuXVsQ/R20vnuxbdYXyhDOJhiK9C0PiTa4rOPT6UdkALO2LM+74M4BNXFj7nbB5FZk8MrSNv2vxfYncQiZW0Or3YUFOGyRTFKBZorVUS7mg18qi2+RRFKBYQW8twXb4a2s9KDMNVjlRwdm2zBjc+ThUmBHVPKinZ307fTgzLVoQXZXNna2Sy+tnprIzfrXv5b2msIEZ5SRp1rZSU9ffQWwchKg59lY2REVDxpWdpyk6hoSZvmRsp0oayHcyJPSSGdmI9hnYBcQvUbQUaVAjsLeJQ+K92h2bpxJ7VP+7yhlr3ap/+Wg//LSCpgog9H2kfKS/KKFVudwlGh5sQjOmgmd1rDX2fHJLtWI0UbELkwyIEvay3K7WopGG3gQkjT0WzvZRts1aDWrSmuZQcivG1Sxd1r3B6eZxxPSQPhOIH7Tk3vp+1FPhOOvlCCSQzOFtcIRzWKyqqjA0OysMjJskOEG0kHLlHtpG0WsofWZ7xrtBFY5TflrmJFH7srGLiN4ycqM1p1bCrN6qqeYNCTs9JbL2Rx8vTM34PiVel/v3RnllK7+Ht6LsZAXVnmRYJecpGAfNuiJ48R7KkviM+f0MOSUclf/qc+VwjnWC8n73zaQOOJg4PU50rvUWd0hiapFftXS4jRTvdZnVMfeSTX2lnoYMDexqQoKzdNlrgVXiFWtbbGGpJFJJJWsGUnqTraIULx3i37a2JSz9tfURzYysJMrkdOUBz0ch6PDCEz6F4+b4BGGL1Ul7WAqZxB8H62TICTbZ/gjnaZk7iaQJpqdLIrsRHWU4Ue4NdRsPVjOGjzsjyJBC5UTjAPmZjmCBMNmstZLTgONj229MhmQ4RQ67pKHkW0L2M2olqJxlzwMpraAOSEZwDFaWKWBt8Y8FuZcnP00Rsd0oip+84df7ojkAKTFC8+Asx+f06ySieryzWMVeeZx91gxkU0muvj8A7naG9wfiOzcJW2Dr3E3471+nMgzLhIiV9TrlfNMi6QCQ2wpKEqU5TJHjYlCnUbV0TmEOB19hWmDy0jUiplR5mLqYJEkPmZG5WSPxLdClEOUqESq8N4LBIucpWKI9uqYKuJPr1Giumglq5gOuv4ZKorkNE8XxGBT3u7SdvHgv3DwhrrODwoM+cEbEQOGCmeZiCpcH/iGS5H+lTrtU4d/PGOBLOhLJcpUXdYFCv3qR5F7oUuMzGmbim3/ATjzZu2mO2oJAAAAAElFTkSuQmCC';

const escapeHtml = (unsafe = '') =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildBalloonContent = (shelter, isHighlighted) => {
  const link = `/shelter/${shelter.id}`;
  const address = shelter.address ? `<p><strong>Адрес:</strong> ${escapeHtml(shelter.address)}</p>` : '';
  const phone = shelter.phone ? `<p><strong>Телефон:</strong> ${escapeHtml(shelter.phone)}</p>` : '';
  const district = shelter.district ? `<p><strong>Округ:</strong> ${escapeHtml(shelter.district)}</p>` : '';

  return `
    <div class="yamap-balloon-card ${isHighlighted ? 'yamap-balloon-card--highlighted' : ''}">
      <button class="yamap-balloon-card__close" aria-label="Закрыть" onclick="window.YaMapBalloonClose && window.YaMapBalloonClose(event)"></button>
      <h3 class="yamap-balloon-card__title">${escapeHtml(shelter.name || 'Приют')}</h3>
      <div class="yamap-balloon-card__body">
        ${address}
        ${phone}
        ${district}
      </div>
      <a class="yamap-balloon-card__cta" href="${link}">Подробнее</a>
    </div>
  `;
};

const buildMarkerIcon = (size, isHighlighted) => {
  const bg = '#ffffff';
  const border = isHighlighted ? '#0c6f3a' : '#006C35';
  const padding = size * 0.18;
  const innerSize = size - padding * 2;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect x="2" y="2" rx="${size * 0.18}" ry="${size * 0.18}" width="${size - 4}" height="${size - 4}" fill="${bg}" stroke="${border}" stroke-width="3" />
      <image href="data:image/png;base64,${LAPA_ICON_BASE64}" x="${padding}" y="${padding}" height="${innerSize}" width="${innerSize}" preserveAspectRatio="xMidYMid meet" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const getPlacemarkOptions = (isHighlighted = false) => {
  const size = isHighlighted ? 50 : 35;
  const balloonOffset = [-1.0, -size * 1.15]; // slightly left and above the button
  return {
    iconLayout: 'default#image',
    iconImageHref: buildMarkerIcon(size, isHighlighted),
    iconImageSize: [size, size],
    iconImageOffset: [-size / 2, -size],
    hideIconOnBalloonOpen: false,
    balloonPanelMaxMapArea: 0,
    balloonOffset,
    balloonCloseButton: false,
    zIndex: isHighlighted ? 200 : 100
  };
};

const SheltersMap = ({ 
  shelters, 
  searchQuery = "",
  highlightedShelters = [] 
}) => {
  const center = [55.7558, 37.6173];
  const [sheltersWithCoords, setSheltersWithCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const activePlacemarkRef = useRef(null);

  useEffect(() => {
    window.YaMapBalloonClose = () => {
      try {
        activePlacemarkRef.current?.balloon?.close();
      } catch (e) {
        console.warn('Не удалось закрыть балун', e);
      }
    };
    return () => {
      delete window.YaMapBalloonClose;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCoordinatesIncremental = async () => {
      setLoading(true);
      setSheltersWithCoords([]);

      for (const shelter of shelters) {
        if (!isMounted) break;

        let coordinates = null;

        if (shelter.address) {
          try {
            let normalizedAddress = shelter.address.trim();
            normalizedAddress = normalizedAddress.replace(/,\s*Москва\s*,?\s*Москва\s*$/i, ', Москва');
            normalizedAddress = normalizedAddress.replace(/,\s*Москва\s*$/i, ', Москва');
            if (!normalizedAddress.toLowerCase().includes('москва')) {
              normalizedAddress = `${normalizedAddress}, Москва`;
            }

            const geocodeResult = await geocodingService.getCoordinates(normalizedAddress);
            if (geocodeResult && geocodeResult.lat && geocodeResult.lng) {
              coordinates = [geocodeResult.lat, geocodeResult.lng];
              console.log(`✓ Геокодирование успешно для приюта "${shelter.name}":`, coordinates);
            } else if (!shelter.districtId) {
              console.warn(`⚠ Геокодирование вернуло null для приюта "${shelter.name}" с адресом "${shelter.address}"`);
            }
          } catch (error) {
            console.error(`✗ Ошибка геокодирования для приюта "${shelter.name}":`, error);
          }
        } else {
          console.warn(`⚠ У приюта "${shelter.name}" нет адреса`);
        }

        if (!coordinates && shelter.districtId) {
          coordinates = getCoordinatesByDistrict(shelter.districtId);
          console.log(`📍 Использованы координаты округа для приюта "${shelter.name}":`, coordinates);
        }

        if (!coordinates) {
          coordinates = getFallbackCoordinates(shelter.id);
          console.log(`📍 Использованы fallback координаты для приюта "${shelter.name}":`, coordinates);
        }

        const withCoords = { ...shelter, coordinates };
        if (isMounted) {
          setSheltersWithCoords((prev) => [...prev, withCoords]);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    if (shelters && shelters.length > 0) {
      loadCoordinatesIncremental();
    } else {
      setSheltersWithCoords([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
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

  return (
    <div className="w-full h-full relative" style={{ zIndex: 1 }}>
      {loading && (
        <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 pointer-events-none bg-green-90/80 border border-green-40 rounded-custom-small px-3 py-2 shadow-md">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-40"></div>
          <p className="font-inter text-green-40 text-sm">Загрузка приютов...</p>
        </div>
      )}
      {searchQuery && (
        <div className="absolute top-4 left-4 z-[1000] bg-green-90 border-2 border-green-40 rounded-custom-small px-4 py-2 shadow-lg">
            <span className="font-inter text-green-30 text-sm">
                Найдено приютов: <strong>{filteredShelters.length}</strong>
                {searchQuery && ` по запросу "${searchQuery}"`}
          </span>
        </div>
      )}

      <YMaps query={{ apikey: YANDEX_MAP_KEY, lang: 'ru_RU' }}>
        <Map 
          defaultState={{ center, zoom: 10, controls: [] }}
          style={{ width: '100%', height: '100%' }}
          className="rounded-custom yamap-container"
          modules={['control.ZoomControl', 'control.TypeSelector']}
        >
          <ZoomControl options={{ position: { right: 16, top: 16 } }} />

          {sheltersWithCoords.map((shelter) => {
            const isHighlighted = isShelterHighlighted(shelter.id);
            const isVisible = filteredShelters.some(s => s.id === shelter.id) || searchQuery === "";

            if (!isVisible || !shelter.coordinates || !Array.isArray(shelter.coordinates) || shelter.coordinates.length !== 2) {
              if (!shelter.coordinates) {
                console.warn(`⚠ Приют "${shelter.name}" (ID: ${shelter.id}) не имеет координат`);
              }
              return null;
            }

          return (
            (() => { let placemarkRef = null; return (
            <Placemark
              key={shelter.id}
              geometry={shelter.coordinates}
              options={getPlacemarkOptions(isHighlighted)}
              properties={{
                balloonContent: buildBalloonContent(shelter, isHighlighted),
                hintContent: escapeHtml(shelter.name)
              }}
              modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
              instanceRef={(ref) => { placemarkRef = ref; }}
              onBalloonOpen={() => {
                activePlacemarkRef.current = placemarkRef;
              }}
            />
            );})()
          );
        })}
        </Map>
      </YMaps>
    </div>
  );
};

export default SheltersMap;
