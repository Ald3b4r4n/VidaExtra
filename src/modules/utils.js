/**
 * VidaExtra® - Módulo de Utilitários
 * utils.js - Funções auxiliares reutilizáveis
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

/**
 * Formata um valor numérico como moeda brasileira (R$)
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda
 */
export function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Formata um objeto Date para string no formato brasileiro (DD/MM/AAAA)
 * @param {Date} data - Data a ser formatada
 * @returns {string} Data formatada
 */
export function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Escapa caracteres HTML para evitar injeção
 * @param {string} str - String a ser escapada
 * @returns {string} String escapada
 */
export function escaparHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converte data no formato brasileiro (DD/MM/AAAA) para milissegundos
 * @param {string} dataStr - Data no formato DD/MM/AAAA
 * @returns {number} Timestamp em milissegundos
 */
export function obterMillisDeDataBR(dataStr) {
  const [dia, mes, ano] = dataStr.split("/").map(Number);
  return new Date(ano, mes - 1, dia).getTime();
}

/**
 * Obtém a chave de data no formato YYYY-MM-DD
 * @param {Date} date - Objeto Date
 * @returns {string} Data no formato YYYY-MM-DD
 */
export function getDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Formata hora para busca no JSON de valores AC-4
 * @param {string} hora - Hora no formato HH:MM
 * @returns {string} Hora formatada para busca (ex: "08h" ou "08h30m")
 */
export function formatarParaBusca(hora) {
  const [h, m] = hora.split(":");
  const horaFormatada = h.padStart(2, "0");
  return m === "00" ? `${horaFormatada}h` : `${horaFormatada}h${m}m`;
}

/**
 * Verifica se o dispositivo suporta hover
 * @returns {boolean} True se suporta hover
 */
export function isHoverCapable() {
  try {
    return window.matchMedia && window.matchMedia("(hover: hover)").matches;
  } catch {
    return true;
  }
}
