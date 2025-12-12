/**
 * VidaExtra® - Módulo de Calendário
 * calendar.js - Integração com FullCalendar
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

import { appState, calendarState, domRefs, hasFullCalendar, hasLuxon, getLuxon } from './state.js';
import { getDayKey, escaparHTML, isHoverCapable } from './utils.js';
import { formatarMoeda } from './utils.js';

// =============================================
// INICIALIZAÇÃO DO CALENDÁRIO
// =============================================

/**
 * Inicializa o FullCalendar
 */
export function initCalendar() {
  if (!hasFullCalendar() || !domRefs.calendarioEl) return;
  
  try {
    calendarState.calendar = new FullCalendar.Calendar(domRefs.calendarioEl, {
      initialView: "dayGridMonth",
      height: 420,
      locale: "pt-br",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      },
      buttonText: { today: "hoje", month: "mês", week: "semana" },
      eventBackgroundColor: "transparent",
      eventBorderColor: "transparent",
      eventTextColor: "#212529",
      eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
      dayMaxEventRows: 3,
      views: {
        dayGridMonth: { displayEventTime: false },
        timeGridWeek: { displayEventTime: false },
      },
      datesSet: () => {
        markDaysWithEvents();
        bindDayCellTooltips();
      },
      eventContent: (arg) => {
        const periodo = arg.event.extendedProps?.periodo || "";
        const anot = (arg.event.extendedProps?.anotacoes || "").trim();
        const text = anot ? `${periodo}, ${anot}` : periodo;

        const chip = document.createElement("div");
        chip.className = "ve-event-chip";
        chip.textContent = text;
        return { domNodes: [chip] };
      },
    });
    calendarState.calendar.render();
    markDaysWithEvents();
    bindDayCellTooltips();
  } catch (e) {
    console.warn("Falha ao inicializar FullCalendar:", e);
  }
}

// =============================================
// MARCAÇÃO DE DIAS COM EVENTOS
// =============================================

/**
 * Marca visualmente os dias que possuem eventos
 */
export function markDaysWithEvents() {
  if (!calendarState.calendar) return;
  
  const events = calendarState.calendar.getEvents();
  const daysWithEvents = new Set();
  
  events.forEach((e) => {
    if (!e.start) return;
    const startKey = getDayKey(e.start);
    const endKey = e.end ? getDayKey(e.end) : startKey;
    daysWithEvents.add(startKey);
    daysWithEvents.add(endKey);
  });

  const todayKey = getDayKey(new Date());
  const cells = document.querySelectorAll(
    "#historico-calendario .fc-daygrid-day"
  );
  
  cells.forEach((cell) => {
    const dateKey = cell.getAttribute("data-date");
    cell.classList.remove(
      "ve-day-has-event-today",
      "ve-day-has-event-future"
    );
    if (daysWithEvents.has(dateKey)) {
      if (dateKey === todayKey) cell.classList.add("ve-day-has-event-today");
      else if (dateKey > todayKey) cell.classList.add("ve-day-has-event-future");
    }
  });
}

// =============================================
// CONSTRUÇÃO DE EVENTOS
// =============================================

/**
 * Constrói evento para visualização semanal
 * @param {Object} item - Item do histórico
 * @returns {Object} Evento do FullCalendar
 */
export function construirEventoWeek(item) {
  const [dia, mes, ano] = item.data.split("/").map(Number);
  const [horaInicio, , horaFim] = item.periodo.split(" ");
  const [hiH, hiM] = horaInicio.split(":").map(Number);
  const [hfH, hfM] = horaFim.split(":").map(Number);

  let startISO, endISO;
  
  if (hasLuxon()) {
    const { DateTime } = getLuxon();
    let dtStart = DateTime.fromObject({
      year: ano,
      month: mes,
      day: dia,
      hour: hiH,
      minute: hiM,
    });
    let dtEnd = DateTime.fromObject({
      year: ano,
      month: mes,
      day: dia,
      hour: hfH,
      minute: hfM,
    });
    if (dtEnd <= dtStart) dtEnd = dtEnd.plus({ days: 1 });
    startISO = dtStart.toISO();
    endISO = dtEnd.toISO();
  } else {
    const start = new Date(ano, mes - 1, dia, hiH, hiM);
    let end = new Date(ano, mes - 1, dia, hfH, hfM);
    if (end <= start) end = new Date(ano, mes - 1, dia + 1, hfH, hfM);
    startISO = start.toISOString();
    endISO = end.toISOString();
  }

  return {
    id: String(item.id) + "-w",
    title: "",
    start: startISO,
    end: endISO,
    classNames: ["ve-week-only"],
    extendedProps: {
      periodo: item.periodo,
      horas: item.horasTotais,
      pensao: item.percentualPensao,
      anotacoes: item.anotacoes || "",
      totalBruto: item.totalBruto,
      totalLiquido: item.totalLiquido,
    },
  };
}

/**
 * Constrói evento para visualização mensal
 * @param {Object} item - Item do histórico
 * @returns {Object} Evento do FullCalendar
 */
export function construirEventoMonth(item) {
  const [dia, mes, ano] = item.data.split("/").map(Number);
  const [horaInicio] = item.periodo.split(" ");
  const [hiH, hiM] = horaInicio.split(":").map(Number);

  let startISO;
  
  if (hasLuxon()) {
    const { DateTime } = getLuxon();
    startISO = DateTime.fromObject({
      year: ano,
      month: mes,
      day: dia,
      hour: hiH,
      minute: hiM,
    }).toISO();
  } else {
    startISO = new Date(ano, mes - 1, dia, hiH, hiM).toISOString();
  }
  
  const title =
    item.anotacoes && item.anotacoes.trim()
      ? `${item.periodo}, ${item.anotacoes.trim()}`
      : `${item.periodo}`;
      
  return {
    id: String(item.id) + "-m",
    title: title,
    start: startISO,
    classNames: ["ve-month-only"],
    extendedProps: {
      periodo: item.periodo,
      horas: item.horasTotais,
      pensao: item.percentualPensao,
      anotacoes: item.anotacoes || "",
      totalBruto: item.totalBruto,
      totalLiquido: item.totalLiquido,
    },
  };
}

// =============================================
// SINCRONIZAÇÃO DO CALENDÁRIO
// =============================================

/**
 * Sincroniza todos os eventos do histórico com o calendário
 */
export function calendarSyncAll() {
  if (!calendarState.calendar) return;
  
  calendarState.calendar.removeAllEvents();
  appState.historico.forEach((item) => {
    try {
      calendarState.calendar.addEvent(construirEventoMonth(item));
      calendarState.calendar.addEvent(construirEventoWeek(item));
    } catch {}
  });
  markDaysWithEvents();
  bindDayCellTooltips();
}

/**
 * Adiciona um item ao calendário
 * @param {Object} item - Item do histórico
 */
export function calendarAddItem(item) {
  if (!calendarState.calendar) return;
  try {
    calendarState.calendar.addEvent(construirEventoMonth(item));
    calendarState.calendar.addEvent(construirEventoWeek(item));
  } catch {}
  markDaysWithEvents();
}

/**
 * Remove um item do calendário
 * @param {number|string} id - ID do item
 */
export function calendarRemoveItem(id) {
  if (!calendarState.calendar) return;
  const evM = calendarState.calendar.getEventById(String(id) + "-m");
  if (evM) evM.remove();
  const evW = calendarState.calendar.getEventById(String(id) + "-w");
  if (evW) evW.remove();
  markDaysWithEvents();
}

// =============================================
// TOOLTIPS DO CALENDÁRIO
// =============================================

/**
 * Constrói HTML do tooltip para uma data específica
 * @param {string} dateKey - Data no formato YYYY-MM-DD
 * @returns {string} HTML do tooltip
 */
export function buildTooltipHtmlForDate(dateKey) {
  if (!calendarState.calendar) return "";
  
  const events = calendarState.calendar.getEvents().filter((e) => {
    if (!e.start) return false;
    const key = getDayKey(e.start);
    return key === dateKey;
  });
  
  const byId = new Map();
  events.forEach((e) => {
    const baseId = String(e.id).replace(/-(m|w)$/, "");
    if (!byId.has(baseId)) byId.set(baseId, e);
  });
  
  if (byId.size === 0) return "";
  
  const parts = [];
  byId.forEach((e) => {
    const p = e.extendedProps || {};
    const periodo = p.periodo || "";
    const horas =
      typeof p.horas === "number" ? p.horas.toFixed(2) : p.horas || "";
    const liquido =
      typeof p.totalLiquido === "number"
        ? formatarMoeda(p.totalLiquido)
        : p.totalLiquido
        ? String(p.totalLiquido)
        : "";
    const anot = (p.anotacoes || "").trim();
    parts.push(
      `<div class="ve-tip-item">
         <div class="ve-tip-periodo"><strong>${escaparHTML(periodo)}</strong></div>
         <div class="ve-tip-meta">Horas: ${escaparHTML(horas)}h ${
        liquido ? "• Valor: " + escaparHTML(liquido) : ""
      }</div>
         ${anot ? `<div class="ve-tip-notas">📝 ${escaparHTML(anot)}</div>` : ""}
       </div>`
    );
  });
  
  return `<div class="ve-tip-wrapper">${parts.join("")}</div>`;
}

/**
 * Vincula tooltips às células de dias do calendário
 */
export function bindDayCellTooltips() {
  if (!calendarState.calendar) return;
  
  const viewType =
    (calendarState.calendar.view && calendarState.calendar.view.type) || "";
  if (viewType !== "dayGridMonth") return;
  
  const cells = document.querySelectorAll(
    "#historico-calendario .fc-daygrid-day"
  );
  
  cells.forEach((cell) => {
    const dateKey = cell.getAttribute("data-date");
    if (!dateKey) return;
    if (cell.dataset.veTooltipBound === "true") return;
    
    const content = buildTooltipHtmlForDate(dateKey);
    if (!content) return;
    
    cell.dataset.veTooltipBound = "true";
    
    try {
      const opts = {
        title: content,
        html: true,
        trigger: isHoverCapable() ? "hover focus" : "click",
        placement: "auto",
        customClass: "ve-tooltip-bs",
        container: "body",
      };
      const tip = new bootstrap.Tooltip(cell, opts);
      cell._veTip = tip;
      
      if (!isHoverCapable()) {
        cell.addEventListener("click", function (ev) {
          ev.stopPropagation();
        });
        document.addEventListener("click", function () {
          if (cell._veTip) {
            try {
              cell._veTip.hide();
            } catch {}
          }
        });
      }
    } catch {}
  });
}

/**
 * Configura observador para redimensionar calendário quando aba ficar visível
 */
export function setupCalendarTabObserver() {
  const tabHistBtn = document.querySelector('[data-tab="hist"]');
  if (tabHistBtn) {
    tabHistBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (calendarState.calendar) {
          try {
            calendarState.calendar.updateSize();
          } catch {}
          try {
            calendarState.calendar.render();
          } catch {}
          markDaysWithEvents();
        }
      }, 60);
    });
  }
  
  const tabHistEl = document.getElementById("tab-hist");
  if (tabHistEl && window.MutationObserver) {
    const obs = new MutationObserver(() => {
      const hidden = tabHistEl.classList.contains("d-none");
      if (!hidden && calendarState.calendar) {
        setTimeout(() => {
          try {
            calendarState.calendar.updateSize();
          } catch {}
          markDaysWithEvents();
        }, 60);
      }
    });
    obs.observe(tabHistEl, { attributes: true, attributeFilter: ["class"] });
  }
}
