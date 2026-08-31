/**
 * Storage helpers for resilient client-side caching & Image compression
 */

export const safeGetLocalStorage = (key: string, defaultValue: string = ''): string => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    }
  } catch (e) {
    console.warn(`LocalStorage read error for key "${key}":`, e);
  }
  return defaultValue;
};

export const safeSetLocalStorage = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`LocalStorage write error for key "${key}":`, e);
  }
};

export const safeRemoveLocalStorage = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`LocalStorage remove error for key "${key}":`, e);
  }
};

export interface CompressedImageResult {
  dataUrl: string;
  sizeKb: string;
  dimensions: string;
}

export const compressImage = (
  source: File | string,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<CompressedImageResult> => {
  return new Promise((resolve) => {
    const processDataUrl = (dataUrl: string) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          const sizeKb = (Math.round((compressed.length * 3) / 4 / 1024)).toString();
          resolve({
            dataUrl: compressed,
            sizeKb,
            dimensions: `${width}×${height}px`,
          });
        } else {
          resolve({
            dataUrl,
            sizeKb: '0',
            dimensions: `${width}×${height}px`,
          });
        }
      };
      img.onerror = () => {
        resolve({
          dataUrl,
          sizeKb: '0',
          dimensions: 'unknown',
        });
      };
    };

    if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        processDataUrl(result);
      };
      reader.readAsDataURL(source);
    }
  });
};
