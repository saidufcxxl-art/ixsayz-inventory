import { ean13Checksum, isValidEAN13, makeEAN13FromSeed } from '../js/barcode.js';
import { deliveryTotals } from '../js/deliveries.js';
import { totalsForProducts, normalizeProduct } from '../js/products.js';
import { productsCsv } from '../js/export.js';

const code = makeEAN13FromSeed(290000000000);
if (!/^\d{13}$/.test(code)) throw new Error('EAN-13 length failed');
if (!isValidEAN13(code)) throw new Error('EAN-13 validation failed');
if (ean13Checksum(code.slice(0, 12)) !== code[12]) throw new Error('EAN-13 checksum failed');

const rows = [
  normalizeProduct({ productName: 'Campus Black', quantity: 12, purchasePrice: 1700, salePrice: 2990, labelQty: 5, barcode: code }),
  normalizeProduct({ productName: 'Campus White', quantity: 3, purchasePrice: 1000, salePrice: 1800, barcode: '2900000000017' })
];
const delivery = deliveryTotals(rows);
if (delivery.totalQuantity !== 15) throw new Error('quantity total failed');
if (delivery.totalPurchase !== 23400) throw new Error('purchase total failed');
if (delivery.totalSale !== 41280) throw new Error('sale total failed');
const dashboard = totalsForProducts(rows);
if (dashboard.profit !== 17880) throw new Error('profit total failed');
if (rows[0].labelQty !== 5) throw new Error('labelQty failed');

const blob = productsCsv([{ ...rows[0], supplierName: 'P1', deliveryNumber: 'D1', stock: 12 }], ';');
const bytes = new Uint8Array(await blob.arrayBuffer());
if (!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)) throw new Error('CSV BOM failed');
const csv = await blob.text();
if (!csv.includes(code) || !csv.includes('=""')) throw new Error('CSV barcode text failed');
console.log('OK: core logic checks passed');
