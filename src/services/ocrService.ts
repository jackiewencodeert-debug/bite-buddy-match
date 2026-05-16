import { Capacitor } from '@capacitor/core';
import { TextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';
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
 * Extract text from an image.
 *
 * - Native platforms (iOS/Android): on-device ML Kit text recognition. Free,
 *   fast (~200ms typical), no network. Accuracy in Latin scripts is
 *   significantly higher than Tesseract for menu fonts.
 * - Web: Tesseract.js fallback. Slower (~5-15s) but works offline in browser.
 *
 * imageData accepts a data URL (data:image/jpeg;base64,...). On native the
 * plugin needs raw base64, so we strip the prefix.
 */
export async function extractTextFromImage(
  imageData: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  // Native ML Kit path — used on iOS + Android
  if (Capacitor.isNativePlatform()) {
    try {
      onProgress?.({ status: 'recognizing', progress: 0.5 });
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      const result = await TextRecognition.detectText({ base64 });
      onProgress?.({ status: 'done', progress: 1 });
      // ML Kit returns blocks; join into single string preserving line order.
      const text = (result.blocks ?? []).map((b: any) => b.text).join('\n');
      return { text, confidence: 1 };
    } catch (err) {
      console.warn('Native ML Kit OCR failed, falling back to Tesseract:', err);
      // fall through
    }
  }

  // Web / fallback path — Tesseract.js
  try {
    // Multilingual model — nld primary, plus eng/deu/fra for border-region menus
    const result = await Tesseract.recognize(imageData, 'nld+eng+deu+fra', {
      logger: (m) => {
        if (onProgress && m.status) {
          onProgress({
            status: m.status,
            progress: m.progress || 0
          });
        }
      }
    });

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
