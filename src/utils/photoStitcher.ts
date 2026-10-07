/**
 * Reads a File object from an <input type="file"> and returns a compressed JPEG Data URL.
 * Automatically scales down large smartphone camera photos to max 1280px dimension
 * for fast processing, instant stitching, and compact local/cloud storage.
 */
export async function processImageFile(file: File, maxDimension = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to process selected image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Stitches a 'Before' and 'After' photo side-by-side with official branding,
 * timestamp, Job ID watermark, and address stamp.
 */
export async function stitchBeforeAndAfterPhotos(
  beforeUrl: string,
  afterUrl: string,
  meta: {
    jobNumber: string;
    jobTitle: string;
    address: string;
    suburb: string;
    businessName: string;
    dateStr?: string;
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => rej(new Error(`Failed to load image: ${src.slice(0, 50)}...`));
        img.src = src;
      });
    };

    Promise.all([loadImage(beforeUrl), loadImage(afterUrl)])
      .then(([imgBefore, imgAfter]) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas 2D context not available'));

        // Target dimensions for high quality comparison image (1200 x 800)
        const photoWidth = 600;
        const photoHeight = 600;
        const headerHeight = 80;
        const footerHeight = 80;

        canvas.width = photoWidth * 2;
        canvas.height = headerHeight + photoHeight + footerHeight;

        // Background
        ctx.fillStyle = '#0f172a'; // Deep slate graphite
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // -------------------------------------------------------------
        // HEADER BANNER
        // -------------------------------------------------------------
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, headerHeight);

        // Branding & Job Ref
        ctx.fillStyle = '#3b82f6'; // Bright blue
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(meta.businessName.toUpperCase(), 30, 36);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(`JOB REF: #${meta.jobNumber} • ${meta.jobTitle.slice(0, 45)}`, 30, 62);

        // Verified Stamp Badge on Header Right
        ctx.fillStyle = '#059669'; // Emerald
        ctx.beginPath();
        ctx.roundRect(canvas.width - 240, 20, 210, 40, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓ VERIFIED WORK REPORT', canvas.width - 135, 45);
        ctx.textAlign = 'left';

        // -------------------------------------------------------------
        // PHOTOS (Draw Before on Left, After on Right)
        // -------------------------------------------------------------
        // Helper to draw image cover
        const drawCover = (img: HTMLImageElement, dx: number, dy: number, dWidth: number, dHeight: number) => {
          const imgRatio = img.width / img.height;
          const targetRatio = dWidth / dHeight;
          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

          if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sx = (img.width - sWidth) / 2;
          } else {
            sHeight = img.width / targetRatio;
            sy = (img.height - sHeight) / 2;
          }
          ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        };

        // Draw Before Photo
        drawCover(imgBefore, 0, headerHeight, photoWidth, photoHeight);

        // Draw After Photo
        drawCover(imgAfter, photoWidth, headerHeight, photoWidth, photoHeight);

        // Divider Line between photos
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(photoWidth, headerHeight);
        ctx.lineTo(photoWidth, headerHeight + photoHeight);
        ctx.stroke();

        // BEFORE Pill Badge (Top Left of Before Photo)
        ctx.fillStyle = 'rgba(217, 119, 6, 0.95)'; // Solar Amber
        ctx.beginPath();
        ctx.roundRect(24, headerHeight + 20, 130, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('◀ BEFORE', 42, headerHeight + 46);

        // AFTER Pill Badge (Top Right of After Photo)
        ctx.fillStyle = 'rgba(5, 150, 105, 0.95)'; // Electric Emerald
        ctx.beginPath();
        ctx.roundRect(photoWidth + 24, headerHeight + 20, 120, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 16px system-ui, -apple-system, sans-serif';
        ctx.fillText('AFTER ▶', photoWidth + 44, headerHeight + 46);

        // -------------------------------------------------------------
        // FOOTER BANNER
        // -------------------------------------------------------------
        const footerY = headerHeight + photoHeight;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, footerY, canvas.width, footerHeight);

        // Location & Timestamp
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillText(`📍 ${meta.address}`, 30, footerY + 36);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        const dateDisplay = meta.dateStr || new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        ctx.fillText(`📅 Completed: ${dateDisplay} • HandyMap PRO Audit Log`, 30, footerY + 62);

        // Convert canvas to Data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      })
      .catch(err => reject(err));
  });
}
