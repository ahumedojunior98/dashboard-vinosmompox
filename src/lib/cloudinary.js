// Subida de fotos a Cloudinary con upload preset UNSIGNED.
// No requiere firma ni expone el API Secret: el preset "vinosartesanales"
// (Signing Mode = Unsigned) autoriza la subida desde el front.
//
// Env necesarias (ver .env.local):
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."      (public)
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="vinosartesanales" (public)
// Las de API Key / API Secret quedan para uso futuro en servidor, no se usan aquí.

// Reduce la foto en el mismo celular/PC antes de subirla.
// Una foto de 4MB baja a ~150-300KB → sube ~10x más rápido.
function comprimirImagen(file, maxLado = 1280, calidad = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const escala = Math.min(1, maxLado / Math.max(width, height));
        width = Math.round(width * escala);
        height = Math.round(height * escala);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("No pude comprimir la foto."))),
          "image/jpeg",
          calidad
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El archivo no es una imagen válida."));
    };
    img.src = url;
  });
}

export async function subirFotoCloudinary(file, onProgress) {
  if (!file) throw new Error("Sin archivo.");
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (file.size > 10 * 1024 * 1024) throw new Error("La foto pesa más de 10MB. Usa una más liviana.");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "vinosartesanales";
  if (!cloudName) {
    throw new Error(
      "Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME en .env.local. Llénala y reinicia con pnpm dev."
    );
  }

  onProgress && onProgress({ fase: "comprimiendo", porc: 5 });
  const blob = await comprimirImagen(file);

  // Subida UNSIGNED directo a Cloudinary con XHR (progreso real)
  onProgress && onProgress({ fase: "subiendo", porc: 15 });
  const form = new FormData();
  form.append("file", blob, "foto.jpg");
  form.append("upload_preset", preset);

  const secureUrl = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timer = setTimeout(() => {
      xhr.abort();
      reject(new Error("Tardó más de 60s. Revisa tu internet o el cloud name / preset."));
    }, 60000);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const porc = Math.round((e.loaded / e.total) * 85) + 15;
        onProgress && onProgress({ fase: "subiendo", porc });
      }
    };
    xhr.onload = () => {
      clearTimeout(timer);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data?.error?.message || `Cloudinary respondió ${xhr.status}. Revisa que el preset "${preset}" sea Unsigned y el cloud name esté bien.`));
        }
      } catch {
        reject(new Error("Respuesta inesperada de Cloudinary."));
      }
    };
    xhr.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Error de red subiendo a Cloudinary. Revisa tu internet y el cloud name."));
    };
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.send(form);
  });

  onProgress && onProgress({ fase: "listo", porc: 100 });
  return secureUrl;
}
