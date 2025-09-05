import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let ocrPipeline: any = null;

export interface OCRResult {
  text: string;
  confidence: number;
}

export const initializeOCR = async (): Promise<void> => {
  if (!ocrPipeline) {
    console.log('Initializing OCR pipeline...');
    ocrPipeline = await pipeline(
      'image-to-text',
      'Xenova/trocr-base-printed',
      { device: 'webgpu' }
    );
    console.log('OCR pipeline initialized');
  }
};

export const extractTextFromImage = async (imageElement: HTMLImageElement): Promise<OCRResult> => {
  try {
    if (!ocrPipeline) {
      await initializeOCR();
    }

    // Convert image to canvas and then to base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Resize image if too large
    const maxSize = 1024;
    let { width, height } = imageElement;
    
    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Extract text using OCR
    const result = await ocrPipeline(imageData);
    
    return {
      text: result.generated_text || '',
      confidence: 0.8 // Default confidence score
    };
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from image');
  }
};

export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};