    import api from './api';

    export const geocodingService = {
    async getCoordinates(address) {
        try {
        const response = await api.get('/geocoding/coordinates', {
            params: { address }
        });
        
        if (response.data && response.data.lat && response.data.lng) {
            return {
            lat: response.data.lat,
            lng: response.data.lng
            };
        }
        return null;
        } catch (error) {
        console.error('Geocoding error:', error);
        return null;
        }
    }
    };