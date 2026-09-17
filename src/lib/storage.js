import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// Reduce la foto en el mismo celular/PC antes de subirla.
// Una foto de 4MB baja a ~150-300KB → sube ~10x más rápido.
function comprimirImagen(file, maxLado = 1024, calidad = 0.78) {
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

export async function subirFotoProducto(file, onProgress) {
  if (!file) throw new Error("Sin archivo.");
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen.");
  if (file.size > 10 * 1024 * 1024) throw new Error("La foto pesa más de 10MB. Usa una más liviana.");

  onProgress && onProgress({ fase: "comprimiendo", porc: 5 });
  const blob = await comprimirImagen(file);
  onProgress && onProgress({ fase: "subiendo", porc: 15 });

  const safe = (file.name || "foto.jpg").replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.\w+$/, ".jpg");
  const path = `products/${Date.now()}_${safe}`;
  const r = ref(storage, path);
  const task = uploadBytesResumable(r, blob, { contentType: "image/jpeg" });

  await new Promise((resolve, reject) => {
    // Si en 60s no termina, avisamos (internet muy lento o reglas bloqueando)
    const timer = setTimeout(() => {
      task.cancel();
      reject(new Error("Tardó más de 60s. Revisa tu internet o las reglas de Storage."));
    }, 60000);
    task.on(
      "state_changed",
      (snap) => {
        const porc = Math.round((snap.bytesTransferred / snap.totalBytes) * 85) + 15;
        onProgress && onProgress({ fase: "subiendo", porc });
      },
      (err) => {
        clearTimeout(timer);
        const server = String(err?.serverResponse || err?.customData?.serverResponse || "");
        const code = err?.code || "";
        if (code === "storage/unauthorized") {
          reject(new Error("Storage denegado: abre las reglas de Storage para products."));
        } else if (code === "storage/retry-limit-exceeded") {
          reject(new Error("Internet muy lento, se agotaron los reintentos."));
        } else if (code === "storage/unknown" && server.includes("404")) {
          reject(
            new Error(
              "El depósito de fotos no existe: entra a Firebase Console → Storage → «Comenzar» para activarlo, y revisa que el nombre del bucket en .env.local sea el mismo que muestra la consola."
            )
          );
        } else {
          reject(err);
        }
      },
      () => {
        clearTimeout(timer);
        resolve(true);
      }
    );
  });

  onProgress && onProgress({ fase: "listo", porc: 100 });
  return await getDownloadURL(r);
}
