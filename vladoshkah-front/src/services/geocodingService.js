    import api from './api';

    export const geocodingService = {
    async getCoordinates(address) {
        try {
        console.log(`🔍 Геокодирование адреса: "${address}"`);
        const response = await api.get('/geocoding/coordinates', {
            params: { address }
        });
        
        // Если ответ null (нет результатов), это нормально
        if (response.data === null) {
            console.warn(`⚠ Геокодирование не вернуло координаты для адреса: "${address}"`);
            return null;
        }
        
        if (response.data && response.data.lat && response.data.lng) {
            const result = {
            lat: response.data.lat,
            lng: response.data.lng
            };
            console.log(`✅ Координаты получены:`, result);
            return result;
        }
        
        console.warn(`⚠ Геокодирование вернуло неполные данные для адреса: "${address}"`, response.data);
        return null;
        } catch (error) {
        // Обрабатываем разные типы ошибок
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 429) {
                console.warn(`⚠ Превышен лимит запросов к геокодированию для адреса: "${address}"`);
            } else if (status === 504) {
                console.warn(`⚠ Таймаут геокодирования для адреса: "${address}"`);
            } else {
                console.error(`✗ Ошибка геокодирования (${status}) для адреса "${address}":`, errorData);
            }
        } else {
            console.error(`✗ Ошибка сети при геокодировании для адреса "${address}":`, error.message);
        }
        
        return null;
        }
    }
    };