"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { subirFotoProducto } from "@/lib/storage";

export default function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [porc, setPorc] = useState(0);
  const [fase, setFase] = useState("");
  const [error, setError] = useState("");

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSubiendo(true);
    setPorc(2);
    setFase("Comprimiendo foto…");
    try {
      const url = await subirFotoProducto(file, ({ fase: f, porc: p }) => {
        setPorc(p);
        setFase(f === "comprimiendo" ? "Comprimiendo foto…" : f === "subiendo" ? `Subiendo… ${p}%` : "¡Lista!");
      });
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
      setTimeout(() => { setPorc(0); setFase(""); }, 1500);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto del producto" className="w-16 h-16 object-cover" style={{ border: "2px solid #3d2b1f", borderRadius: "0.8rem" }} />
        ) : (
          <div className="w-16 h-16 flex items-center justify-center" style={{ background: "#f3e9d2", border: "2px dashed #8a5a33", borderRadius: "0.8rem" }}>
            <Camera size={24} className="opacity-50" />
          </div>
        )}
        <div className="flex flex-col gap-1 flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="btn-relieve btn-crema px-3 py-1.5 text-[13px] cursor-pointer flex items-center gap-1 w-fit"
          >
            {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {subiendo ? fase || "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
          </button>
          {subiendo ? (
            <div className="w-full max-w-[220px] h-2.5 rounded-full overflow-hidden" style={{ border: "2px solid #3d2b1f", background: "#f3e9d2" }}>
              <div className="h-full transition-all" style={{ width: `${porc}%`, background: "linear-gradient(90deg,#e6bd55,#b3402a)" }} />
            </div>
          ) : null}
          {value && !subiendo ? (
            <button type="button" onClick={() => onChange("")} className="text-xs font-bold underline opacity-70 cursor-pointer text-left">
              Quitar foto
            </button>
          ) : null}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      {error ? <p className="text-xs font-bold mt-1" style={{ color: "#7a1e2b" }}>⚠️ {error}</p> : null}
      <p className="text-[11px] opacity-60 font-semibold mt-1">La foto se comprime sola antes de subir (más rápido). O pega un enlace abajo.</p>
    </div>
  );
}
