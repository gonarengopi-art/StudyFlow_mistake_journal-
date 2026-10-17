/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';

/**
 * Copy text to clipboard with fallback for iframes and restricted browser contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern async clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback: execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Read image or text directly from clipboard (via navigator.clipboard.read)
 */
export async function readImageFromClipboard(): Promise<{
  file?: File;
  dataUrl?: string;
  text?: string;
  error?: string;
}> {
  if (!navigator?.clipboard) {
    return {
      error: 'Clipboard API is not supported in this browser. Please use Ctrl+V / Cmd+V to paste.',
    };
  }

  // Modern Async Clipboard API - read()
  if (typeof navigator.clipboard.read === 'function') {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        // Look for image type
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `clipboard-image-${Date.now()}.${ext}`, {
            type: imageType,
          });

          // Convert to data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          return { file, dataUrl };
        }
      }

      // If no image, check if there's plain text
      if (navigator.clipboard.readText) {
        try {
          const text = await navigator.clipboard.readText();
          if (text && text.trim().length > 0) {
            return { text };
          }
        } catch {
          // ignore
        }
      }

      return {
        error: 'No image or text found on clipboard. Copy an image or screenshot first, then try again.',
      };
    } catch (err: any) {
      console.warn('navigator.clipboard.read() error:', err);
      // Browser permissions or iframe constraint
      return {
        error:
          'Clipboard read access was blocked by browser permissions. You can paste directly by pressing Ctrl+V (or Cmd+V) anywhere on the page!',
      };
    }
  }

  // If read() is not available, check readText()
  if (typeof navigator.clipboard.readText === 'function') {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        return { text };
      }
      return { error: 'Clipboard is empty.' };
    } catch {
      return {
        error: 'Clipboard access blocked. Please press Ctrl+V to paste.',
      };
    }
  }

  return {
    error: 'Direct clipboard reading is not supported. Please press Ctrl+V / Cmd+V to paste.',
  };
}

/**
 * Read text directly from clipboard
 */
export async function readTextFromClipboard(): Promise<{ text?: string; error?: string }> {
  if (navigator?.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      return { text };
    } catch (err) {
      return {
        error: 'Clipboard access blocked. Please press Ctrl+V to paste text.',
      };
    }
  }
  return { error: 'Clipboard API not supported. Please use Ctrl+V.' };
}

/**
 * Extract image File from a standard ClipboardEvent (e.g. onPaste or window paste)
 */
export function extractImageFromClipboardEvent(
  e: ClipboardEvent | React.ClipboardEvent
): File | null {
  const items = e.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  return null;
}

/**
 * Extract text from a standard ClipboardEvent
 */
export function extractTextFromClipboardEvent(
  e: ClipboardEvent | React.ClipboardEvent
): string | null {
  return e.clipboardData?.getData('text/plain') || null;
}
