export function supplierStats(supplier, deliveries, products) {
  const supplierDeliveries = deliveries.filter((d) => d.supplierId === supplier.id);
  const supplierProducts = products.filter((p) => p.supplierId === supplier.id);
  const quantity = supplierProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const purchase = supplierProducts.reduce((sum, p) => sum + Number(p.purchasePrice || 0) * Number(p.quantity || 0), 0);
  const sale = supplierProducts.reduce((sum, p) => sum + Number(p.salePrice || 0) * Number(p.quantity || 0), 0);
  return { deliveries: supplierDeliveries.length, models: supplierProducts.length, quantity, purchase, sale, profit: sale - purchase };
}
