export function totalsForProducts(products) {
  return products.reduce((acc, p) => { const q = Number(p.quantity || 0); const purchase = Number(p.purchasePrice || 0) * q; const sale = Number(p.salePrice || 0) * q; acc.models += 1; acc.quantity += q; acc.purchase += purchase; acc.sale += sale; acc.profit += sale - purchase; return acc; }, { models: 0, quantity: 0, purchase: 0, sale: 0, profit: 0 });
}
export function normalizeProduct(row) {
  const quantity = Number(row.quantity || 0);
  return { category: row.category || "", productName: row.productName || "", article: row.article || "", size: row.size || "", gender: row.gender || "", purchasePrice: Number(row.purchasePrice || 0), salePrice: Number(row.salePrice || 0), quantity, stock: Number(row.stock ?? quantity), barcode: String(row.barcode || ""), labelQty: Number(row.labelQty || quantity), comment: row.comment || "" };
}
