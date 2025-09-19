// src/components/citizen/ReportForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useReports } from '../../contexts/ReportsContext.jsx';
import Modal from '../shared/Modal.jsx';
import ImageUpload from '../shared/ImageUpload.jsx';
import LocationPicker from '../shared/Map/LocationPicker.jsx';
import VoiceRecorder from '../shared/VoiceRecorder.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';
import { MapPinIcon, CameraIcon } from '@heroicons/react/24/outline';

/**
 * ReportForm
 * - Uses presigned S3 PUT URLs: POST /api/uploads/presign -> PUT to S3 -> POST /api/uploads/confirm
 * - Requires backend endpoints described earlier (presign + confirm), and JWT token in localStorage
 */
const ReportForm = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [photo, setPhoto] = useState(null); // File from ImageUpload or camera capture
  const [audio, setAudio] = useState(null); // optional File or Blob from VoiceRecorder
  const [location, setLocation] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { fetchReports } = useReports(); // we'll refresh after successful create
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setIsClient(true);
    getCurrentLocation();
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (err) => {
        setError('Unable to get your location. Please select manually.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Unable to access camera. Please upload an image instead.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Could not capture photo.');
          return;
        }
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhoto(file);
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Helper: call backend to get presigned PUT URL for a file
  async function getPresign(file) {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/uploads/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.message || `Presign request failed: ${res.status}`);
    }
    return res.json();
  }

  // Helper: upload to S3 using presigned PUT url (with progress)
  async function uploadToS3(uploadUrl, file, onProgress) {
    // Use XHR to get progress events (fetch doesn't support progress in browsers yet)
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.send(file);
    });
  }

  // Main submit flow: presign -> upload -> confirm
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !description || !location || !photo) {
      setError('Please fill all required fields, select a location, & upload an image.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload photo
      const photoPresign = await getPresign(photo);
      // photoPresign: { uploadUrl, key, publicUrl, expiresIn }
      await uploadToS3(photoPresign.uploadUrl, photo, (p) => setUploadProgress(p * 0.6)); // photo takes 60% of progress

      // If audio exists, upload audio too
      let audioKey = null;
      if (audio) {
        // If audio is a Blob but not File, convert
        const audioFile = audio instanceof File ? audio : new File([audio], `voice-${Date.now()}.webm`, { type: audio.type || 'audio/webm' });
        const audioPresign = await getPresign(audioFile);
        await uploadToS3(audioPresign.uploadUrl, audioFile, (p) => setUploadProgress(60 + Math.round(p * 0.4))); // audio covers last 40%
        audioKey = audioPresign.key;
      } else {
        setUploadProgress(60);
      }

      // Confirm upload: tell backend to verify object(s) in S3 and create the report
      const token = localStorage.getItem('token') || '';
      const confirmBody = {
        key: photoPresign.key,
        reportData: {
          title,
          description,
          category,
          latitude: location.lat,
          longitude: location.lng,
          audioKey // optional
        }
      };

      const confirmRes = await fetch('/api/uploads/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(confirmBody)
      });

      if (!confirmRes.ok) {
        const json = await confirmRes.json().catch(() => ({}));
        throw new Error(json.message || `Confirm failed: ${confirmRes.status}`);
      }

      // Success: refresh reports in context and close
      try { await fetchReports(); } catch(_) { /* ignore if context not wired */ }
      setUploadProgress(100);
      onClose();
    } catch (err) {
      console.error('Report submit error:', err);
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit a New Report" size="fullscreen">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</p>}

        <div>
          <label className="block text-sm font-medium dark:text-gray-300">Title*</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary text-base py-2.5 sm:py-2 px-3 shadow-sm"
            placeholder="Brief title of the issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-300">Category*</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary text-base py-2.5 sm:py-2 px-3 shadow-sm appearance-none bg-no-repeat bg-right pr-8"
            style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
          >
            <option>Pothole</option>
            <option>Streetlight Out</option>
            <option>Trash Overflow</option>
            <option>Graffiti</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-300">Description*</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="3"
            className="mt-1 w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-primary focus:border-primary text-base py-2.5 sm:py-2 px-3 shadow-sm resize-y"
            placeholder="Describe the issue in detail"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">Photo*</label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm w-full sm:w-auto"
              >
                <CameraIcon className="h-5 w-5" />
                <span>Take Photo</span>
              </button>
              <span className="text-gray-500 dark:text-gray-400 self-center hidden sm:inline">or</span>
              <div className="w-full sm:w-auto">
                <ImageUpload onFileSelect={setPhoto} />
              </div>
            </div>

            {showCamera && (
              <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-48 sm:h-64 object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-white text-gray-900 px-4 py-2.5 sm:py-2 rounded-full hover:bg-gray-100 transition-colors shadow-md text-sm font-medium"
                    aria-label="Capture photo"
                  >
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="bg-red-600 text-white px-4 py-2.5 sm:py-2 rounded-full hover:bg-red-700 transition-colors shadow-md text-sm font-medium"
                    aria-label="Cancel camera"
                  >
                    Cancel
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {photo && (
              <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Photo selected: {photo.name}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">Voice Note (Optional)</label>
          <VoiceRecorder onRecordingComplete={setAudio} />
          {audio && (
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Voice note recorded</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 dark:text-gray-300">Location*</label>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm w-full sm:w-auto text-sm font-medium"
                aria-label="Use current location"
              >
                <MapPinIcon className="h-5 w-5" />
                <span>{locationLoading ? 'Getting Location...' : 'Use Current Location'}</span>
              </button>
              {location && (
                <span className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg flex-grow sm:flex-grow-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
            </div>
            <div className="h-60 sm:h-72 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-sm">
              {isClient ? (
                <LocationPicker
                  onLocationChange={setLocation}
                  initialLocation={location}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <LoadingSpinner size="sm" />
                  <p className="ml-2 text-gray-600 dark:text-gray-400">Loading map...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload progress bar */}
        {submitting && (
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-2 bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">{uploadProgress}%</div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-6 gap-3 sticky bottom-0 bg-white dark:bg-gray-900 pb-4 border-t border-gray-100 dark:border-gray-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 sm:py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto text-sm font-medium"
            aria-label="Cancel report submission"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-3 sm:py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium"
            aria-label="Submit report"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="xs" text="" />
                <span>Submitting...</span>
              </>
            ) : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportForm;
