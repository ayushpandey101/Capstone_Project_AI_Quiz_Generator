/**
 * Advanced Image Compression Utility
 * Compresses images while maintaining quality for end users
 * Uses canvas-based compression with intelligent quality selection
 */

export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,           // Max width for large images
    maxHeight = 1080,          // Max height for large images
    quality = 0.85,            // JPEG quality (0-1)
    maxSizeKB = 500,           // Target max size in KB
    format = 'image/jpeg',     // Output format
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels to meet size target
          let currentQuality = quality;
          let compressedDataUrl = canvas.toDataURL(format, currentQuality);
          
          // Calculate size in KB
          const getSize = (dataUrl) => {
            const base64Length = dataUrl.split(',')[1].length;
            return (base64Length * 3) / 4 / 1024; // Convert to KB
          };
          
          let attempts = 0;
          const maxAttempts = 5;
          
          // Iteratively reduce quality if size is too large
          while (getSize(compressedDataUrl) > maxSizeKB && attempts < maxAttempts && currentQuality > 0.5) {
            currentQuality -= 0.1;
            compressedDataUrl = canvas.toDataURL(format, currentQuality);
            attempts++;
          }
          
          const finalSizeKB = getSize(compressedDataUrl);

          resolve(compressedDataUrl);
        } catch (error) {
          reject(new Error('Failed to compress image: ' + error.message));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export const compressImageAdaptive = async (file, usage = 'question') => {
  // Different compression profiles for different use cases
  const profiles = {
    question: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      maxSizeKB: 400,
      format: 'image/jpeg',
    },
    option: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.82,
      maxSizeKB: 250,
      format: 'image/jpeg',
    },
    profile: {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.88,
      maxSizeKB: 200,
      format: 'image/jpeg',
    },
  };
  
  const profile = profiles[usage] || profiles.question;
  
  // For PNG images with transparency, keep as PNG
  if (file.type === 'image/png') {
    profile.format = 'image/png';
    profile.quality = 0.9;
  }
  
  return compressImage(file, profile);
};

export const validateImageFile = (file, maxSizeMB = 10) => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' 
    };
  }
  
  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { 
      valid: false, 
      error: `File size exceeds ${maxSizeMB}MB. Please choose a smaller image.` 
    };
  }
  
  return { valid: true, error: null };
};

export const compressImagesInBatch = async (files, usage = 'question') => {
  const compressionPromises = files.map(file => compressImageAdaptive(file, usage));
  return Promise.all(compressionPromises);
};

export const getImageDimensions = (base64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = base64;
  });
};
