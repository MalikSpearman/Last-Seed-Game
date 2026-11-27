// Build the tiny alpha mask away from the render loop. Sprite sheets are shared by many poses.
const canvas = new OffscreenCanvas(4, 4);
const mask = canvas.getContext('2d', { willReadFrequently: true });
const sheets = new Map();

function getSheet(src) {
  let sheet = sheets.get(src);
  if (sheet) {
    sheets.delete(src);
  } else {
    sheet = fetch(src).then(response => {
      if (!response.ok) throw new Error('Sprite unavailable');
      return response.blob();
    }).then(blob => createImageBitmap(blob));
    sheet.catch(() => { if (sheets.get(src) === sheet) sheets.delete(src); });
  }
  sheets.set(src, sheet);
  if (sheets.size > 4) {
    const [oldSrc, oldSheet] = sheets.entries().next().value;
    sheets.delete(oldSrc);
    oldSheet.then(bitmap => bitmap.close(), () => {});
  }
  return sheet;
}

self.onmessage = async ({ data: { id, src, crop, width, height } }) => {
  try {
    const sheet = await getSheet(src);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    } else mask.clearRect(0, 0, width, height);
    if (crop) mask.drawImage(sheet, ...crop, 0, 0, width, height);
    else mask.drawImage(sheet, 0, 0, width, height);
    const bytes = mask.getImageData(0, 0, width, height).data.buffer;
    self.postMessage({ id, bytes }, [bytes]);
  } catch {
    self.postMessage({ id });
  }
};
