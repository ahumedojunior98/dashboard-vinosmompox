import { cn } from "@/lib/utils";

export function Button({ className, variant = "vino", ...props }) {
  const variants = {
    vino: "btn-vino",
    dorado: "btn-dorado",
    palma: "btn-palma",
    crema: "btn-crema",
    peligro: "btn-vino",
  };
  return (
    <button
      className={cn("btn-relieve px-4 py-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed", variants[variant] || variants.vino, className)}
      {...props}
    />
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("relieve p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function Input(props) {
  return <input className="input-relieve" {...props} />;
}

export function Textarea(props) {
  return <textarea className="input-relieve min-h-[84px]" {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className="input-relieve cursor-pointer" {...props}>
      {children}
    </select>
  );
}

export function Badge({ className, children, color = "#f0d48a" }) {
  return (
    <span className={cn("etiqueta inline-flex items-center")} style={{ background: color }}>
      {children}
    </span>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-extrabold uppercase tracking-wide mb-1.5" style={{ color: "#5c1420" }}>
        {label}
      </span>
      {children}
      {hint ? <span className="block text-xs mt-1 opacity-70">{hint}</span> : null}
    </label>
  );
}
