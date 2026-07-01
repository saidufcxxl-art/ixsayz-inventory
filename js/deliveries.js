export function deliveryTotals(rows) {
  return rows.reduce((acc, item) => { const q = Number(item.quantity || 0); const purchase = Number(item.purchasePrice || 0) * q; const sale = Number(item.salePrice || 0) * q; acc.totalQuantity += q; acc.totalPurchase += purchase; acc.totalSale += sale; acc.totalProfit += sale - purchase; return acc; }, { totalQuantity: 0, totalPurchase: 0, totalSale: 0, totalProfit: 0 });
}
