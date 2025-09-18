// backend/services/aiService.js

const axios = require('axios');

const HUGGING_FACE_API_URL = process.env.BACKEND_HUGGING_FACE_MODEL_URL;
const HUGGING_FACE_TOKEN = process.env.BACKEND_HUGGING_FACE_TOKEN;


const labelToCategoryMap = {
    'pothole': 'Pothole', 'road': 'Pothole', 'asphalt': 'Pothole', 'crack': 'Pothole',
    'graffiti': 'Graffiti', 'street art': 'Graffiti',
    'trash': 'Trash Overflow', 'garbage': 'Trash Overflow', 'waste': 'Trash Overflow',
    'streetlight': 'Streetlight Out', 'lamp post': 'Streetlight Out',
};

const mapLabelsToCategory = (labels) => {
    for (const label of labels) {
        const primaryLabel = label.toLowerCase().split(',')[0].trim();
        if (labelToCategoryMap[primaryLabel]) {
            if (labelToCategoryMap[primaryLabel] === 'Pothole') {
                if (labels.some(l => l.includes('hole') || l.includes('crack'))) {
                    return 'Pothole';
                }
            } else {
                return labelToCategoryMap[primaryLabel];
            }
        }
    }
    return null;
};

const analyzeImage = async (imageUrl) => {
    try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const apiResponse = await axios.post(
            HUGGING_FACE_API_URL,
            imageResponse.data,
            { headers: { 'Authorization': `Bearer ${HUGGING_FACE_TOKEN}` } }
        );

        if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
            console.warn("Hugging Face API returned a non-array response:", apiResponse.data);
            return { tags: [], determinedCategory: null };
        }

        const allTags = apiResponse.data.map(prediction => prediction.label);
        const determinedCategory = mapLabelsToCategory(allTags);
        return { tags: allTags, determinedCategory };

    } catch (error) {
        console.error('Hugging Face API Error:', error.response ? error.response.data : error.message);
        throw new Error('Failed to analyze image with Hugging Face.');
    }
};

module.exports = { analyzeImage };