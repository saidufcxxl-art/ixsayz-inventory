export const money = (value) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(Number(value || 0));
export const num = (value) => Number(value || 0);
export function toast(message) { const el = document.querySelector("#toast"); el.textContent = message; el.classList.add("show"); setTimeout(() => el.classList.remove("show"), 2600); }
export function openModal(title, html) { document.querySelector("#modalTitle").textContent = title; document.querySelector("#modalBody").innerHTML = html; document.querySelector("#modal").showModal(); }
export function closeModal() { document.querySelector("#modal").close(); }
export function downloadBlob(blob, fileName) { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = fileName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function shareOrDownload(blob, fileName, title = "IXSAYZ Inventory") { const file = new File([blob], fileName, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ title, files: [file] }); } else { downloadBlob(blob, fileName); } }
export function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s])); }
