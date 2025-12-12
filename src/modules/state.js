/**
 * VidaExtra® - Módulo de Estado
 * state.js - Estado global da aplicação e referências DOM
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

// =============================================
// ESTADO GLOBAL DA APLICAÇÃO
// =============================================

/**
 * Estado principal da aplicação
 */
export const appState = {
  valoresAC4: [],      // Armazena os valores do JSON
  historico: [],       // Histórico de cálculos
  totalHoras: 0,       // Total de horas acumuladas
  totalValor: 0,       // Total monetário acumulado
  totalPensao: 0,      // Total de descontos de pensão
  carregado: false,    // Flag se os dados foram carregados
};

/**
 * Estado do calendário
 */
export const calendarState = { 
  calendar: null 
};

// =============================================
// REFERÊNCIAS DOM
// =============================================

/**
 * Elementos do DOM referenciados pela aplicação
 * Inicializados como null e populados em initDOMRefs()
 */
export const domRefs = {
  form: null,
  btnLimpar: null,
  btnExportar: null,
  pensaoCheckbox: null,
  pensaoContainer: null,
  resultadoContainer: null,
  resultadoVazio: null,
  resumoAnotacoes: null,
  historicoLista: null,
  historicoVazio: null,
  totalAcumulado: null,
  totalPerdidoPensao: null,
  calendarioEl: null,
};

/**
 * Inicializa as referências DOM
 * Deve ser chamado após o DOM estar pronto
 */
export function initDOMRefs() {
  domRefs.form = document.getElementById("form-calculo");
  domRefs.btnLimpar = document.getElementById("btn-limpar");
  domRefs.btnExportar = document.getElementById("btn-exportar");
  domRefs.pensaoCheckbox = document.getElementById("pensao-alimenticia");
  domRefs.pensaoContainer = document.getElementById("pensao-container");
  domRefs.resultadoContainer = document.getElementById("resultado-container");
  domRefs.resultadoVazio = document.getElementById("resultado-vazio");
  domRefs.resumoAnotacoes = document.getElementById("resumo-anotacoes");
  domRefs.historicoLista = document.getElementById("historico-lista");
  domRefs.historicoVazio = document.getElementById("historico-vazio");
  domRefs.totalAcumulado = document.getElementById("total-acumulado");
  domRefs.totalPerdidoPensao = document.getElementById("total-perdido-pensao");
  domRefs.calendarioEl = document.getElementById("historico-calendario");
}

// =============================================
// DETECÇÃO DE BIBLIOTECAS EXTERNAS
// =============================================

/**
 * Verifica se Luxon está disponível
 */
export function hasLuxon() {
  return (
    typeof window !== "undefined" &&
    window.luxon &&
    window.luxon.DateTime &&
    window.luxon.Interval
  );
}

/**
 * Obtém referências do Luxon se disponível
 */
export function getLuxon() {
  if (hasLuxon()) {
    return window.luxon;
  }
  return { DateTime: null, Interval: null };
}

/**
 * Verifica se FullCalendar está disponível
 */
export function hasFullCalendar() {
  return (
    typeof window !== "undefined" &&
    window.FullCalendar &&
    window.FullCalendar.Calendar
  );
}
