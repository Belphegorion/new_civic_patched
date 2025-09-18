import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ImageUpload = ({ onFileSelect }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError('');
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB.');
        return;
      }
      
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.onerror = () => setError('Error reading file.');
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError('');
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div className="p-4 sm:p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
          <input 
            type="file" 
            accept="image/*,capture=camera" 
            onChange={handleFileChange} 
            className="hidden" 
            id="image-upload" 
          />
          <label htmlFor="image-upload" className="cursor-pointer block w-full">
            <PhotoIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload from Gallery</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
          </label>
        </div>
      ) : (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full h-40 sm:h-48 object-cover rounded-lg shadow-sm" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-sm"
            aria-label="Remove image"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">{error}</p>
      )}
    </div>
  );
};
export default ImageUpload;