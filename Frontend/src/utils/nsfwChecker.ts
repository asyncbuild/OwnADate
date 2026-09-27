export interface NSFWPrediction {
  className: "Drawing" | "Hentai" | "Neutral" | "Porn" | "Sexy";
  probability: number;
}

export interface NSFWCheckResult {
  isSafe: boolean;
  reason?: string;
  predictions: NSFWPrediction[];
}

let modelInstance: any = null;
let modelLoadingPromise: Promise<any> | null = null;

/**
 * Returns a cached singleton instance of the NSFWJS model.
 * Uses dynamic import so that tensorflow/nsfwjs is only loaded on demand.
 */
export async function getNSFWModel() {
  if (modelInstance) return modelInstance;

  if (!modelLoadingPromise) {
    modelLoadingPromise = (async () => {
      const nsfwjs = await import("nsfwjs");
      const model = await nsfwjs.load();
      modelInstance = model;
      return model;
    })();
  }

  return modelLoadingPromise;
}

/**
 * Checks an image File or Blob for NSFW/explicit content.
 * Returns whether the image is safe along with detection details.
 */
export async function checkImageNSFW(file: File | Blob): Promise<NSFWCheckResult> {
  const model = await getNSFWModel();

  // Create an image element to feed into the classifier
  const objectUrl = URL.createObjectURL(file);

  return new Promise<NSFWCheckResult>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const rawPredictions = await model.classify(img);
        URL.revokeObjectURL(objectUrl);

        const predictions = rawPredictions as NSFWPrediction[];
        const scores: Record<string, number> = {};
        for (const p of predictions) {
          scores[p.className] = p.probability;
        }

        const pornScore = scores["Porn"] || 0;
        const hentaiScore = scores["Hentai"] || 0;
        const sexyScore = scores["Sexy"] || 0;

        // NSFW Threshold evaluation
        if (pornScore >= 0.4 || hentaiScore >= 0.4) {
          return resolve({
            isSafe: false,
            reason: "Explicit or adult content detected. Please choose a family-friendly image.",
            predictions,
          });
        }

        if (pornScore + hentaiScore >= 0.35) {
          return resolve({
            isSafe: false,
            reason: "Inappropriate content detected. Please select another image.",
            predictions,
          });
        }

        if (sexyScore >= 0.75) {
          return resolve({
            isSafe: false,
            reason: "Overly suggestive or revealing content detected. Please choose a suitable photo.",
            predictions,
          });
        }

        return resolve({
          isSafe: true,
          predictions,
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for moderation check"));
    };

    img.src = objectUrl;
  });
}
