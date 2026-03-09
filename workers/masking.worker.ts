// Masking worker: performs pixel-based segmentation on video frames

interface WorkerMessage {
  id: string;
  type: string;
  payload: {
    imageData: ImageData;
    bgColor: string;
    bgImageData?: ImageData;
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 102, b: 255 };
}

function applyMasking(
  imageData: ImageData,
  bgColor: string,
  bgImageData?: ImageData
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const width = imageData.width;
  const height = imageData.height;
  const bg = hexToRgb(bgColor);

  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const v = max;

    if (diff !== 0) {
      s = diff / max;
      if (max === rn) {
        h = ((gn - bn) / diff) % 6;
      } else if (max === gn) {
        h = (bn - rn) / diff + 2;
      } else {
        h = (rn - gn) / diff + 4;
      }
      h = h * 60;
      if (h < 0) h += 360;
    }

    const isSkin =
      // HSV ranges covering light to dark skin tones across ethnicities:
      // Hue 0–50° (red-orange-yellow), moderate saturation, non-black value
      h >= 0 && h <= 50 && s >= 0.1 && s <= 0.9 && v >= 0.2;

    const isNearWhite = r > 220 && g > 220 && b > 220;
    const isNearBlack = r < 30 && g < 30 && b < 30;
    const isHighSatBlue = h >= 190 && h <= 260 && s > 0.4;
    const isHighSatGreen = h >= 90 && h <= 150 && s > 0.4 && v > 0.3;

    const isForeground = isSkin || (!isNearWhite && !isNearBlack && !isHighSatBlue && !isHighSatGreen);

    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (isForeground) {
      output[i] = r;
      output[i + 1] = g;
      output[i + 2] = b;
      output[i + 3] = 255;
    } else {
      if (bgImageData) {
        const bgIdx = (y * width + x) * 4;
        output[i] = bgImageData.data[bgIdx];
        output[i + 1] = bgImageData.data[bgIdx + 1];
        output[i + 2] = bgImageData.data[bgIdx + 2];
        output[i + 3] = 255;
      } else {
        output[i] = bg.r;
        output[i + 1] = bg.g;
        output[i + 2] = bg.b;
        output[i + 3] = 255;
      }
    }
  }

  return new ImageData(output, width, height);
}

self.onmessage = function (event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;

  if (type === 'processFrame') {
    try {
      const result = applyMasking(payload.imageData, payload.bgColor, payload.bgImageData);
      self.postMessage({ id, type: 'result', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      self.postMessage({ id, type: 'result', error: message });
    }
  }
};

export {};
