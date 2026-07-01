import { hasFirebaseConfig } from "./firebase.js";
import { allItems, createItem, deleteItem, ensureSettings, listenCollection, updateItem } from "./js/db.js";
import { generateUniqueEAN13, isValidEAN13 } from "./js/barcode.js";
import { deliveryTotals } from "./js/deliveries.js";
import { normalizeProduct, totalsForProducts } from "./js/products.js";
import { makeLabelsPdf } from "./js/pdf-labels.js";
import { deliveryReportPdf, supplierReportPdf, summaryReportPdf } from "./js/pdf-reports.js";
import { productsCsv, productsXlsx } from "./js/export.js";
import { closeModal, downloadBlob, escapeHtml, money, openModal, shareOrDownload, toast } from "./js/ui.js";

const PUBLIC_UID = "public";
const state = {
  user: { uid: PUBLIC_UID },
  view: "deliveries",
  selectedDeliveryId: "",
  selectedSupplierId: "",
  suppliers: [],
  deliveries: [],
  products: [],
  unsub: []
};
const $ = (sel) => document.querySelector(sel);
const root = $("#viewRoot");
const title = $("#viewTitle");

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => state.user.uid;
const byDate = (items) => [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
const delivery = () => state.deliveries.find((item) => item.id === state.selectedDeliveryId);
const supplier = () => state.suppliers.find((item) => item.id === state.selectedSupplierId);
const deliveryProducts = (id) => state.products.filter((p) => p.deliveryId === id);
const deliverySuppliers = (id) => state.suppliers.filter((s) => s.deliveryId === id || state.products.some((p) => p.deliveryId === id && p.supplierId === s.id));
const supplierProducts = (id) => state.products.filter((p) => p.supplierId === id);
const optionList = (items, labelFn) => items.map((item) => `<option value="${item.id}">${escapeHtml(labelFn(item))}</option>`).join("");

function setView(view, data = {}) {
  state.view = view;
  if (data.deliveryId !== undefined) state.selectedDeliveryId = data.deliveryId;
  if (data.supplierId !== undefined) state.selectedSupplierId = data.supplierId;
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  render();
}

function showFirebaseError(err) {
  console.error(err);
  const code = err?.code || "";
  const raw = err?.message || String(err || "");
  const message = code.includes("permission") || raw.includes("permission") || raw.includes("403")
    ? "Firebase не разрешает сохранить. Проверь Cloud Firestore Rules и нажми Publish."
    : `Ошибка сохранения: ${raw}`;
  toast(message);
  const modalBody = document.querySelector("#modalBody");
  if (modalBody && document.querySelector("#modal")?.open) {
    modalBody.querySelector(".firebase-error")?.remove();
    modalBody.insertAdjacentHTML("afterbegin", `<section class="firebase-error">${escapeHtml(message)}</section>`);
  }
  const rootEl = document.querySelector("#viewRoot");
  if (rootEl && !rootEl.querySelector(".firebase-error")) {
    rootEl.insertAdjacentHTML("afterbegin", `<section class="firebase-error">${escapeHtml(message)}</section>`);
  }
}

function subscribe() {
  state.unsub.forEach((fn) => fn());
  state.unsub = [];
  state.unsub.push(listenCollection(uid(), "suppliers", (items) => { state.suppliers = items; render(); }, showFirebaseError));
  state.unsub.push(listenCollection(uid(), "deliveries", (items) => { state.deliveries = items; render(); }, showFirebaseError));
  state.unsub.push(listenCollection(uid(), "products", (items) => { state.products = items; render(); }, showFirebaseError));
  ensureSettings(uid());
}

function render() {
  const names = { dashboard: "Главная", deliveries: "Завозы", delivery: "Завоз", supplier: "Поставщик", products: "Товары", labels: "Печать", reports: "Отчеты", export: "Экспорт" };
  title.textContent = names[state.view] || "IXSAYZ";
  const map = { dashboard: renderDashboard, deliveries: renderDeliveries, delivery: renderDeliveryDetail, supplier: renderSupplierDetail, products: renderProducts, labels: renderLabels, reports: renderReports, export: renderExport };
  (map[state.view] || renderDeliveries)();
}

function statsBlock(products) {
  const s = totalsForProducts(products);
  return `<section class="metric-grid compact">${metric("Моделей", s.models)}${metric("Единиц", s.quantity)}${metric("Закупка", money(s.purchase))}${metric("Продажа", money(s.sale))}${metric("Прибыль", money(s.profit))}</section>`;
}
function metric(label, value) { return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`; }
function backButton(action = "deliveries") { return `<button class="text-btn" data-go="${action}" type="button">← Назад</button>`; }

function renderDashboard() {
  const all = totalsForProducts(state.products);
  root.innerHTML = `${statsBlock(state.products)}<section class="action-grid single"><button class="primary-btn" data-action="delivery-new">Создать завоз</button><button class="ghost-btn" data-go="products">Все товары</button><button class="ghost-btn" data-go="labels">Печать ценников</button><button class="ghost-btn" data-go="reports">Отчеты</button><button class="ghost-btn" data-go="export">Экспорт</button></section><section class="panel"><h3>Итог склада</h3><p class="muted">${state.deliveries.length} завозов · ${state.suppliers.length} поставщиков · ${all.quantity} единиц</p></section>`;
}

function renderDeliveries() {
  root.innerHTML = `<section class="toolbar"><button class="primary-btn" data-action="delivery-new">Создать завоз</button></section><section class="list-stack">${byDate(state.deliveries).map(deliveryCard).join("") || `<p class="empty">Создай первый завоз. Потом внутри него добавишь поставщика и товары.</p>`}</section>`;
}
function deliveryCard(d) {
  const products = deliveryProducts(d.id);
  const total = totalsForProducts(products);
  const suppliers = deliverySuppliers(d.id);
  return `<article class="list-card tap-card" data-action="delivery-open" data-id="${d.id}"><b>${escapeHtml(d.deliveryNumber || "Завоз")}</b><span>${escapeHtml(d.date || "")} · ${suppliers.length} поставщиков · ${total.models} моделей</span><span>${money(total.purchase)} → ${money(total.sale)} · прибыль ${money(total.profit)}</span><div class="card-actions"><button data-action="delivery-open" data-id="${d.id}">Открыть</button><button data-action="delivery-edit" data-id="${d.id}">Изменить</button><button data-action="delivery-delete" data-id="${d.id}">Удалить</button></div></article>`;
}
function deliveryForm(d = {}) {
  openModal(d.id ? "Изменить завоз" : "Новый завоз", `<form id="deliveryForm" class="form-grid"><input type="hidden" name="id" value="${d.id || ""}"><label>Название / номер завоза<input name="deliveryNumber" required value="${escapeHtml(d.deliveryNumber || `Завоз ${state.deliveries.length + 1}`)}"></label><label>Дата<input name="date" type="date" required value="${d.date || today()}"></label><label>Заметка<textarea name="comment" placeholder="Необязательно">${escapeHtml(d.comment || "")}</textarea></label><button class="primary-btn" type="submit">Сохранить завоз</button></form>`);
}
function setSaving(form, saving) {
  const button = form.querySelector("button[type=submit]");
  if (!button) return;
  button.disabled = saving;
  button.textContent = saving ? "Сохраняю..." : (button.dataset.originalText || button.textContent);
}

async function saveDelivery(form) {
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  const currentProducts = id ? deliveryProducts(id) : [];
  const totals = deliveryTotals(currentProducts);
  const payload = { deliveryNumber: data.deliveryNumber, date: data.date, comment: data.comment || "", ...totals };
  if (id) await updateItem(uid(), "deliveries", id, payload);
  else state.selectedDeliveryId = await createItem(uid(), "deliveries", payload);
  closeModal();
  toast("Завоз сохранен");
  setView("delivery", { deliveryId: id || state.selectedDeliveryId });
}

function renderDeliveryDetail() {
  const d = delivery();
  if (!d) return renderDeliveries();
  const suppliers = deliverySuppliers(d.id);
  root.innerHTML = `<section class="screen-head">${backButton("deliveries")}<button class="text-btn" data-action="delivery-edit" data-id="${d.id}">Изменить</button></section><section class="panel hero-panel"><span class="eyebrow">${escapeHtml(d.date || "")}</span><h3>${escapeHtml(d.deliveryNumber || "Завоз")}</h3><p class="muted">${escapeHtml(d.comment || "Добавь поставщика, затем товары внутри поставщика.")}</p></section>${statsBlock(deliveryProducts(d.id))}<section class="toolbar"><h3>Поставщики в завозе</h3><button class="primary-btn" data-action="supplier-new" data-delivery-id="${d.id}">Добавить</button></section><section class="list-stack">${suppliers.map(supplierCard).join("") || `<p class="empty">Поставщиков пока нет. Нажми “Добавить”.</p>`}</section>`;
}
function supplierCard(s) {
  const products = supplierProducts(s.id);
  const total = totalsForProducts(products);
  return `<article class="list-card tap-card" data-action="supplier-open" data-id="${s.id}"><b>${escapeHtml(s.name)}</b><span>${total.models} моделей · ${total.quantity} единиц</span><span>${money(total.purchase)} → ${money(total.sale)}</span><div class="card-actions"><button data-action="supplier-open" data-id="${s.id}">Открыть</button><button data-action="supplier-edit" data-id="${s.id}">Имя</button><button data-action="supplier-delete" data-id="${s.id}">Удалить</button></div></article>`;
}
function supplierForm(s = {}, deliveryId = state.selectedDeliveryId) {
  openModal(s.id ? "Имя поставщика" : "Новый поставщик", `<form id="supplierForm" class="form-grid"><input type="hidden" name="id" value="${s.id || ""}"><input type="hidden" name="deliveryId" value="${deliveryId || s.deliveryId || ""}"><label>Имя / название поставщика<input name="name" required value="${escapeHtml(s.name || "")}" placeholder="Например: Али, P1, Садовод"></label><button class="primary-btn" type="submit">Сохранить</button></form>`);
}
async function saveSupplier(form) {
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  const deliveryId = data.deliveryId || state.selectedDeliveryId;
  const payload = { name: data.name, supplierCode: data.name, deliveryId, phone: "", comment: "" };
  if (id) await updateItem(uid(), "suppliers", id, payload);
  else state.selectedSupplierId = await createItem(uid(), "suppliers", payload);
  closeModal();
  toast("Поставщик сохранен");
  setView(id ? "delivery" : "supplier", { deliveryId, supplierId: id || state.selectedSupplierId });
}

function renderSupplierDetail() {
  const s = supplier();
  if (!s) return renderDeliveryDetail();
  const d = state.deliveries.find((item) => item.id === (s.deliveryId || state.selectedDeliveryId));
  const products = supplierProducts(s.id);
  root.innerHTML = `<section class="screen-head">${backButton("delivery")}<button class="text-btn" data-action="supplier-edit" data-id="${s.id}">Имя</button></section><section class="panel hero-panel"><span class="eyebrow">${escapeHtml(d?.deliveryNumber || "Завоз")}</span><h3>${escapeHtml(s.name)}</h3><p class="muted">Добавляй товары этого поставщика. Штрихкод создается сам, если поле пустое.</p></section>${statsBlock(products)}<section class="toolbar"><h3>Товары</h3><button class="primary-btn" data-action="product-new" data-supplier-id="${s.id}">Добавить</button></section><section class="table-cards">${products.map(productLine).join("") || `<p class="empty">Товаров пока нет.</p>`}</section>`;
}
function productLine(p) {
  return `<article class="product-line"><div><b>${escapeHtml(p.productName)}</b><span>${escapeHtml(p.category || "Кроссовки")} · ${escapeHtml(p.gender || "-")} · размер ${escapeHtml(p.size || "-")}</span><code>${escapeHtml(p.barcode || "")}</code></div><div class="line-numbers"><span>${p.quantity} шт</span><b>${money(p.salePrice)}</b></div><div class="line-actions"><button data-action="product-edit" data-id="${p.id}">Изм.</button><button data-action="product-delete" data-id="${p.id}">Удал.</button></div></article>`;
}
function productForm(p = {}, supplierId = state.selectedSupplierId) {
  openModal(p.id ? "Изменить товар" : "Новый товар", `<form id="productForm" class="form-grid"><input type="hidden" name="id" value="${p.id || ""}"><input type="hidden" name="supplierId" value="${supplierId || p.supplierId || ""}"><label>Название товара / бренд<input name="productName" required value="${escapeHtml(p.productName || "")}" placeholder="Например: Nike Air Max Black"></label><div class="two-col"><label>Категория<select name="category"><option ${(!p.category || p.category === "Кроссовки") ? "selected" : ""}>Кроссовки</option><option ${p.category === "Обувь" ? "selected" : ""}>Обувь</option><option ${p.category === "Одежда" ? "selected" : ""}>Одежда</option><option ${p.category === "Аксессуар" ? "selected" : ""}>Аксессуар</option></select></label><label>Пол<select name="gender"><option ${(!p.gender || p.gender === "Мужской") ? "selected" : ""}>Мужской</option><option ${p.gender === "Женский" ? "selected" : ""}>Женский</option><option ${p.gender === "Унисекс" ? "selected" : ""}>Унисекс</option><option ${p.gender === "Детский" ? "selected" : ""}>Детский</option></select></label></div><div class="two-col"><label>Размер<input name="size" required value="${escapeHtml(p.size || "")}" inputmode="decimal"></label><label>Количество<input name="quantity" type="number" min="1" step="1" value="${p.quantity || 1}"></label></div><div class="two-col"><label>Закупка<input name="purchasePrice" type="number" min="0" step="1" value="${p.purchasePrice || 0}"></label><label>Продажа<input name="salePrice" type="number" min="0" step="1" value="${p.salePrice || 0}"></label></div><div class="two-col"><label>Ценников<input name="labelQty" type="number" min="1" step="1" value="${p.labelQty || p.quantity || 1}"></label><label>Штрихкод<input name="barcode" inputmode="numeric" value="${escapeHtml(p.barcode || "")}" placeholder="Авто"></label></div><button class="primary-btn" type="submit">Сохранить товар</button></form>`);
}
async function updateDeliveryTotals(deliveryId) {
  if (!deliveryId) return;
  const freshProducts = await allItems(uid(), "products");
  const products = freshProducts.filter((p) => p.deliveryId === deliveryId);
  const totals = deliveryTotals(products);
  await updateItem(uid(), "deliveries", deliveryId, totals);
}
async function saveProduct(form) {
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  const s = state.suppliers.find((item) => item.id === (data.supplierId || state.selectedSupplierId));
  if (!s) return toast("Открой поставщика");
  const d = state.deliveries.find((item) => item.id === (s.deliveryId || state.selectedDeliveryId));
  const existing = (await allItems(uid(), "products")).map((p) => p.barcode);
  const product = normalizeProduct({ ...data, article: "", comment: "" });
  if (!product.barcode) product.barcode = await generateUniqueEAN13(existing);
  if (!isValidEAN13(product.barcode)) return toast("Штрихкод должен быть EAN-13");
  product.labelQty = Number(product.labelQty || product.quantity);
  product.stock = Number(product.stock ?? product.quantity);
  const payload = { ...product, supplierId: s.id, supplierName: s.name, supplierCode: s.supplierCode || s.name, deliveryId: d?.id || "", deliveryNumber: d?.deliveryNumber || "", date: d?.date || "" };
  if (id) await updateItem(uid(), "products", id, payload);
  else await createItem(uid(), "products", payload);
  closeModal();
  toast("Товар сохранен");
  await updateDeliveryTotals(d?.id);
  setView("supplier", { deliveryId: d?.id || state.selectedDeliveryId, supplierId: s.id });
}

function renderProducts() {
  const cats = [...new Set(state.products.map((p) => p.category).filter(Boolean))];
  root.innerHTML = `<section class="filters"><input data-filter="q" placeholder="Поиск: название или штрихкод"><select data-filter="category"><option value="">Все категории</option>${cats.map((c) => `<option>${escapeHtml(c)}</option>`).join("")}</select></section><section id="productsList" class="list-stack"></section>`;
  filterProducts();
}
function filterProducts() {
  const q = (document.querySelector('[data-filter="q"]')?.value || "").toLowerCase();
  const category = (document.querySelector('[data-filter="category"]')?.value || "").toLowerCase();
  const items = state.products.filter((p) => (!q || `${p.productName} ${p.barcode}`.toLowerCase().includes(q)) && (!category || String(p.category).toLowerCase() === category));
  $("#productsList").innerHTML = items.map((p) => `<article class="list-card"><b>${escapeHtml(p.productName)}</b><span>${escapeHtml(p.supplierName || "-")} · ${escapeHtml(p.deliveryNumber || "-")}</span><span>${escapeHtml(p.category || "-")} · ${escapeHtml(p.gender || "-")} · размер ${escapeHtml(p.size || "-")}</span><span>${p.quantity} шт · ${money(p.purchasePrice)} → ${money(p.salePrice)}</span><code>${escapeHtml(p.barcode)}</code></article>`).join("") || `<p class="empty">Товары не найдены.</p>`;
}

function renderLabels() {
  root.innerHTML = `<section class="panel"><label>Завоз<select id="labelDelivery"><option value="">Все завозы</option>${optionList(state.deliveries, (d) => d.deliveryNumber || "Завоз")}</select></label><label>Поставщик<select id="labelSupplier"><option value="">Все поставщики</option>${optionList(state.suppliers, (s) => s.name)}</select></label><button class="primary-btn" data-action="labels-make">Создать PDF ценников</button></section><section class="list-stack">${state.products.map((p) => `<label class="pick-card"><input type="checkbox" data-pick-product value="${p.id}"> <span>${escapeHtml(p.productName)} · ${escapeHtml(p.barcode)} · ${p.labelQty || p.quantity} шт.</span></label>`).join("") || `<p class="empty">Нет товаров для печати.</p>`}</section>`;
}
function renderReports() {
  root.innerHTML = `<section class="panel"><label>Отчет по завозу<select id="reportDelivery"><option value="">Выберите</option>${optionList(state.deliveries, (d) => d.deliveryNumber || "Завоз")}</select></label><button class="primary-btn" data-action="report-delivery">PDF по завозу</button></section><section class="panel"><label>Отчет по поставщику<select id="reportSupplier"><option value="">Выберите</option>${optionList(state.suppliers, (s) => s.name)}</select></label><button class="primary-btn" data-action="report-supplier">PDF по поставщику</button></section><section class="panel"><button class="ghost-btn" data-action="report-summary">Общий отчет PDF</button></section><section class="panel"><button class="ghost-btn" data-go="export">Экспорт в кассу</button></section>`;
}
function renderExport() {
  root.innerHTML = `<section class="panel"><label>Что экспортировать<select id="exportScope"><option value="all">Все товары</option><option value="delivery">Один завоз</option><option value="supplier">Одного поставщика</option><option value="selected">Выбранные товары</option></select></label><label>Завоз<select id="exportDelivery"><option value="">Выберите</option>${optionList(state.deliveries, (d) => d.deliveryNumber || "Завоз")}</select></label><label>Поставщик<select id="exportSupplier"><option value="">Выберите</option>${optionList(state.suppliers, (s) => s.name)}</select></label><label>Формат<select id="exportFormat"><option value="semicolon">CSV ;</option><option value="comma">CSV ,</option><option value="xlsx">XLSX</option></select></label><button class="primary-btn" data-action="export-make">Скачать</button></section><section class="list-stack">${state.products.map((p) => `<label class="pick-card"><input type="checkbox" data-pick-product value="${p.id}"> <span>${escapeHtml(p.productName)} · ${escapeHtml(p.barcode)}</span></label>`).join("")}</section>`;
}
function selectProductsByScope(scope, id) {
  if (scope === "delivery") return state.products.filter((p) => p.deliveryId === id);
  if (scope === "supplier") return state.products.filter((p) => p.supplierId === id);
  if (scope === "selected") return [...document.querySelectorAll("[data-pick-product]:checked")].map((c) => state.products.find((p) => p.id === c.value)).filter(Boolean);
  return state.products;
}

async function deleteDelivery(id) {
  if (!confirm("Удалить завоз со всеми поставщиками и товарами?")) return;
  for (const p of state.products.filter((p) => p.deliveryId === id)) await deleteItem(uid(), "products", p.id);
  for (const s of state.suppliers.filter((s) => s.deliveryId === id)) await deleteItem(uid(), "suppliers", s.id);
  await deleteItem(uid(), "deliveries", id);
  toast("Завоз удален");
  setView("deliveries", { deliveryId: "", supplierId: "" });
}
async function deleteSupplier(id) {
  if (!confirm("Удалить поставщика и его товары?")) return;
  const s = state.suppliers.find((item) => item.id === id);
  for (const p of state.products.filter((p) => p.supplierId === id)) await deleteItem(uid(), "products", p.id);
  await deleteItem(uid(), "suppliers", id);
  await updateDeliveryTotals(s?.deliveryId);
  toast("Поставщик удален");
  setView("delivery", { deliveryId: s?.deliveryId || state.selectedDeliveryId, supplierId: "" });
}
async function deleteProduct(id) {
  if (!confirm("Удалить товар?")) return;
  const p = state.products.find((item) => item.id === id);
  await deleteItem(uid(), "products", id);
  await updateDeliveryTotals(p?.deliveryId);
  toast("Товар удален");
}

async function handleAction(action, id, target) {
  if (action === "delivery-new") deliveryForm();
  if (action === "delivery-open") setView("delivery", { deliveryId: id, supplierId: "" });
  if (action === "delivery-edit") deliveryForm(state.deliveries.find((d) => d.id === id));
  if (action === "delivery-delete") await deleteDelivery(id);
  if (action === "supplier-new") supplierForm({}, target.dataset.deliveryId || state.selectedDeliveryId);
  if (action === "supplier-open") { const s = state.suppliers.find((item) => item.id === id); setView("supplier", { deliveryId: s?.deliveryId || state.selectedDeliveryId, supplierId: id }); }
  if (action === "supplier-edit") supplierForm(state.suppliers.find((s) => s.id === id));
  if (action === "supplier-delete") await deleteSupplier(id);
  if (action === "product-new") productForm({}, target.dataset.supplierId || state.selectedSupplierId);
  if (action === "product-edit") productForm(state.products.find((p) => p.id === id));
  if (action === "product-delete") await deleteProduct(id);
  if (action === "labels-make") { let items = state.products; const deliveryId = $("#labelDelivery").value; const supplierId = $("#labelSupplier").value; const picked = [...document.querySelectorAll("[data-pick-product]:checked")].map((c) => c.value); if (deliveryId) items = items.filter((p) => p.deliveryId === deliveryId); if (supplierId) items = items.filter((p) => p.supplierId === supplierId); if (picked.length) items = items.filter((p) => picked.includes(p.id)); if (!items.length) return toast("Нет товаров для PDF"); await shareOrDownload(makeLabelsPdf(items), "ixsayz-labels.pdf"); }
  if (action === "report-delivery") { const d = state.deliveries.find((x) => x.id === $("#reportDelivery").value); if (!d) return toast("Выберите завоз"); downloadBlob(deliveryReportPdf(d, deliveryProducts(d.id)), `delivery-${d.deliveryNumber || d.id}.pdf`); }
  if (action === "report-supplier") { const s = state.suppliers.find((x) => x.id === $("#reportSupplier").value); if (!s) return toast("Выберите поставщика"); downloadBlob(supplierReportPdf(s, state.deliveries.filter((d) => d.id === s.deliveryId), supplierProducts(s.id)), `supplier-${s.name || s.id}.pdf`); }
  if (action === "report-summary") downloadBlob(summaryReportPdf(state.suppliers, state.deliveries, state.products), "ixsayz-summary.pdf");
  if (action === "export-make") { const scope = $("#exportScope").value; const idValue = scope === "delivery" ? $("#exportDelivery").value : scope === "supplier" ? $("#exportSupplier").value : ""; const items = selectProductsByScope(scope, idValue); if (!items.length) return toast("Нет товаров для экспорта"); const fmt = $("#exportFormat").value; if (fmt === "xlsx") downloadBlob(productsXlsx(items), "ixsayz-products.xlsx"); else downloadBlob(productsCsv(items, fmt === "comma" ? "," : ";"), "ixsayz-products.csv"); }
}

document.addEventListener("click", async (e) => {
  const go = e.target.closest("[data-go]");
  if (go) setView(go.dataset.go);
  const actionEl = e.target.closest("[data-action]");
  if (actionEl) { try { await handleAction(actionEl.dataset.action, actionEl.dataset.id, actionEl); } catch (err) { showFirebaseError(err); } }
});
document.addEventListener("input", (e) => {
  if (e.target.matches("[data-filter]")) filterProducts();
  if (e.target.name === "quantity") {
    const form = e.target.closest("form");
    const labelQty = form?.querySelector('[name="labelQty"]');
    if (labelQty && (!labelQty.value || Number(labelQty.value) < 1)) labelQty.value = e.target.value;
  }
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector("button[type=submit]");
  if (button && !button.dataset.originalText) button.dataset.originalText = button.textContent;
  form.querySelector(".firebase-error")?.remove();
  setSaving(form, true);
  try {
    if (form.id === "deliveryForm") await saveDelivery(form);
    if (form.id === "supplierForm") await saveSupplier(form);
    if (form.id === "productForm") await saveProduct(form);
  } catch (err) {
    showFirebaseError(err);
  } finally {
    setSaving(form, false);
  }
});
$("#logoutBtn").addEventListener("click", () => window.location.reload());
$("#modalClose").addEventListener("click", closeModal);
document.querySelectorAll(".nav-btn").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));

if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  navigator.serviceWorker.register("./sw.js").then((reg) => reg.update()).catch(() => {});
}
if (!hasFirebaseConfig) {
  $("#authMessage").textContent = "Вставьте Firebase config в firebase.js, затем обновите страницу.";
} else {
  $("#authScreen").classList.add("hidden");
  $("#mainApp").classList.remove("hidden");
  subscribe();
  render();
}





