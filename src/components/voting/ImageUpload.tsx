import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  currentImageUrl: string;
  onImageUploaded: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImageUrl, onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('candidate-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('candidate-images')
        .getPublicUrl(filePath);

      onImageUploaded(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setPreview(currentImageUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Candidate Photo</label>
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Candidate&background=1e40af&color=fbbf24';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Choose Image'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG or GIF. Max 5MB.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
