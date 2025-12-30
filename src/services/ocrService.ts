import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

/**
 * Extract text from an image using Tesseract.js OCR
 * Supports multiple languages for menu recognition
 */
export async function extractTextFromImage(
  imageData: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  try {
    // Use multiple languages for better menu recognition
    // nld = Dutch, eng = English, deu = German, fra = French
    const result = await Tesseract.recognize(
      imageData,
      'nld+eng+deu+fra',
      {
        logger: (m) => {
          if (onProgress && m.status) {
            onProgress({
              status: m.status,
              progress: m.progress || 0
            });
          }
        }
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Kon tekst niet uit afbeelding extraheren');
  }
}

/**
 * Extract text from multiple images and combine results
 */
export async function extractTextFromMultipleImages(
  images: string[],
  onProgress?: (current: number, total: number, progress: OCRProgress) => void
): Promise<OCRResult> {
  const results: OCRResult[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const result = await extractTextFromImage(
      images[i],
      (progress) => onProgress?.(i + 1, images.length, progress)
    );
    results.push(result);
  }

  // Combine all text with page separators
  const combinedText = results.map((r, i) => `--- Pagina ${i + 1} ---\n${r.text}`).join('\n\n');
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  return {
    text: combinedText,
    confidence: averageConfidence
  };
}

/**
 * Parse base64 image data from JSON format used in the app
 */
export function parseImageData(item: string): { data: string; type: string } {
  try {
    const parsed = JSON.parse(item);
    return {
      data: parsed.data,
      type: parsed.type || 'image'
    };
  } catch {
    return {
      data: item,
      type: 'image'
    };
  }
}
