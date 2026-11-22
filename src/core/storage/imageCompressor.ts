/**
 * Compresses any uploaded or Ctrl+V pasted image Blob/File into a lightweight .webp Data URL
 * via an offscreen <canvas> before persisting to IndexedDB.
 */
export async function compressImageToWebpDataUrl(
  file: Blob,
  maxWidth = 960,
  quality = 0.78
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Falha ao decodificar imagem.'));
      element.src = objectUrl;
    });

    const scale = img.width > maxWidth ? maxWidth / img.width : 1;
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Contexto Canvas 2D indisponível.');
    }

    ctx.drawImage(img, 0, 0, width, height);

    const webpUrl = canvas.toDataURL('image/webp', quality);
    if (webpUrl.startsWith('data:image/webp')) {
      return webpUrl;
    }

    // Fallback to JPEG if browser lacks WebP canvas encoder
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
