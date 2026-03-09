// Style Transfer worker: applies pixel-based style effects

interface WorkerMessage {
  id: string;
  type: string;
  payload: {
    imageData: ImageData;
    style: string;
    strength: number;
  };
}

function applyAnimeStyle(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const levels = Math.max(2, Math.round(8 * (1 - strength) + 2));
  const step = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);

    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = Math.min(255, avg + (data[i] - avg) * (1 + strength * 0.8));
    data[i + 1] = Math.min(255, avg + (data[i + 1] - avg) * (1 + strength * 0.8));
    data[i + 2] = Math.min(255, avg + (data[i + 2] - avg) * (1 + strength * 0.8));
  }
}

function applyCartoonStyle(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const levels = Math.max(3, Math.round(6 * (1 - strength) + 3));
  const step = 255 / (levels - 1);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }

  const copy = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const top = ((y - 1) * width + x) * 4;
      const bottom = ((y + 1) * width + x) * 4;
      const left = (y * width + (x - 1)) * 4;
      const right = (y * width + (x + 1)) * 4;

      const gx =
        Math.abs(copy[right] - copy[left]) +
        Math.abs(copy[right + 1] - copy[left + 1]) +
        Math.abs(copy[right + 2] - copy[left + 2]);
      const gy =
        Math.abs(copy[bottom] - copy[top]) +
        Math.abs(copy[bottom + 1] - copy[top + 1]) +
        Math.abs(copy[bottom + 2] - copy[top + 2]);

      const edge = Math.min(255, (gx + gy) / 3);
      const edgeFactor = (edge / 255) * strength * 0.8;

      data[i] = Math.max(0, data[i] * (1 - edgeFactor));
      data[i + 1] = Math.max(0, data[i + 1] * (1 - edgeFactor));
      data[i + 2] = Math.max(0, data[i + 2] * (1 - edgeFactor));
    }
  }
}

function applySketchStyle(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const gray = new Uint8ClampedArray(width * height);

  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const i = idx * 4;

      const gx =
        -gray[(y - 1) * width + (x - 1)] +
        gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] +
        2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] +
        gray[(y + 1) * width + (x + 1)];

      const gy =
        -gray[(y - 1) * width + (x - 1)] +
        -2 * gray[(y - 1) * width + x] +
        -gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] +
        2 * gray[(y + 1) * width + x] +
        gray[(y + 1) * width + (x + 1)];

      const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      const sketchVal = 255 - magnitude * strength;
      const blended = sketchVal * strength + gray[idx] * (1 - strength);

      data[i] = blended;
      data[i + 1] = blended;
      data[i + 2] = blended;
    }
  }
}

function applyOilPaintingStyle(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const radius = Math.max(2, Math.round(3 * strength));
  const copy = new Uint8ClampedArray(data);

  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const i = (y * width + x) * 4;

      let bestMeanR = 0, bestMeanG = 0, bestMeanB = 0;
      let minVariance = Infinity;

      const quadrants = [
        { dy: [-radius, 0], dx: [-radius, 0] },
        { dy: [-radius, 0], dx: [0, radius] },
        { dy: [0, radius], dx: [-radius, 0] },
        { dy: [0, radius], dx: [0, radius] },
      ];

      for (const q of quadrants) {
        let sumR = 0, sumG = 0, sumB = 0;
        let count = 0;

        for (let dy = q.dy[0]; dy <= q.dy[1]; dy++) {
          for (let dx = q.dx[0]; dx <= q.dx[1]; dx++) {
            const qi = ((y + dy) * width + (x + dx)) * 4;
            sumR += copy[qi];
            sumG += copy[qi + 1];
            sumB += copy[qi + 2];
            count++;
          }
        }

        const mR = sumR / count;
        const mG = sumG / count;
        const mB = sumB / count;

        let variance = 0;
        for (let dy = q.dy[0]; dy <= q.dy[1]; dy++) {
          for (let dx = q.dx[0]; dx <= q.dx[1]; dx++) {
            const qi = ((y + dy) * width + (x + dx)) * 4;
            variance += (copy[qi] - mR) ** 2 + (copy[qi + 1] - mG) ** 2 + (copy[qi + 2] - mB) ** 2;
          }
        }
        variance /= count;

        if (variance < minVariance) {
          minVariance = variance;
          bestMeanR = mR;
          bestMeanG = mG;
          bestMeanB = mB;
        }
      }

      data[i] = bestMeanR;
      data[i + 1] = bestMeanG;
      data[i + 2] = bestMeanB;
    }
  }
}

function applyWatercolorStyle(data: Uint8ClampedArray, width: number, height: number, strength: number): void {
  const copy = new Uint8ClampedArray(data);
  const blurRadius = Math.max(1, Math.round(2 * strength));

  for (let y = blurRadius; y < height - blurRadius; y++) {
    for (let x = blurRadius; x < width - blurRadius; x++) {
      const i = (y * width + x) * 4;
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -blurRadius; dy <= blurRadius; dy++) {
        for (let dx = -blurRadius; dx <= blurRadius; dx++) {
          const qi = ((y + dy) * width + (x + dx)) * 4;
          r += copy[qi];
          g += copy[qi + 1];
          b += copy[qi + 2];
          count++;
        }
      }

      const blurredR = r / count;
      const blurredG = g / count;
      const blurredB = b / count;

      data[i] = blurredR * strength + copy[i] * (1 - strength);
      data[i + 1] = blurredG * strength + copy[i + 1] * (1 - strength);
      data[i + 2] = blurredB * strength + copy[i + 2] * (1 - strength);

      data[i] = Math.min(255, data[i] * 1.05);
      data[i + 1] = Math.min(255, data[i + 1] * 1.02);
      data[i + 2] = Math.min(255, data[i + 2] * 0.98);
    }
  }
}

self.onmessage = function (event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;

  if (type === 'applyStyle') {
    try {
      const { imageData, style, strength } = payload;
      const data = new Uint8ClampedArray(imageData.data);
      const { width, height } = imageData;

      switch (style) {
        case 'anime':
          applyAnimeStyle(data, width, height, strength);
          break;
        case 'cartoon':
          applyCartoonStyle(data, width, height, strength);
          break;
        case 'sketch':
          applySketchStyle(data, width, height, strength);
          break;
        case 'oilpainting':
          applyOilPaintingStyle(data, width, height, strength);
          break;
        case 'watercolor':
          applyWatercolorStyle(data, width, height, strength);
          break;
      }

      const result = new ImageData(data, width, height);
      self.postMessage({ id, type: 'result', payload: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Style transfer failed';
      self.postMessage({ id, type: 'result', error: message });
    }
  }
};

export {};
