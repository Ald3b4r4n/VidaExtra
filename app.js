/**
 * VidaExtra® - Calculadora AC-4
 * app.js - Ponto de entrada e inicialização da aplicação
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 * 
 * Este arquivo serve como orquestrador dos módulos da aplicação.
 * A lógica de negócios está distribuída nos seguintes módulos:
 * 
 * - state.js      → Estado global e referências DOM
 * - utils.js      → Funções utilitárias (formatação, validação)
 * - sounds.js     → Efeitos sonoros
 * - calendar.js   → Integração com FullCalendar
 * - history.js    → CRUD do histórico e persistência
 * - calculator.js → Lógica de cálculo de horas extras
 * - pdf-export.js → Exportação para PDF
 */

// =============================================
// IMPORTS DOS MÓDULOS
// =============================================

import { initDOMRefs, domRefs } from './src/modules/state.js';
import { initCalendar, setupCalendarTabObserver } from './src/modules/calendar.js';
import { carregarDados } from './src/modules/history.js';
import { calcularHoras, carregarValoresAC4, limparTudo } from './src/modules/calculator.js';
import { exportarPDF } from './src/modules/pdf-export.js';

// =============================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================

document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 VidaExtra® - Iniciando aplicação...");
  
  // 1. Inicializa referências DOM
  initDOMRefs();
  console.log("✅ Referências DOM inicializadas");

  // 2. Carrega valores AC-4 do JSON
  await carregarValoresAC4();
  console.log("✅ Valores AC-4 carregados");

  // 3. Configura event listeners
  setupEventListeners();
  console.log("✅ Event listeners configurados");

  // 4. Inicializa calendário
  initCalendar();
  setupCalendarTabObserver();
  console.log("✅ Calendário inicializado");

  // 5. Carrega dados salvos
  carregarDados();
  console.log("✅ Dados carregados do localStorage");

  // 6. Configura listener para atualizações do histórico
  window.addEventListener("historico-updated", () => {
    console.log("📊 Histórico atualizado - recarregando...");
    domRefs.historicoLista.innerHTML = "";
    carregarDados();
  });

  console.log("🎉 VidaExtra® - Aplicação iniciada com sucesso!");
});

// =============================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================

function setupEventListeners() {
  // Toggle do container de pensão
  domRefs.pensaoCheckbox.addEventListener("change", function () {
    domRefs.pensaoContainer.style.display = this.checked ? "block" : "none";
  });

  // Botões principais
  domRefs.btnLimpar.addEventListener("click", limparTudo);
  domRefs.btnExportar.addEventListener("click", exportarPDF);
  
  // Formulário de cálculo
  domRefs.form.addEventListener("submit", function (e) {
    e.preventDefault();
    calcularHoras();
  });
}
