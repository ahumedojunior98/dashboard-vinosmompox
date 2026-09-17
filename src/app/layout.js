import "./globals.css";

export const metadata = {
  title: "Vino Mompox · Panel del Patrón",
  description: "Dashboard administrativo de la tienda artesanal de vinos de Mompox.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
