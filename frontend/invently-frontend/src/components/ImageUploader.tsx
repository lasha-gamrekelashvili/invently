import React, { useState, useCallback } from 'react';
import { PhotoIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  images: any[];
  onImageUpload: (files: FileList, altText?: string) => Promise<void>;
  onImageAddByUrl: (url: string, altText?: string) => Promise<void>;
  onImageRemove: (imageId: string) => Promise<void>;
  isUploading?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImageUpload,
  onImageAddByUrl,
  onImageRemove,
  isUploading = false
}) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [altTextInput, setAltTextInput] = useState('');
  const [fileAltTextInput, setFileAltTextInput] = useState('');
  const [isAddingByUrl, setIsAddingByUrl] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      await onImageUpload(files, fileAltTextInput.trim() || undefined);
      setFileAltTextInput(''); // Clear the alt text input after upload
      // Reset the file input so the same file can be selected again
      e.target.value = '';
    } catch (error) {
      console.error('File upload failed:', error);
    }
  }, [onImageUpload, fileAltTextInput]);

  const handleAddByUrl = useCallback(async () => {
    if (!urlInput.trim()) return;

    setIsAddingByUrl(true);
    try {
      await onImageAddByUrl(urlInput.trim(), altTextInput.trim() || undefined);
      setUrlInput('');
      setAltTextInput('');
    } catch (error) {
      console.error('Failed to add image by URL:', error);
    } finally {
      setIsAddingByUrl(false);
    }
  }, [urlInput, altTextInput, onImageAddByUrl]);

  const handleRemoveImage = useCallback(async (imageId: string) => {
    try {
      await onImageRemove(imageId);
    } catch (error) {
      console.error('Failed to remove image:', error);
    }
  }, [onImageRemove]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Product Images
      </label>
      
      {/* Upload Method Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setUploadMethod('file')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            uploadMethod === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PhotoIcon className="w-4 h-4 inline mr-2" />
          Upload Files
        </button>
        <button
          type="button"
          onClick={() => setUploadMethod('url')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            uploadMethod === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          Add by URL
        </button>
      </div>

      {/* File Upload Method */}
      {uploadMethod === 'file' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="file-alt-text" className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (optional)
            </label>
            <input
              id="file-alt-text"
              type="text"
              value={fileAltTextInput}
              onChange={(e) => setFileAltTextInput(e.target.value)}
              placeholder="Describe the images for accessibility"
              className="input-field"
              disabled={isUploading}
            />
          </div>
          <div>
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="image-upload"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Images'}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Upload JPEG, PNG, GIF, or WebP images (max 5MB each)
            </p>
          </div>
        </div>
      )}

      {/* URL Input Method */}
      {uploadMethod === 'url' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              id="image-url"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddByUrl();
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="input-field"
              required
              disabled={isAddingByUrl}
            />
          </div>
          <div>
            <label htmlFor="image-alt-text" className="block text-sm font-medium text-gray-700 mb-1">
              Alt Text (optional)
            </label>
            <input
              id="image-alt-text"
              type="text"
              value={altTextInput}
              onChange={(e) => setAltTextInput(e.target.value)}
              placeholder="Describe the image for accessibility"
              className="input-field"
              disabled={isAddingByUrl}
            />
          </div>
          <button
            type="button"
            onClick={handleAddByUrl}
            disabled={!urlInput.trim() || isAddingByUrl}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            {isAddingByUrl ? 'Adding...' : 'Add Image'}
          </button>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Current Images ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.altText || 'Product image'}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                {image.altText && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                    {image.altText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
