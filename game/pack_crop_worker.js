// Encoding sprite crops off the main thread keeps the VS screen responsive.
self.onmessage = async ({ data: { bitmap, crops, quality, dataURLs } }) => {
  try {
    const result = [];
    const reader = dataURLs ? new FileReaderSync() : null;
    for (const [x, y, width, height] of crops) {
      const canvas = new OffscreenCanvas(width, height);
      canvas.getContext('2d').drawImage(bitmap, x, y, width, height, 0, 0, width, height);
      const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
      result.push(reader ? reader.readAsDataURL(blob) : blob);
    }
    self.postMessage(result);
  } catch (_) {
    self.postMessage(null);
  } finally {
    bitmap.close();
  }
};
