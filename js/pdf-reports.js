import { money } from "./ui.js";

const page = { w: 210, h: 297, scale: 4, margin: 12 };
function canvasPage() {
  const canvas = document.createElement("canvas");
  canvas.width = page.w * page.scale;
  canvas.height = page.h * page.scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(page.scale, page.scale);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, page.w, page.h);
  ctx.fillStyle = "#111";
  ctx.textBaseline = "top";
  return { canvas, ctx, y: page.margin };
}
function addPageImage(doc, pageState, first) {
  if (!first) doc.addPage("a4", "portrait");
  doc.addImage(pageState.canvas.toDataURL("image/png"), "PNG", 0, 0, page.w, page.h);
}
function text(ctx, value, x, y, size = 9, weight = 400, color = "#111") {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, sans-serif`;
  ctx.fillText(String(value ?? ""), x, y);
}
function clipText(ctx, value, x, y, width, size = 8, weight = 400) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, 7);
  ctx.clip();
  text(ctx, value, x, y, size, weight);
  ctx.restore();
}
function header(ctx, title) {
  text(ctx, "IXSAYZ Inventory", page.margin, 12, 17, 800);
  text(ctx, title, page.margin, 30, 11, 700, "#333");
}
function tableHeader(ctx, y, cols) {
  ctx.fillStyle = "#111";
  ctx.fillRect(page.margin, y, page.w - page.margin * 2, 9);
  cols.forEach((c) => text(ctx, c.label, c.x, y + 2, 6.5, 700, "#fff"));
}
function drawRows(doc, firstPage, title, metaLines, cols, rows, totalsLines) {
  let first = true;
  let p = canvasPage();
  header(p.ctx, title);
  let y = 44;
  metaLines.forEach((line) => { text(p.ctx, line, page.margin, y, 8.5, 500); y += 6; });
  y += 4;
  tableHeader(p.ctx, y, cols); y += 10;
  rows.forEach((row, index) => {
    if (y > 270) { addPageImage(doc, p, first); first = false; p = canvasPage(); header(p.ctx, title); y = 42; tableHeader(p.ctx, y, cols); y += 10; }
    if (index % 2 === 0) { p.ctx.fillStyle = "#f2f2f2"; p.ctx.fillRect(page.margin, y - 1, page.w - page.margin * 2, 8); }
    cols.forEach((c, i) => clipText(p.ctx, row[i], c.x, y, c.width, 6.8));
    y += 8;
  });
  y += 6;
  totalsLines.forEach((line) => { if (y > 276) { addPageImage(doc, p, first); first = false; p = canvasPage(); y = 20; } text(p.ctx, line, page.margin, y, 9, 700); y += 6; });
  addPageImage(doc, p, first);
}
function reportDoc() { const { jsPDF } = window.jspdf; return new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" }); }
export function deliveryReportPdf(delivery, products) {
  const doc = reportDoc();
  const totals = products.reduce((a, p) => { const q = Number(p.quantity || 0); a.q += q; a.buy += Number(p.purchasePrice || 0) * q; a.sale += Number(p.salePrice || 0) * q; return a; }, { q: 0, buy: 0, sale: 0 });
  const cols = [{ label: "№", x: 13, width: 8 }, { label: "Категория", x: 22, width: 24 }, { label: "Название", x: 47, width: 34 }, { label: "Размер", x: 82, width: 14 }, { label: "Пол", x: 97, width: 16 }, { label: "Кол", x: 114, width: 10 }, { label: "Зак", x: 126, width: 16 }, { label: "Прод", x: 143, width: 16 }, { label: "Сум зак", x: 160, width: 18 }, { label: "Сум прод", x: 179, width: 18 }];
  const rows = products.map((p, i) => [i + 1, p.category, p.productName, p.size, p.gender, p.quantity, p.purchasePrice, p.salePrice, Number(p.purchasePrice || 0) * Number(p.quantity || 0), Number(p.salePrice || 0) * Number(p.quantity || 0)]);
  drawRows(doc, null, `Отчет по поставке ${delivery.deliveryNumber || delivery.id}`, [`Поставщик: ${delivery.supplierName || "-"} (${delivery.supplierCode || "-"})`, `Дата: ${delivery.date || "-"}`, `Номер поставки: ${delivery.deliveryNumber || "-"}`], cols, rows, [`Итого единиц: ${totals.q}`, `Итого закупка: ${money(totals.buy)}`, `Итого продажа: ${money(totals.sale)}`, `Итого прибыль: ${money(totals.sale - totals.buy)}`]);
  return doc.output("blob");
}
export function supplierReportPdf(supplier, deliveries, products) {
  const doc = reportDoc();
  const totals = products.reduce((a, p) => { const q = Number(p.quantity || 0); a.q += q; a.buy += Number(p.purchasePrice || 0) * q; a.sale += Number(p.salePrice || 0) * q; return a; }, { q: 0, buy: 0, sale: 0 });
  const cols = [{ label: "Дата", x: 13, width: 28 }, { label: "Номер", x: 43, width: 34 }, { label: "Единиц", x: 80, width: 20 }, { label: "Закупка", x: 104, width: 28 }, { label: "Продажа", x: 136, width: 28 }, { label: "Прибыль", x: 168, width: 28 }];
  const rows = deliveries.map((d) => [d.date, d.deliveryNumber, d.totalQuantity, d.totalPurchase, d.totalSale, d.totalProfit]);
  drawRows(doc, null, `Отчет по поставщику ${supplier.name}`, [`Код: ${supplier.supplierCode || "-"}`, `Поставок: ${deliveries.length}`, `Моделей: ${products.length}`, `Единиц: ${totals.q}`, `Закупка: ${money(totals.buy)} | Продажа: ${money(totals.sale)} | Прибыль: ${money(totals.sale - totals.buy)}`], cols, rows, []);
  return doc.output("blob");
}
export function summaryReportPdf(suppliers, deliveries, products) {
  const doc = reportDoc();
  const cols = [{ label: "Код", x: 13, width: 18 }, { label: "Поставщик", x: 33, width: 52 }, { label: "Моделей", x: 88, width: 18 }, { label: "Единиц", x: 110, width: 18 }, { label: "Закупка", x: 132, width: 24 }, { label: "Продажа", x: 158, width: 24 }, { label: "Прибыль", x: 184, width: 18 }];
  const rows = suppliers.map((s) => { const ps = products.filter((p) => p.supplierId === s.id); const q = ps.reduce((x, p) => x + Number(p.quantity || 0), 0); const buy = ps.reduce((x, p) => x + Number(p.purchasePrice || 0) * Number(p.quantity || 0), 0); const sale = ps.reduce((x, p) => x + Number(p.salePrice || 0) * Number(p.quantity || 0), 0); return [s.supplierCode, s.name, ps.length, q, buy, sale, sale - buy]; });
  const all = products.reduce((a, p) => { const q = Number(p.quantity || 0); a.q += q; a.buy += Number(p.purchasePrice || 0) * q; a.sale += Number(p.salePrice || 0) * q; return a; }, { q: 0, buy: 0, sale: 0 });
  drawRows(doc, null, "Общий отчет", [`Всего поставщиков: ${suppliers.length}`, `Всего поставок: ${deliveries.length}`], cols, rows, [`Общий итог единиц: ${all.q}`, `Общая закупка: ${money(all.buy)}`, `Общая продажа: ${money(all.sale)}`, `Потенциальная прибыль: ${money(all.sale - all.buy)}`]);
  return doc.output("blob");
}
