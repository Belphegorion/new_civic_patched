const axios = require('axios');

const nominatimApi = axios.create({
    baseURL: 'https://nominatim.openstreetmap.org',
    headers: { 'User-Agent': 'CivicReporting/1.0' }
});

const searchAddress = async (query) => {
    try {
        const response = await nominatimApi.get('/search', {
            params: {
                format: 'json',
                q: query,
                limit: 5,
                addressdetails: 1
            }
        });
        return response.data;
    } catch (error) {
        console.error('Geocoding search error:', error);
        throw new Error('Geocoding service error');
    }
};

const reverseGeocode = async (lat, lon) => {
    try {
        const response = await nominatimApi.get('/reverse', {
            params: { format: 'json', lat, lon }
        });
        return response.data;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw new Error('Reverse geocoding service error');
    }
};

module.exports = { searchAddress, reverseGeocode };