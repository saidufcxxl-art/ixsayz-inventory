import { db } from "../firebase.js";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const paths = {
  suppliers: (uid) => collection(db, "users", uid, "suppliers"),
  deliveries: (uid) => collection(db, "users", uid, "deliveries"),
  products: (uid) => collection(db, "users", uid, "products"),
  categories: (uid) => collection(db, "users", uid, "categories"),
  settings: (uid) => doc(db, "users", uid, "settings", "main")
};

export function withMeta(uid, data, id = "") {
  return { ...data, id, userId: uid, createdAt: data.createdAt || serverTimestamp(), updatedAt: serverTimestamp() };
}
export function listenCollection(uid, name, cb, onError = console.error) {
  const q = query(paths[name](uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
}
export async function createItem(uid, name, data) {
  const ref = await addDoc(paths[name](uid), withMeta(uid, data));
  await updateDoc(ref, { id: ref.id, updatedAt: serverTimestamp() });
  return ref.id;
}
export async function updateItem(uid, name, id, data) { return updateDoc(doc(db, "users", uid, name, id), { ...data, id, userId: uid, updatedAt: serverTimestamp() }); }
export async function deleteItem(uid, name, id) { return deleteDoc(doc(db, "users", uid, name, id)); }
export async function allItems(uid, name) { const snap = await getDocs(paths[name](uid)); return snap.docs.map((item) => ({ id: item.id, ...item.data() })); }
export async function ensureSettings(uid) { return setDoc(paths.settings(uid), { id: "main", userId: uid, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true }); }

export async function saveDeliveryWithProducts(uid, deliveryId, delivery, rows) {
  const batch = writeBatch(db);
  const deliveryRef = deliveryId ? doc(db, "users", uid, "deliveries", deliveryId) : doc(paths.deliveries(uid));
  const id = deliveryRef.id;
  batch.set(deliveryRef, { ...delivery, id, deliveryId: id, userId: uid, createdAt: delivery.createdAt || serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  if (deliveryId) {
    const old = await getDocs(paths.products(uid));
    old.docs.filter((p) => p.data().deliveryId === deliveryId).forEach((p) => batch.delete(p.ref));
  }
  rows.forEach((row) => {
    const ref = doc(paths.products(uid));
    batch.set(ref, { ...row, id: ref.id, userId: uid, deliveryId: id, deliveryNumber: delivery.deliveryNumber, supplierId: delivery.supplierId, supplierName: delivery.supplierName, supplierCode: delivery.supplierCode, date: delivery.date, stock: Number(row.stock ?? row.quantity ?? 0), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
  await batch.commit();
  return id;
}

