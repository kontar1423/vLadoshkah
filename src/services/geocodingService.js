    import api from './api';

    export const geocodingService = {
    async getCoordinates(address) {
        try {
        // Используем Nominatim (бесплатный сервис OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
            };
        }
        return null;
        } catch (error) {
        console.error('Geocoding error:', error);
        return null;
        }
    }
    };