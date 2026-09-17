"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wine, Plus, Minus, Trash2, Pencil, Tag, Package, PackagePlus, Percent,
  Search, Store, Coins, Boxes, Sparkles, X, Check, Eye, EyeOff,
  ClipboardList, TrendingUp, Phone, MapPin, User, Receipt, Download,
} from "lucide-react";
import { Button, Card, Input, Textarea, Select, Badge, Field } from "@/components/ui";
import ImageUploader from "@/components/ImageUploader";
import { formatCOP, precioFinal } from "@/lib/utils";
import {
  CATEGORIAS, ESTADOS_PEDIDO, METODOS_PAGO,
  subscribeProducts, createProduct, updateProduct, deleteProduct, changeStock,
  subscribeOrders, createOrder, setOrderStatus, deleteOrder,
} from "@/lib/store";

const FORM_INICIAL = { name: "", category: "Vino de Corozo", price: "", stock: "", description: "", imageUrl: "", discount: "0" };
const COLOR_ESTADO = { pendiente: "#f0d48a", preparando: "#9fd0e8", enviado: "#d9c2f0", entregado: "#bfe6c4", cancelado: "#e5c9c4" };

function Header({ totalStock, tab, setTab, pendientes }) {
  return (
    <header className="relieve overflow-hidden">
      <div className="cenefa" />
      <div className="p-5 sm:p-6 flex flex-col gap-4" style={{ background: "linear-gradient(180deg, #fffdf6 0%, #faf0d8 100%)" }}>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 shrink-0"
              style={{ background: "linear-gradient(180deg,#93303f,#5c1420)", border: "2px solid #3d2b1f", borderRadius: "1rem", boxShadow: "3px 3px 0 #3d2b1f, inset 0 1px 0 rgba(255,255,255,.4)" }}>
              <Wine size={30} color="#f0d48a" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: "#b3402a" }}>Mompox · Bolívar · Caribe</p>
              <h1 className="font-tradicion text-3xl sm:text-4xl leading-none" style={{ color: "#5c1420" }}>Vino Mompox</h1>
              <p className="text-sm font-semibold opacity-80">Panel del patrón — solo administración</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge color="#f0d48a">🍷 Artesanal</Badge>
            <Badge color="#d7e9d4">🌴 Mompox</Badge>
            <Badge color="#ffe9c7">📦 {totalStock} botellas</Badge>
            {pendientes > 0 ? <Badge color="#ffb3a6">🔔 {pendientes} pendientes</Badge> : null}
          </div>
        </div>
        <nav className="flex gap-2 flex-wrap">
          {[
            { id: "bodega", label: "🍷 Bodega", icon: <Store size={15} /> },
            { id: "pedidos", label: `📋 Pedidos${pendientes ? ` (${pendientes})` : ""}`, icon: <ClipboardList size={15} /> },
            { id: "ventas", label: "💰 Ventas", icon: <TrendingUp size={15} /> },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="btn-relieve px-4 py-2 text-sm cursor-pointer flex items-center gap-1.5"
              style={{ background: tab === t.id ? "linear-gradient(180deg,#93303f,#5c1420)" : "#fff", color: tab === t.id ? "#fff8ea" : "#3d2b1f" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="cenefa" />
    </header>
  );
}

function StatCard({ icon, titulo, valor, subtitulo, color }) {
  return (
    <Card className="flex items-center gap-3 !p-4">
      <div className="w-11 h-11 flex items-center justify-center shrink-0"
        style={{ background: color, border: "2px solid #3d2b1f", borderRadius: "0.8rem", boxShadow: "2px 2px 0 #3d2b1f" }}>{icon}</div>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">{titulo}</p>
        <p className="font-tradicion text-2xl leading-none">{valor}</p>
        {subtitulo ? <p className="text-xs font-semibold opacity-70 mt-0.5">{subtitulo}</p> : null}
      </div>
    </Card>
  );
}

export default function Home() {
  const [tab, setTab] = useState("bodega");
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Bodega
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState("Todas");
  const [soloCombos, setSoloCombos] = useState(false);
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editPrecio, setEditPrecio] = useState("");
  const [editDescuento, setEditDescuento] = useState("");
  const [editStock, setEditStock] = useState("");
  const [comboNombre, setComboNombre] = useState("");
  const [comboPrecio, setComboPrecio] = useState("");
  const [comboDesc, setComboDesc] = useState("");
  const [comboItems, setComboItems] = useState({});
  const [guardandoCombo, setGuardandoCombo] = useState(false);

  // Pedidos
  const [cliNombre, setCliNombre] = useState("");
  const [cliTel, setCliTel] = useState("");
  const [cliDir, setCliDir] = useState("");
  const [pedItems, setPedItems] = useState({});
  const [pedPago, setPedPago] = useState("Nequi");
  const [pedNotas, setPedNotas] = useState("");
  const [pedDcto, setPedDcto] = useState("0");
  const [guardandoPed, setGuardandoPed] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    const u1 = subscribeProducts((items) => { setProductos(items); setCargando(false); },
      (e) => { setError("No pude leer Firestore: " + (e?.message || e)); setCargando(false); });
    const u2 = subscribeOrders(setPedidos, (e) => setError("No pude leer pedidos: " + (e?.message || e) + ". Revisa reglas de «orders»."));
    return () => { u1 && u1(); u2 && u2(); };
  }, []);

  const stats = useMemo(() => ({
    totalProductos: productos.length,
    totalStock: productos.reduce((a, p) => a + (Number(p.stock) || 0), 0),
    valor: productos.reduce((a, p) => a + precioFinal(p) * (Number(p.stock) || 0), 0),
    combos: productos.filter((p) => p.type === "combo").length,
  }), [productos]);

  const pendientes = useMemo(() => pedidos.filter((o) => o.status === "pendiente").length, [pedidos]);

  const ventas = useMemo(() => {
    const validos = pedidos.filter((o) => o.status !== "cancelado");
    const total = validos.reduce((a, o) => a + (Number(o.total) || 0), 0);
    const entregado = pedidos.filter((o) => o.status === "entregado").reduce((a, o) => a + (Number(o.total) || 0), 0);
    const hoy = new Date().toDateString();
    const hoyTotal = validos.filter((o) => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      return d && d.toDateString() === hoy;
    }).reduce((a, o) => a + (Number(o.total) || 0), 0);
    const botellas = validos.reduce((a, o) => a + (o.items || []).reduce((x, i) => x + (Number(i.qty) || 0), 0), 0);
    return { total, entregado, hoyTotal, botellas, n: validos.length };
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      if (soloCombos && p.type !== "combo") return false;
      if (soloOfertas && !(Number(p.discount) > 0)) return false;
      if (filtroCat !== "Todas" && p.category !== filtroCat) return false;
      if (q && !(`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [productos, busqueda, filtroCat, soloCombos, soloOfertas]);

  const pedidosFiltrados = useMemo(() =>
    pedidos.filter((o) => filtroEstado === "todos" ? true : o.status === filtroEstado),
    [pedidos, filtroEstado]);

  function avisar(t) { setMensaje(t); setTimeout(() => setMensaje(""), 3500); }

  // ---- Bodega ----
  async function onCrearProducto(e) {
    e.preventDefault(); setError("");
    if (!form.name.trim()) { setError("Ponle nombre al vino (ej: Vino de Corozo 750ml)."); return; }
    setGuardando(true);
    try {
      await createProduct({ ...form, price: Number(form.price) || 0, stock: Number(form.stock) || 0, discount: Number(form.discount) || 0, type: "sencillo" });
      setForm(FORM_INICIAL); avisar("✅ Producto guardado en la bodega.");
    } catch (e2) { setError(e2.message); } finally { setGuardando(false); }
  }
  async function onBorrar(id, nombre) {
    if (!confirm(`¿Borrar «${nombre}»? No se puede deshacer.`)) return;
    try { await deleteProduct(id); avisar("🗑️ Producto borrado."); } catch (e) { setError(e.message); }
  }
  async function onStock(id, d) { try { await changeStock(id, d); } catch (e) { setError(e.message); } }
  function empezarEdicion(p) { setEditandoId(p.id); setEditPrecio(String(p.price ?? 0)); setEditDescuento(String(p.discount ?? 0)); setEditStock(String(p.stock ?? 0)); }
  async function guardarEdicion(id) {
    try {
      await updateProduct(id, { price: Number(editPrecio) || 0, discount: Math.min(90, Math.max(0, Number(editDescuento) || 0)), stock: Math.max(0, Number(editStock) || 0) });
      setEditandoId(null); avisar("💰 Precio, descuento y stock actualizados.");
    } catch (e) { setError(e.message); }
  }
  async function toggleActivo(p) { try { await updateProduct(p.id, { active: !p.active }); } catch (e) { setError(e.message); } }
  function toggleComboItem(id) { setComboItems((p) => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = 1; return n; }); }
  function agregarAlCombo(id) { setComboItems((p) => ({ ...p, [id]: (Number(p[id]) || 0) + 1 })); }
  function quitarDelCombo(id) { setComboItems((p) => { const n = { ...p }; delete n[id]; return n; }); }
  function cantCombo(id, delta) { setComboItems((p) => { const n = Number(p[id]) || 0; const next = n + delta; if (next <= 0) { const c = { ...p }; delete c[id]; return c; } return { ...p, [id]: next }; }); }
  const [comboAviso, setComboAviso] = useState("");
  async function onCrearCombo(e) {
    e.preventDefault(); setError(""); setComboAviso("");
    const ids = Object.keys(comboItems);
    const totalBotellas = ids.reduce((a, id) => a + (Number(comboItems[id]) || 0), 0);
    if (!comboNombre.trim()) { setComboAviso("⚠️ Ponle un nombre al combo (ej: Combo Pareja Corozo x2)."); return; }
    if (totalBotellas < 2) { setComboAviso(`⚠️ Llevas ${totalBotellas} botella en el combo. Agrega hasta sumar al menos 2 (puede ser el mismo vino, ej: 2× Corozo).`); return; }
    setGuardandoCombo(true);
    try {
      const items = ids.map((id) => { const p = productos.find((x) => x.id === id); return { id, name: p?.name || id, qty: Number(comboItems[id]) || 1, price: Number(p?.price) || 0 }; });
      const suma = items.reduce((a, i) => a + i.price * i.qty, 0);
      await createProduct({ name: comboNombre.trim(), category: "Combo Promocional", price: Number(comboPrecio) || suma, stock: 0, description: comboDesc.trim() || `Incluye: ${items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`, imageUrl: "", discount: 0, type: "combo", comboItems: items });
      setComboNombre(""); setComboPrecio(""); setComboDesc(""); setComboItems({}); avisar("🎁 Combo guardado.");
    } catch (e2) { setError(e2.message); } finally { setGuardandoCombo(false); }
  }
  const sumaCombo = useMemo(() => Object.entries(comboItems).reduce((a, [id, q]) => {
    const p = productos.find((x) => x.id === id); return a + (Number(p?.price) || 0) * (Number(q) || 0);
  }, 0), [comboItems, productos]);

  // ---- Pedidos ----
  function cambiarCantPedido(id, delta) {
    setPedItems((prev) => {
      const p = productos.find((x) => x.id === id);
      const actual = Number(prev[id]) || 0;
      const stock = Number(p?.stock) || 0;
      const next = actual + delta;
      if (next <= 0) { const n = { ...prev }; delete n[id]; return n; }
      if (next > stock) { setError(`Solo quedan ${stock} de «${p?.name}».`); return prev; }
      return { ...prev, [id]: next };
    });
  }
  const resumenPedido = useMemo(() => {
    const items = Object.entries(pedItems).map(([id, qty]) => {
      const p = productos.find((x) => x.id === id);
      return { productId: id, name: p?.name || "", qty, unitPrice: p ? precioFinal(p) : 0 };
    });
    const subtotal = items.reduce((a, i) => a + i.qty * i.unitPrice, 0);
    const total = Math.round(subtotal * (1 - (Number(pedDcto) || 0) / 100));
    return { items, subtotal, total };
  }, [pedItems, productos, pedDcto]);

  async function onCrearPedido(e) {
    e.preventDefault(); setError("");
    setGuardandoPed(true);
    try {
      await createOrder({
        customer: { name: cliNombre, phone: cliTel, address: cliDir },
        items: resumenPedido.items, payment: pedPago, notes: pedNotas, discount: Number(pedDcto) || 0,
      });
      setCliNombre(""); setCliTel(""); setCliDir(""); setPedItems({}); setPedNotas(""); setPedDcto("0");
      avisar("📋 Pedido anotado y stock descontado."); setTab("pedidos");
    } catch (e2) { setError(e2.message); } finally { setGuardandoPed(false); }
  }

  async function onEstadoPedido(id, est) { try { await setOrderStatus(id, est); } catch (e) { setError(e.message); } }
  async function onBorrarPedido(id) {
    if (!confirm("¿Borrar este pedido del cuaderno? El stock NO se devuelve solo.")) return;
    try { await deleteOrder(id); avisar("Pedido borrado."); } catch (e) { setError(e.message); }
  }

  function exportarCSV() {
    const rows = [["fecha", "cliente", "telefono", "direccion", "productos", "pago", "estado", "total"]];
    pedidos.forEach((o) => {
      const fecha = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString("es-CO") : "";
      const prods = (o.items || []).map((i) => `${i.qty}x ${i.name}`).join(" | ");
      rows.push([fecha, o.customer?.name || "", o.customer?.phone || "", o.customer?.address || "", prods, o.payment || "", o.status || "", String(o.total || 0)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "ventas-vino-mompox.csv"; a.click();
  }

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-5 py-5 flex flex-col gap-5">
      <Header totalStock={stats.totalStock} tab={tab} setTab={setTab} pendientes={pendientes} />
      {mensaje ? <div className="relieve-suave px-4 py-3 text-sm font-bold" style={{ background: "#ddf0da", borderColor: "#2e6b4f" }}>{mensaje}</div> : null}
      {error ? <div className="relieve-suave px-4 py-3 text-sm font-bold" style={{ background: "#fbe3df", borderColor: "#7a1e2b" }}>⚠️ {error} <button className="underline ml-2 cursor-pointer" onClick={() => setError("")}>Cerrar</button></div> : null}

      {tab === "bodega" && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Store size={22} color="#3d2b1f" />} titulo="Productos" valor={stats.totalProductos} subtitulo="en bodega" color="#f0d48a" />
            <StatCard icon={<Boxes size={22} color="#fff" />} titulo="Botellas" valor={stats.totalStock} subtitulo="stock total" color="#2e6b4f" />
            <StatCard icon={<Coins size={22} color="#fff" />} titulo="Inventario" valor={formatCOP(stats.valor)} subtitulo="a precio final" color="#7a1e2b" />
            <StatCard icon={<Sparkles size={22} color="#3d2b1f" />} titulo="Combos" valor={stats.combos} subtitulo="promocionales" color="#9fd0e8" />
          </section>
          <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
            <Card style={{ background: "linear-gradient(180deg,#fffdf6,#faf0d8)" }}>
              <div className="flex items-center gap-2 mb-1"><PackagePlus size={22} color="#7a1e2b" />
                <h2 className="font-tradicion text-2xl" style={{ color: "#5c1420" }}>Agregar vino</h2></div>
              <p className="text-sm opacity-75 mb-4 font-semibold">Con foto real desde tu celular o PC.</p>
              <form onSubmit={onCrearProducto} className="flex flex-col gap-3">
                <Field label="Nombre del producto">
                  <Input placeholder="Ej: Vino de Corozo 750ml" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Foto del vino">
                  <ImageUploader value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Categoría / Sabor">
                    <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label="Descuento %">
                    <Input type="number" min="0" max="90" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Precio (COP)">
                    <Input type="number" min="0" placeholder="45000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Field>
                  <Field label="Cantidad (stock)">
                    <Input type="number" min="0" placeholder="24" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </Field>
                </div>
                <Field label="Enlace de foto (opcional)">
                  <Input placeholder="https://… o usa el botón de arriba" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                </Field>
                <Field label="Descripción">
                  <Textarea placeholder="Dulce artesanal, fermentado en Mompox…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </Field>
                <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "＋ Guardar en la bodega"}</Button>
              </form>
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="!p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <Input className="!pl-9" placeholder="Buscar vino o combo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                  </div>
                  <Select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className="sm:w-52">
                    <option value="Todas">Todas las categorías</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setSoloCombos(!soloCombos)} className={`etiqueta cursor-pointer ${soloCombos ? "" : "opacity-60"}`} style={{ background: soloCombos ? "#9fd0e8" : "#fff" }}>🎁 Solo combos</button>
                  <button onClick={() => setSoloOfertas(!soloOfertas)} className={`etiqueta cursor-pointer ${soloOfertas ? "" : "opacity-60"}`} style={{ background: soloOfertas ? "#f0d48a" : "#fff" }}>% Solo ofertas</button>
                </div>
              </Card>
              {cargando ? <Card><p className="font-tradicion text-xl">Cargando la bodega… 🍷</p></Card>
                : filtrados.length === 0 ? <Card className="text-center py-10"><p className="font-tradicion text-2xl">La estantería está vacía</p></Card>
                : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filtrados.map((p) => {
                      const final = precioFinal(p); const editando = editandoId === p.id;
                      return (
                        <div key={p.id} className="relieve-suave p-4 flex flex-col gap-2" style={{ opacity: p.active === false ? 0.75 : 1 }}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-2 items-start">
                              {p.imageUrl
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={p.imageUrl} alt={p.name} className="w-12 h-12 object-cover" style={{ border: "2px solid #3d2b1f", borderRadius: "0.7rem" }} />
                                : <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: p.type === "combo" ? "#9fd0e8" : "#f0d48a", border: "2px solid #3d2b1f", borderRadius: "0.7rem" }}>{p.type === "combo" ? <Package size={22} /> : <Wine size={22} />}</div>}
                              <div>
                                <h3 className="font-tradicion text-lg leading-tight">{p.name}</h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge color={p.type === "combo" ? "#9fd0e8" : "#f0d48a"}>{p.type === "combo" ? "Combo" : p.category}</Badge>
                                  {Number(p.discount) > 0 ? <Badge color="#ffb3a6">-{p.discount}%</Badge> : null}
                                  {p.active === false ? <Badge color="#ddd">Pausado</Badge> : null}
                                </div>
                              </div>
                            </div>
                            <button title="Pausar/Activar" onClick={() => toggleActivo(p)} className="cursor-pointer p-1.5 rounded-lg border-2" style={{ borderColor: "#3d2b1f", background: "#fff" }}>{p.active === false ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                          </div>
                          {p.type === "combo" && Array.isArray(p.comboItems) && p.comboItems.length > 0 && (
                            <div className="relieve-hundido !rounded-xl px-3 py-2 text-xs font-semibold">🎁 Incluye: {p.comboItems.map((i) => `${i.qty}× ${i.name}`).join(" · ")}</div>)}
                          {p.description ? <p className="text-[13px] opacity-80 leading-snug">{p.description}</p> : null}
                          {!editando ? (
                            <>
                              <div className="flex items-end justify-between">
                                <div>
                                  {Number(p.discount) > 0
                                    ? <><p className="text-xs font-bold line-through opacity-60">{formatCOP(p.price)}</p><p className="font-tradicion text-2xl" style={{ color: "#7a1e2b" }}>{formatCOP(final)}</p></>
                                    : <p className="font-tradicion text-2xl">{formatCOP(p.price)}</p>}
                                </div>
                                <div className="text-right"><p className="text-[11px] font-extrabold uppercase opacity-60">Stock</p><p className="font-tradicion text-2xl">{p.stock ?? 0}</p></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="crema" className="!px-2.5 !py-1.5" onClick={() => onStock(p.id, -1)}><Minus size={15} /></Button>
                                <Button variant="crema" className="!px-2.5 !py-1.5" onClick={() => onStock(p.id, 1)}><Plus size={15} /></Button>
                                <span className="text-xs font-bold opacity-60">±1 botella</span>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <Button variant="dorado" className="flex-1 !py-1.5 !text-[13px]" onClick={() => empezarEdicion(p)}><Pencil size={14} /> Precio / Oferta</Button>
                                <Button variant="crema" className="!px-3 !py-1.5" onClick={() => onBorrar(p.id, p.name)}><Trash2 size={15} /></Button>
                              </div>
                            </>
                          ) : (
                            <div className="relieve-hundido p-3 flex flex-col gap-2">
                              <div className="grid grid-cols-3 gap-2">
                                <Field label="Precio"><Input type="number" min="0" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} /></Field>
                                <Field label="% Dcto"><Input type="number" min="0" max="90" value={editDescuento} onChange={(e) => setEditDescuento(e.target.value)} /></Field>
                                <Field label="Stock"><Input type="number" min="0" value={editStock} onChange={(e) => setEditStock(e.target.value)} /></Field>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="palma" className="flex-1 !py-1.5 !text-[13px]" onClick={() => guardarEdicion(p.id)}><Check size={14} /> Guardar</Button>
                                <Button variant="crema" className="!py-1.5" onClick={() => setEditandoId(null)}><X size={14} /></Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              <Card style={{ background: "linear-gradient(180deg,#eaf4fb,#fffdf6)" }}>
                <div className="flex items-center gap-2 mb-1"><Tag size={22} color="#1e6e8c" />
                  <h2 className="font-tradicion text-2xl" style={{ color: "#1e3f52" }}>Armar combo promocional</h2></div>
                <form onSubmit={onCrearCombo} className="flex flex-col gap-3 mt-2">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Nombre del combo"><Input placeholder="Ej: Combo Fiesta Momposina" value={comboNombre} onChange={(e) => setComboNombre(e.target.value)} /></Field>
                    <Field label="Precio del combo (COP)" hint={sumaCombo > 0 ? `Suma por separado: ${formatCOP(sumaCombo)}` : ""}>
                      <Input type="number" min="0" value={comboPrecio} onChange={(e) => setComboPrecio(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Descripción (opcional)"><Input value={comboDesc} onChange={(e) => setComboDesc(e.target.value)} /></Field>
                  {comboAviso ? (
                    <div className="relieve-suave px-3 py-2 text-[13px] font-bold" style={{ background: "#fbe3df", borderColor: "#7a1e2b" }}>{comboAviso}</div>
                  ) : null}
                  {/* Paso 1: escoge los vinos */}
                  <p className="text-[13px] font-extrabold uppercase tracking-wide" style={{ color: "#1e3f52" }}>
                    Paso 1 · Escoge los vinos con el botón ＋ (vale repetir el mismo)
                  </p>
                  {productos.filter((p) => p.type !== "combo").length === 0 ? (
                    <p className="text-sm font-semibold opacity-70">Primero agrega vinos sencillos en “Agregar vino”.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-56 overflow-auto pr-1">
                      {productos.filter((p) => p.type !== "combo").map((p) => {
                        const cant = Number(comboItems[p.id]) || 0;
                        return (
                          <div key={p.id} className="flex items-center gap-2 px-3 py-2"
                            style={{ background: cant > 0 ? "#d7e9d4" : "#fff", border: "2px solid #3d2b1f", borderRadius: "0.8rem" }}>
                            <span className="text-[13px] font-bold flex-1">{p.name}<br /><span className="opacity-60">{formatCOP(precioFinal(p))}</span></span>
                            {cant > 0 ? (
                              <span className="etiqueta" style={{ background: "#2e6b4f", color: "#fff" }}>×{cant} en el combo</span>
                            ) : null}
                            <button type="button" onClick={() => agregarAlCombo(p.id)}
                              className="btn-relieve px-3 py-1 text-sm cursor-pointer" style={{ background: "#2e6b4f", color: "#fff" }}>
                              ＋ Agregar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Paso 2: revisa tu combo */}
                  <p className="text-[13px] font-extrabold uppercase tracking-wide" style={{ color: "#1e3f52" }}>
                    Paso 2 · Revisa tu combo ({Object.keys(comboItems).length})
                  </p>
                  {Object.keys(comboItems).length === 0 ? (
                    <div className="relieve-hundido px-3 py-2 text-[13px] font-semibold opacity-70">
                      Aquí aparecerán los vinos que agregues 👆
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {Object.entries(comboItems).map(([id, qty]) => {
                        const p = productos.find((x) => x.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 px-3 py-2" style={{ background: "#fff", border: "2px solid #2e6b4f", borderRadius: "0.8rem", boxShadow: "2px 2px 0 #2e6b4f" }}>
                            <span className="text-[13px] font-bold flex-1">🎁 {p.name}</span>
                            <button type="button" onClick={() => cantCombo(id, -1)} className="cursor-pointer px-2 border-2 rounded-md bg-white font-extrabold" style={{ borderColor: "#3d2b1f" }}>−</button>
                            <span className="font-extrabold w-5 text-center">{qty}</span>
                            <button type="button" onClick={() => cantCombo(id, 1)} className="cursor-pointer px-2 border-2 rounded-md font-extrabold" style={{ borderColor: "#3d2b1f", background: "#f0d48a" }}>+</button>
                            <button type="button" onClick={() => quitarDelCombo(id)} className="cursor-pointer p-1.5 rounded-lg border-2" style={{ borderColor: "#7a1e2b", background: "#fff" }} title="Sacar del combo"><Trash2 size={14} color="#7a1e2b" /></button>
                          </div>
                        );
                      })}
                      <div className="relieve-hundido px-3 py-2 text-[13px] font-bold">
                        Suma por separado: {formatCOP(sumaCombo)}
                        {Number(comboPrecio) > 0 && Number(comboPrecio) < sumaCombo ? (
                          <span> · Tus clientes ahorran: {formatCOP(sumaCombo - Number(comboPrecio))} 🎉</span>
                        ) : null}
                      </div>
                    </div>
                  )}
                  <Button type="submit" variant="palma" disabled={guardandoCombo}><Percent size={15} /> {guardandoCombo ? "Guardando…" : `Paso 3 · Guardar combo (${Object.values(comboItems).reduce((a, q) => a + (Number(q) || 0), 0)} botellas)`}</Button>
                </form>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === "pedidos" && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<ClipboardList size={22} />} titulo="Pendientes" valor={pendientes} subtitulo="por atender" color="#f0d48a" />
            <StatCard icon={<Receipt size={22} color="#fff" />} titulo="Total pedidos" valor={pedidos.length} subtitulo="en el cuaderno" color="#1e6e8c" />
            <StatCard icon={<Coins size={22} color="#fff" />} titulo="Vendido" valor={formatCOP(ventas.total)} subtitulo="sin cancelados" color="#7a1e2b" />
            <StatCard icon={<TrendingUp size={22} />} titulo="Hoy" valor={formatCOP(ventas.hoyTotal)} subtitulo="ventas del día" color="#bfe6c4" />
          </section>
          <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
            <Card style={{ background: "linear-gradient(180deg,#fffdf6,#faf0d8)" }}>
              <h2 className="font-tradicion text-2xl mb-1" style={{ color: "#5c1420" }}>Anotar pedido</h2>
              <p className="text-sm font-semibold opacity-70 mb-3">Se descuenta solo del stock. Ideal para WhatsApp.</p>
              <form onSubmit={onCrearPedido} className="flex flex-col gap-3">
                <Field label="Nombre del cliente"><Input placeholder="Ej: Doña Carmen" value={cliNombre} onChange={(e) => setCliNombre(e.target.value)} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Teléfono"><Input placeholder="300…" value={cliTel} onChange={(e) => setCliTel(e.target.value)} /></Field>
                  <Field label="Pago"><Select value={pedPago} onChange={(e) => setPedPago(e.target.value)}>{METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}</Select></Field>
                </div>
                <Field label="Dirección / entrega"><Input placeholder="Barrio, ciudad…" value={cliDir} onChange={(e) => setCliDir(e.target.value)} /></Field>
                <div>
                  <p className="text-[13px] font-extrabold uppercase mb-2">Vinos del pedido</p>
                  <div className="flex flex-col gap-2 max-h-64 overflow-auto pr-1">
                    {productos.filter((p) => p.active !== false).map((p) => (
                      <div key={p.id} className="flex items-center gap-2 px-3 py-2" style={{ background: "#fff", border: "2px solid #3d2b1f", borderRadius: "0.8rem" }}>
                        <span className="text-[13px] font-bold flex-1">{p.name}<br /><span className="opacity-60">{formatCOP(precioFinal(p))} · quedan {p.stock}</span></span>
                        <button type="button" className="cursor-pointer px-2 border-2 rounded-md bg-white font-extrabold" style={{ borderColor: "#3d2b1f" }} onClick={() => cambiarCantPedido(p.id, -1)}>−</button>
                        <span className="font-extrabold w-5 text-center">{pedItems[p.id] || 0}</span>
                        <button type="button" className="cursor-pointer px-2 border-2 rounded-md font-extrabold" style={{ borderColor: "#3d2b1f", background: "#f0d48a" }} onClick={() => cambiarCantPedido(p.id, 1)}>+</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Descuento pedido %"><Input type="number" min="0" max="90" value={pedDcto} onChange={(e) => setPedDcto(e.target.value)} /></Field>
                  <Field label="Notas"><Input placeholder="Ej: regalo…" value={pedNotas} onChange={(e) => setPedNotas(e.target.value)} /></Field>
                </div>
                <div className="relieve-hundido p-3 text-sm font-bold">
                  Subtotal: {formatCOP(resumenPedido.subtotal)}<br />
                  <span className="font-tradicion text-xl">Total: {formatCOP(resumenPedido.total)}</span>
                </div>
                <Button type="submit" disabled={guardandoPed}>{guardandoPed ? "Anotando…" : "📋 Guardar pedido"}</Button>
              </form>
            </Card>
            <div className="flex flex-col gap-3">
              <Card className="!p-4">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-sm font-extrabold">Filtrar:</span>
                  {["todos", ...ESTADOS_PEDIDO].map((e) => (
                    <button key={e} onClick={() => setFiltroEstado(e)} className={`etiqueta cursor-pointer ${filtroEstado === e ? "" : "opacity-50"}`} style={{ background: e === "todos" ? "#fff" : COLOR_ESTADO[e] }}>{e}</button>
                  ))}
                </div>
              </Card>
              {pedidosFiltrados.length === 0 ? <Card className="text-center py-8"><p className="font-tradicion text-xl">No hay pedidos aquí todavía 📋</p></Card> :
                pedidosFiltrados.map((o) => (
                  <div key={o.id} className="relieve-suave p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <h3 className="font-tradicion text-lg flex items-center gap-1"><User size={16} /> {o.customer?.name}</h3>
                        <p className="text-xs font-semibold opacity-70 flex flex-col gap-0.5">
                          {o.customer?.phone ? <span className="flex items-center gap-1"><Phone size={12} /> {o.customer.phone}</span> : null}
                          {o.customer?.address ? <span className="flex items-center gap-1"><MapPin size={12} /> {o.customer.address}</span> : null}
                          {o.createdAt?.toDate ? <span>🕒 {o.createdAt.toDate().toLocaleString("es-CO")}</span> : null}
                        </p>
                      </div>
                      <Badge color={COLOR_ESTADO[o.status] || "#fff"}>{o.status}</Badge>
                    </div>
                    <div className="relieve-hundido px-3 py-2 text-[13px] font-semibold">
                      {(o.items || []).map((i, idx) => <div key={idx}>• {i.qty}× {i.name} — {formatCOP(i.unitPrice * i.qty)}</div>)}
                      <div className="mt-1 font-tradicion text-lg">Total: {formatCOP(o.total)} <span className="text-xs font-sans opacity-60">({o.payment})</span></div>
                      {o.notes ? <div className="text-xs opacity-70">📝 {o.notes}</div> : null}
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Select value={o.status} onChange={(e) => onEstadoPedido(o.id, e.target.value)} className="!w-auto !py-1.5 text-[13px]">
                        {ESTADOS_PEDIDO.map((e) => <option key={e} value={e}>{e}</option>)}
                      </Select>
                      <Button variant="crema" className="!py-1.5 !text-[13px]" onClick={() => onBorrarPedido(o.id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {tab === "ventas" && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Coins size={22} color="#fff" />} titulo="Vendido total" valor={formatCOP(ventas.total)} subtitulo={`${ventas.n} pedidos`} color="#7a1e2b" />
            <StatCard icon={<Check size={22} />} titulo="Entregado" valor={formatCOP(ventas.entregado)} subtitulo="plata en mano" color="#bfe6c4" />
            <StatCard icon={<TrendingUp size={22} />} titulo="Hoy" valor={formatCOP(ventas.hoyTotal)} subtitulo="ventas del día" color="#f0d48a" />
            <StatCard icon={<Wine size={22} color="#fff" />} titulo="Botellas" valor={ventas.botellas} subtitulo="vendidas" color="#2e6b4f" />
          </section>
          <Card>
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <h2 className="font-tradicion text-2xl">Cuaderno de ventas</h2>
              <Button variant="dorado" className="!text-[13px]" onClick={exportarCSV}><Download size={14} /> Bajar Excel (CSV)</Button>
            </div>
            {pedidos.length === 0 ? <p className="font-semibold opacity-70">Aún no hay ventas. Anota tu primer pedido en la pestaña 📋.</p> : (
              <div className="overflow-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="text-left text-xs uppercase opacity-60">
                    <th className="py-2">Fecha</th><th>Cliente</th><th>Productos</th><th>Pago</th><th>Estado</th><th className="text-right">Total</th>
                  </tr></thead>
                  <tbody>
                    {pedidos.map((o) => (
                      <tr key={o.id} className="border-t-2" style={{ borderColor: "#eee0c2" }}>
                        <td className="py-2 font-semibold">{o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString("es-CO") : "—"}</td>
                        <td className="font-bold">{o.customer?.name}</td>
                        <td className="opacity-80">{(o.items || []).map((i) => `${i.qty}x ${i.name}`).join(", ")}</td>
                        <td>{o.payment}</td>
                        <td><Badge color={COLOR_ESTADO[o.status] || "#fff"}>{o.status}</Badge></td>
                        <td className="text-right font-tradicion text-lg">{formatCOP(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <footer className="text-center text-xs font-semibold opacity-60 pb-6">
        Hecho a mano en Santa Cruz de Mompox · Panel privado del patrón
      </footer>
    </div>
  );
}
