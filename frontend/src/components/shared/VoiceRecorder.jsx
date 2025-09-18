import React from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

const VoiceRecorder = ({ onRecordingComplete }) => {
  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlob } = useReactMediaRecorder({ 
    audio: true,
    onStop: (blobUrl, blob) => {
      console.log('[VoiceRecorder] onStop blob:', blob);
      if (!blob) return onRecordingComplete(null);
      // Ensure it's a File so FormData has filename + type
      const file = blob instanceof File ? blob : new File([blob], 'voice-note.webm', { type: blob.type || 'audio/webm' });
      onRecordingComplete(file);
    }
  });

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 space-y-3 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <p className="text-sm font-medium dark:text-gray-300">Status: <span className="font-bold text-primary dark:text-primary-400">{status}</span></p>
        <div className="flex space-x-2">
          {status !== 'recording' ? (
            <button 
              type="button" 
              onClick={startRecording} 
              className="px-3 py-1.5 sm:py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md shadow-sm transition-colors"
              aria-label="Start recording"
            >
              Start
            </button>
          ) : (
            <button 
              type="button" 
              onClick={stopRecording} 
              className="px-3 py-1.5 sm:py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md shadow-sm transition-colors"
              aria-label="Stop recording"
            >
              Stop
            </button>
          )}
          <button 
            type="button" 
            onClick={clearBlob} 
            disabled={!mediaBlobUrl} 
            className="px-3 py-1.5 sm:py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md shadow-sm disabled:opacity-50 transition-colors"
            aria-label="Reset recording"
          >
            Reset
          </button>
        </div>
      </div>
      {mediaBlobUrl && <audio src={mediaBlobUrl} controls className="w-full h-10 mt-2" />}
    </div>
  );
};
export default VoiceRecorder;
