import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

export const ESTADOS_PEDIDO = ["pendiente", "preparando", "enviado", "entregado", "cancelado"];
export const METODOS_PAGO = ["Nequi", "Efectivo", "Transferencia", "Daviplata", "Otro"];

const COLLECTION = "products";

export const CATEGORIAS = [
  "Vino de Corozo",
  "Vino de Mango",
  "Vino de Mamón",
  "Vino de Ciruela",
  "Vino de Maracuyá",
  "Combo Promocional",
  "Otro",
];

export function subscribeProducts(callback, onError) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      // Si no hay índice o createdAt falta en docs viejos, reintentar sin orderBy
      console.warn("onSnapshot con orderBy falló, reintentando simple:", err?.message);
      const fallback = onSnapshot(
        collection(db, COLLECTION),
        (snap2) => callback(snap2.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (e2) => onError && onError(e2)
      );
      return fallback;
    }
  );
}

export async function createProduct(data) {
  const payload = {
    name: String(data.name || "").trim(),
    category: data.category || "Vino de Corozo",
    price: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    description: String(data.description || "").trim(),
    imageUrl: String(data.imageUrl || "").trim(),
    discount: Math.min(90, Math.max(0, Number(data.discount) || 0)),
    type: data.type === "combo" ? "combo" : "sencillo",
    comboItems: Array.isArray(data.comboItems) ? data.comboItems : [],
    active: data.active !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (!payload.name) throw new Error("El producto necesita un nombre.");
  if (payload.price < 0) throw new Error("El precio no puede ser negativo.");
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateProduct(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function changeStock(id, delta) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { stock: increment(delta), updatedAt: serverTimestamp() });
}

export async function setPrice(id, price) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { price: Number(price) || 0, updatedAt: serverTimestamp() });
}

export async function setDiscount(id, discount) {
  const clamped = Math.min(90, Math.max(0, Number(discount) || 0));
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { discount: clamped, updatedAt: serverTimestamp() });
}

export async function toggleActive(id, active) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { active, updatedAt: serverTimestamp() });
}

// ---------- PEDIDOS / VENTAS ----------
const ORDERS = "orders";

export function subscribeOrders(callback, onError) {
  // Sin orderBy para no exigir índice; ordenamos en el cliente
  return onSnapshot(
    collection(db, ORDERS),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
      callback(items);
    },
    (e) => onError && onError(e)
  );
}

export async function createOrder({ customer, items, payment, notes, discount = 0 }) {
  const limpios = (items || [])
    .filter((i) => i.productId && (Number(i.qty) || 0) > 0)
    .map((i) => ({
      productId: i.productId,
      name: String(i.name || ""),
      qty: Number(i.qty),
      unitPrice: Number(i.unitPrice) || 0,
    }));
  if (limpios.length === 0) throw new Error("El pedido necesita al menos 1 producto.");
  if (!customer?.name?.trim()) throw new Error("Pon el nombre del cliente.");

  const subtotal = limpios.reduce((a, i) => a + i.qty * i.unitPrice, 0);
  const total = Math.round(subtotal * (1 - Math.min(90, Math.max(0, Number(discount) || 0)) / 100));

  const batch = writeBatch(db);
  const orderRef = doc(collection(db, ORDERS));
  batch.set(orderRef, {
    customer: {
      name: customer.name.trim(),
      phone: String(customer.phone || "").trim(),
      address: String(customer.address || "").trim(),
    },
    items: limpios,
    subtotal,
    discount: Number(discount) || 0,
    total,
    payment: payment || "Nequi",
    notes: String(notes || "").trim(),
    status: "pendiente",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  // Descuenta stock de cada producto
  for (const i of limpios) {
    batch.update(doc(db, COLLECTION, i.productId), {
      stock: increment(-i.qty),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return orderRef.id;
}

export async function setOrderStatus(id, status) {
  await updateDoc(doc(db, ORDERS, id), { status, updatedAt: serverTimestamp() });
}

export async function deleteOrder(id) {
  await deleteDoc(doc(db, ORDERS, id));
}
