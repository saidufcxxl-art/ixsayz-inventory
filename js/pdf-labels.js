function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
}
function makeBarcodeCanvas(code) {
  const canvas = document.createElement("canvas");
  if (window.JsBarcode) window.JsBarcode(canvas, code, { format: "EAN13", width: 2, height: 48, displayValue: false, margin: 0 });
  return canvas;
}
function makeLabelImage(product) {
  const canvas = document.createElement("canvas");
  canvas.width = 430;
  canvas.height = 250;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.font = "700 24px Arial, sans-serif";
  drawWrapped(ctx, product.productName || "Товар", 18, 32, 394, 25, 2);
  ctx.font = "800 34px Arial, sans-serif";
  ctx.fillText(`${Number(product.salePrice || 0).toLocaleString("ru-RU")} ₽`, 18, 105);
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText(`Размер: ${product.size || "-"}`, 282, 102);
  const barcode = makeBarcodeCanvas(product.barcode);
  if (barcode.width) ctx.drawImage(barcode, 30, 122, 370, 72);
  ctx.font = "20px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(product.barcode || ""), 215, 226);
  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}
export function makeLabelsPdf(products) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [43, 25] });
  let first = true;
  products.forEach((product) => {
    const count = Math.max(1, Number(product.labelQty || product.quantity || 1));
    const image = makeLabelImage(product);
    for (let i = 0; i < count; i += 1) {
      if (!first) doc.addPage([43, 25], "landscape");
      first = false;
      doc.addImage(image, "PNG", 0, 0, 43, 25);
    }
  });
  return doc.output("blob");
}
