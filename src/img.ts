/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Comprime una imagen (achica a maxLado y baja a JPEG) antes de guardarla,
 * para no reventar el almacenamiento del navegador ni el egress de la nube.
 * Devuelve un data URL (base64) o '' si falla.
 */
export async function comprimirImagen(file: File, maxLado = 1000, calidad = 0.72): Promise<string> {
  return new Promise((resolve) => {
    try {
      const r = new FileReader();
      r.onerror = () => resolve('');
      r.onload = () => {
        const img = new Image();
        img.onerror = () => resolve((r.result as string) || '');
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxLado || h > maxLado) {
            if (w >= h) { h = Math.round((h * maxLado) / w); w = maxLado; }
            else { w = Math.round((w * maxLado) / h); h = maxLado; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve((r.result as string) || ''); return; }
          ctx.drawImage(img, 0, 0, w, h);
          try { resolve(canvas.toDataURL('image/jpeg', calidad)); }
          catch (e) { resolve((r.result as string) || ''); }
        };
        img.src = r.result as string;
      };
      r.readAsDataURL(file);
    } catch (e) { resolve(''); }
  });
}
