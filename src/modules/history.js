/**
 * VidaExtra® - Módulo de Histórico
 * history.js - CRUD e persistência do histórico de cálculos
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

import { appState, calendarState, domRefs, hasLuxon, getLuxon } from './state.js';
import { formatarMoeda, formatarData, escaparHTML, obterMillisDeDataBR, formatarParaBusca } from './utils.js';
import { calendarAddItem, calendarRemoveItem, calendarSyncAll, construirEventoMonth, construirEventoWeek, markDaysWithEvents } from './calendar.js';
import { tocarSomExclusao } from './sounds.js';

// =============================================
// FUNÇÕES AUXILIARES INTERNAS
// =============================================

/**
 * Calcula diferença entre horários
 * @param {string} inicio - Hora inicial (HH:MM)
 * @param {string} fim - Hora final (HH:MM)
 * @returns {number} Diferença em horas
 */
export function calcularDiferencaHoras(inicio, fim) {
  const [hIni, mIni] = inicio.split(":").map(Number);
  const [hFim, mFim] = fim.split(":").map(Number);
  
  if (hasLuxon()) {
    const { DateTime, Interval } = getLuxon();
    const today = DateTime.local().startOf("day");
    const start = today.set({ hour: hIni, minute: mIni });
    let end = today.set({ hour: hFim, minute: mFim });
    if (end < start) end = end.plus({ days: 1 });
    const interval = Interval.fromDateTimes(start, end);
    return Number(interval.length("hours").toFixed(2));
  }
  
  // Fallback nativo
  let diffHoras = hFim - hIni;
  let diffMinutos = mFim - mIni;
  if (diffMinutos < 0) {
    diffMinutos += 60;
    diffHoras--;
  }
  if (diffHoras < 0) diffHoras += 24;
  return diffHoras + diffMinutos / 60;
}

/**
 * Ordena DOM do histórico por data crescente
 */
export function ordenarHistoricoDOMAsc() {
  const items = Array.from(domRefs.historicoLista.children);
  items.sort((a, b) => {
    const am = Number(
      a.dataset.dateMilli ||
        obterMillisDeDataBR(a.querySelector("h6").textContent)
    );
    const bm = Number(
      b.dataset.dateMilli ||
        obterMillisDeDataBR(b.querySelector("h6").textContent)
    );
    return am - bm;
  });
  items.forEach((el) => domRefs.historicoLista.appendChild(el));
}

/**
 * Verifica se já existe evento duplicado
 * @param {Object} novoItem - Item a ser verificado
 * @returns {boolean} True se é duplicata
 */
export function verificarDuplicata(novoItem) {
  return appState.historico.some((item) => {
    const mesmaData = item.data === novoItem.data;
    const mesmoPeriodo = item.periodo === novoItem.periodo;
    const mesmoValor = item.totalLiquido === novoItem.totalLiquido;
    const mesmaPensao = item.percentualPensao === novoItem.percentualPensao;
    return mesmaData && mesmoPeriodo && mesmoValor && mesmaPensao;
  });
}

// =============================================
// ATUALIZAÇÃO DE TOTAIS
// =============================================

/**
 * Atualiza totais acumulados na UI
 */
export function atualizarTotais() {
  document.getElementById(
    "total-horas-valor"
  ).textContent = `${appState.totalHoras.toFixed(2)}h`;
  document.getElementById("total-valor-acumulado").textContent =
    formatarMoeda(appState.totalValor);
  domRefs.totalAcumulado.style.display = "block";
}

/**
 * Atualiza total perdido com pensão na UI
 */
export function atualizarTotalPensao() {
  document.getElementById("total-perdido-valor").textContent = formatarMoeda(
    appState.totalPensao
  );
  domRefs.totalPerdidoPensao.style.display =
    appState.totalPensao > 0 ? "block" : "none";
}

/**
 * Recalcula totais a partir do histórico
 */
export function recalcularTotaisDoHistorico() {
  appState.totalHoras = 0;
  appState.totalValor = 0;
  appState.totalPensao = 0;

  appState.historico.forEach((item) => {
    appState.totalHoras += item.horasTotais || 0;
    appState.totalValor += item.totalLiquido || 0;

    if (item.percentualPensao > 0 && item.totalBruto) {
      const descontoPensao = item.totalBruto * (item.percentualPensao / 100);
      appState.totalPensao += descontoPensao;
    }
  });

  atualizarTotais();
  atualizarTotalPensao();
}

// =============================================
// EXIBIÇÃO DE RESULTADOS
// =============================================

/**
 * Exibe os resultados na tabela
 * @param {Object} calculo - Dados do cálculo
 */
export function exibirResultado(calculo) {
  document.getElementById("horas-diurnas").textContent =
    calculo.horasTotais.toFixed(2);
  document.getElementById("total-diurno").textContent = formatarMoeda(
    calculo.totalBruto
  );
  document.getElementById("total-bruto").textContent = formatarMoeda(
    calculo.totalBruto
  );
  document.getElementById("total-liquido").textContent = formatarMoeda(
    calculo.totalLiquido
  );

  if (calculo.temPensao) {
    document.getElementById("linha-pensao").style.display = "";
    document.getElementById(
      "desconto-pensao"
    ).textContent = `- ${formatarMoeda(calculo.descontoPensao)}`;
  } else {
    document.getElementById("linha-pensao").style.display = "none";
  }

  document.getElementById("resumo-periodo").innerHTML = `
    <strong>${calculo.data}</strong> (${
    calculo.diaSemana.charAt(0).toUpperCase() + calculo.diaSemana.slice(1)
  })<br>
    Período: ${calculo.periodo}
  `;

  // Exibe anotações, se houver
  if (calculo.anotacoes && calculo.anotacoes.length > 0) {
    domRefs.resumoAnotacoes.style.display = "block";
    domRefs.resumoAnotacoes.innerHTML = `<i class="bi bi-journal-text"></i> <em>Anotações:</em> ${escaparHTML(
      calculo.anotacoes
    )}`;
  } else {
    domRefs.resumoAnotacoes.style.display = "none";
    domRefs.resumoAnotacoes.textContent = "";
  }

  domRefs.resultadoVazio.style.display = "none";
  domRefs.resultadoContainer.style.display = "block";
}

// =============================================
// CRUD DO HISTÓRICO
// =============================================

/**
 * Adiciona item ao histórico com botão de remoção
 * @param {Object} calculo - Dados do cálculo
 */
export function adicionarAoHistorico(calculo) {
  const itemId = Date.now();

  const item = document.createElement("div");
  item.className = "list-group-item";
  item.dataset.id = itemId;
  item.dataset.dateMilli = String(
    calculo.dataMillis || obterMillisDeDataBR(calculo.data)
  );

  item.innerHTML = `
    <div class="d-flex justify-content-between">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="mb-1">${calculo.data}</h6>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary btn-editar-item" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger btn-remover-item" title="Remover">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <small>${calculo.periodo}</small>
        <div class="mt-2">
          <span class="badge bg-primary">${calculo.horasTotais.toFixed(
            2
          )}h totais</span>
          ${
            calculo.percentualPensao > 0
              ? `<span class="badge bg-warning text-dark">Pensão ${calculo.percentualPensao}%</span>`
              : ""
          }
        </div>
        <div class="mt-2 d-flex align-items-center">
          ${
            calculo.percentualPensao > 0
              ? `<span class="valor-original">${formatarMoeda(
                  calculo.totalBruto
                )}</span>
             <i class="bi bi-arrow-right"></i>`
              : ""
          }
          <span class="valor-liquido">${formatarMoeda(
            calculo.totalLiquido
          )}</span>
        </div>
        ${
          calculo.anotacoes && calculo.anotacoes.length > 0
            ? `<div class="mt-1 text-muted"><small>Anotações: ${escaparHTML(
                calculo.anotacoes
              )}</small></div>`
            : ""
        }
      </div>
    </div>
  `;

  domRefs.historicoLista.appendChild(item);
  ordenarHistoricoDOMAsc();
  domRefs.historicoVazio.style.display = "none";
  atualizarTotais();
  atualizarTotalPensao();

  // Adiciona evento ao botão de remover
  const btnRemover = item.querySelector(".btn-remover-item");
  btnRemover.addEventListener("click", function () {
    removerItemHistorico(itemId, calculo);
  });

  const btnEditar = item.querySelector(".btn-editar-item");
  btnEditar.addEventListener("click", function () {
    editarItemHistorico(itemId);
  });

  // Armazena no estado
  appState.historico.unshift({
    ...calculo,
    id: itemId,
    timestamp: new Date().getTime(),
  });

  // Adiciona ao calendário
  calendarAddItem({ ...calculo, id: itemId });
}

/**
 * Remove um item específico do histórico
 * @param {number} id - ID do item
 * @param {Object} calculo - Dados do cálculo
 */
export function removerItemHistorico(id, calculo) {
  Swal.fire({
    title: "Remover item?",
    text: "Deseja remover este cálculo do histórico?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sim, remover",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove do DOM
      const item = document.querySelector(
        `.list-group-item[data-id="${id}"]`
      );
      if (item) item.remove();

      // Remove do estado
      const index = appState.historico.findIndex((item) => item.id === id);
      if (index !== -1) {
        const itemRemovido = appState.historico.splice(index, 1)[0];

        // Atualiza totais acumulados
        appState.totalHoras -= itemRemovido.horasTotais;
        appState.totalValor -= itemRemovido.totalLiquido;
        appState.totalPensao -=
          itemRemovido.percentualPensao > 0
            ? itemRemovido.totalBruto * (itemRemovido.percentualPensao / 100)
            : 0;

        atualizarTotais();
        atualizarTotalPensao();

        // Salva dados
        salvarDados();

        try {
          (async () => {
            const authMod = await import("../auth.js");
            const idToken = await authMod.getIdToken();
            const [, mes, ano] = (calculo.data || "")
              .split("/")
              .map(Number);
            const ym = `${ano}-${String(mes).padStart(2, "0")}`;
            await fetch("/api/shifts?action=delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ month: ym, id }),
            }).catch(() => {});
          })();
        } catch {}

        // Toca som de exclusão
        tocarSomExclusao();

        Swal.fire({
          icon: "success",
          title: "Item removido!",
          text: "O cálculo foi removido do histórico",
          timer: 1500,
          showConfirmButton: false,
        });

        // Remove do calendário
        calendarRemoveItem(id);
      }

      // Mostra mensagem se o histórico estiver vazio
      if (domRefs.historicoLista.children.length === 0) {
        domRefs.historicoVazio.style.display = "block";
        domRefs.totalAcumulado.style.display = "none";
        domRefs.totalPerdidoPensao.style.display = "none";
      }
    }
  });
}

/**
 * Edita um item do histórico
 * @param {number} id - ID do item
 */
export function editarItemHistorico(id) {
  const itemIndex = appState.historico.findIndex((h) => h.id === id);
  if (itemIndex === -1) return;
  const antigo = appState.historico[itemIndex];

  // Pré-preenche campos
  const [dia, mes, ano] = antigo.data.split("/");
  const dataISO = `${ano}-${mes}-${dia}`;
  const [horaInicio, , horaFim] = antigo.periodo.split(" ");

  Swal.fire({
    title: "Editar cálculo",
    html: `
      <div class="text-start">
        <label class="form-label fw-bold">Data</label>
        <input type="date" id="edit-data" class="form-control" value="${dataISO}">
        <div class="row g-2 mt-2">
          <div class="col">
            <label class="form-label fw-bold">Hora Inicial</label>
            <input type="text" id="edit-inicio" class="form-control air-datepicker-input" value="${horaInicio}" readonly>
          </div>
          <div class="col">
            <label class="form-label fw-bold">Hora Final</label>
            <input type="text" id="edit-fim" class="form-control air-datepicker-input" value="${horaFim}" readonly>
          </div>
        </div>
        <label class="form-label fw-bold mt-2">Percentual de Pensão (%)</label>
        <input type="number" id="edit-pensao" class="form-control" min="0" max="100" value="${
          antigo.percentualPensao || 0
        }">
        <label class="form-label fw-bold mt-2">Anotações</label>
        <textarea id="edit-anotacoes" class="form-control" rows="2">${
          antigo.anotacoes || ""
        }</textarea>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Salvar",
    cancelButtonText: "Cancelar",
    didOpen: () => {
      // Inicializa Air Datepicker nos campos de hora
      if (typeof AirDatepicker !== "undefined" && window.AirDatepickerLocalePt) {
        const confirmBtn = window.AirDatepickerConfirmBtn || {
          content: "Confirmar",
          onClick: (dp) => dp.hide()
        };
        
        const [hI, mI] = horaInicio.split(":");
        const [hF, mF] = horaFim.split(":");
        
        const editInicioInput = document.getElementById("edit-inicio");
        const editFimInput = document.getElementById("edit-fim");
        
        if (editInicioInput) {
          new AirDatepicker(editInicioInput, {
            locale: window.AirDatepickerLocalePt,
            timepicker: true,
            onlyTimepicker: true,
            classes: "vidaextra-datepicker",
            autoClose: false,
            isMobile: true,
            minutesStep: 1,
            buttons: ["clear", confirmBtn],
            selectedDates: [new Date().setHours(parseInt(hI) || 8, parseInt(mI) || 0, 0, 0)],
          });
        }
        
        if (editFimInput) {
          new AirDatepicker(editFimInput, {
            locale: window.AirDatepickerLocalePt,
            timepicker: true,
            onlyTimepicker: true,
            classes: "vidaextra-datepicker",
            autoClose: false,
            isMobile: true,
            minutesStep: 1,
            buttons: ["clear", confirmBtn],
            selectedDates: [new Date().setHours(parseInt(hF) || 17, parseInt(mF) || 0, 0, 0)],
          });
        }
      }
    },
    preConfirm: () => {
      const data = document.getElementById("edit-data").value;
      const inicio = document.getElementById("edit-inicio").value;
      const fim = document.getElementById("edit-fim").value;
      const pensao =
        parseFloat(document.getElementById("edit-pensao").value) || 0;
      const notas = (
        document.getElementById("edit-anotacoes").value || ""
      ).trim();
      if (!data || !inicio || !fim) {
        Swal.showValidationMessage("Preencha data e horários");
        return false;
      }
      return { data, inicio, fim, pensao, notas };
    },
  }).then((result) => {
    if (!result.isConfirmed) return;
    const { data, inicio, fim, pensao, notas } = result.value;

    // Recalcula valores
    const [anoN, mesN, diaN] = data.split("-").map(Number);
    const dataObj = new Date(anoN, mesN - 1, diaN);
    const diaSemana = [
      "domingo",
      "segunda",
      "terca",
      "quarta",
      "quinta",
      "sexta",
      "sabado",
    ][dataObj.getDay()];

    const inicioFmt = formatarParaBusca(inicio);
    const fimFmt = formatarParaBusca(fim);
    const chaveBusca = `${inicioFmt} as ${fimFmt}`;
    const valorEncontrado = appState.valoresAC4.find(
      (item) => item.horarioBusca.toLowerCase() === chaveBusca.toLowerCase()
    );

    if (!valorEncontrado) {
      Swal.fire({
        icon: "error",
        title: "Horário não encontrado",
        text: `Nenhum valor cadastrado para ${inicio} às ${fim}`,
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    const horasTotais =
      valorEncontrado.horas || calcularDiferencaHoras(inicio, fim);
    const totalBruto = parseFloat(valorEncontrado[diaSemana]);
    const descontoPensao =
      pensao > 0 ? parseFloat((totalBruto * (pensao / 100)).toFixed(2)) : 0;
    const totalLiquido = parseFloat((totalBruto - descontoPensao).toFixed(2));

    // Atualiza totais gerais: remove antigo, adiciona novo
    appState.totalHoras -= antigo.horasTotais;
    appState.totalValor -= antigo.totalLiquido;
    appState.totalPensao -=
      antigo.percentualPensao > 0
        ? antigo.totalBruto * (antigo.percentualPensao / 100)
        : 0;

    appState.totalHoras += horasTotais;
    appState.totalValor += totalLiquido;
    appState.totalPensao += descontoPensao;

    // Atualiza item no estado
    const atualizado = {
      ...antigo,
      data: formatarData(dataObj),
      periodo: `${inicio} às ${fim}`,
      horasTotais,
      totalBruto,
      totalLiquido,
      percentualPensao: pensao,
      anotacoes: notas,
      dataMillis: dataObj.getTime(),
    };
    appState.historico[itemIndex] = atualizado;

    // Atualiza evento no calendário
    if (calendarState.calendar) {
      const evM = calendarState.calendar.getEventById(String(id) + "-m");
      const evW = calendarState.calendar.getEventById(String(id) + "-w");
      const novoM = construirEventoMonth(atualizado);
      const novoW = construirEventoWeek(atualizado);
      if (evM) {
        evM.setProp("title", novoM.title);
        evM.setStart(novoM.start);
      } else {
        try {
          calendarState.calendar.addEvent(novoM);
        } catch {}
      }
      if (evW) {
        evW.setProp("title", novoW.title);
        evW.setStart(novoW.start);
        evW.setEnd(novoW.end);
      } else {
        try {
          calendarState.calendar.addEvent(novoW);
        } catch {}
      }
      markDaysWithEvents();
    }

    // Atualiza DOM do item
    const itemEl = document.querySelector(
      `.list-group-item[data-id="${id}"]`
    );
    if (itemEl) {
      itemEl.dataset.dateMilli = String(atualizado.dataMillis);
      itemEl.querySelector("h6").textContent = atualizado.data;
      itemEl.querySelector("small").textContent = atualizado.periodo;
      itemEl.querySelector(
        ".badge.bg-primary"
      ).textContent = `${horasTotais.toFixed(2)}h totais`;

      const valorOriginalEl = itemEl.querySelector(".valor-original");
      const valorLiquidoEl = itemEl.querySelector(".valor-liquido");
      if (atualizado.percentualPensao > 0) {
        if (valorOriginalEl) {
          valorOriginalEl.textContent = formatarMoeda(totalBruto);
        } else {
          const container = valorLiquidoEl.parentElement;
          const spanOriginal = document.createElement("span");
          spanOriginal.className = "valor-original";
          spanOriginal.textContent = formatarMoeda(totalBruto);
          const seta = document.createElement("i");
          seta.className = "bi bi-arrow-right";
          container.insertBefore(spanOriginal, valorLiquidoEl);
          container.insertBefore(seta, valorLiquidoEl);
        }
      } else {
        // Remove indicação de valor original se não houver pensão
        if (valorOriginalEl) {
          const container = valorOriginalEl.parentElement;
          const seta = container.querySelector("i.bi.bi-arrow-right");
          valorOriginalEl.remove();
          if (seta) seta.remove();
        }
      }
      valorLiquidoEl.textContent = formatarMoeda(totalLiquido);

      // Atualiza badge de pensão
      const badgePensao = itemEl.querySelector(".badge.bg-warning");
      if (atualizado.percentualPensao > 0) {
        if (badgePensao) {
          badgePensao.textContent = `Pensão ${atualizado.percentualPensao}%`;
        } else {
          const badgesContainer = itemEl.querySelector(".mt-2");
          const novoBadge = document.createElement("span");
          novoBadge.className = "badge bg-warning text-dark";
          novoBadge.textContent = `Pensão ${atualizado.percentualPensao}%`;
          badgesContainer.appendChild(novoBadge);
        }
      } else if (badgePensao) {
        badgePensao.remove();
      }

      // Atualiza anotações
      const notasEl = itemEl.querySelector(".mt-1.text-muted");
      if (atualizado.anotacoes && atualizado.anotacoes.length > 0) {
        if (notasEl) {
          notasEl.innerHTML = `<small>Anotações: ${escaparHTML(
            atualizado.anotacoes
          )}</small>`;
        } else {
          const novoNotas = document.createElement("div");
          novoNotas.className = "mt-1 text-muted";
          novoNotas.innerHTML = `<small>Anotações: ${escaparHTML(
            atualizado.anotacoes
          )}</small>`;
          itemEl.querySelector(".flex-grow-1").appendChild(novoNotas);
        }
      } else if (notasEl) {
        notasEl.remove();
      }
    }

    atualizarTotais();
    atualizarTotalPensao();
    salvarDados();
    ordenarHistoricoDOMAsc();

    Swal.fire({
      icon: "success",
      title: "Item atualizado",
      timer: 1200,
      showConfirmButton: false,
    });
  });
}

// =============================================
// PERSISTÊNCIA
// =============================================

/**
 * Salva dados no localStorage e sincroniza com API
 */
export function salvarDados() {
  try {
    localStorage.setItem("ac4-historico", JSON.stringify(appState.historico));
    localStorage.setItem(
      "ac4-totais",
      JSON.stringify({
        horas: appState.totalHoras,
        valor: appState.totalValor,
        pensao: appState.totalPensao,
      })
    );
    try {
      const months = Array.from(
        new Set(
          (appState.historico || []).map((it) => {
            const [, m, y] = (it.data || "").split("/").map(Number);
            return `${y}-${String(m).padStart(2, "0")}`;
          })
        )
      ).filter((v) => v && v.length === 7);
      (async () => {
        const authMod = await import("../auth.js");
        const idToken = await authMod.getIdToken();
        for (const ym of months) {
          const subset = (appState.historico || []).filter((it) => {
            const [, m, y] = (it.data || "").split("/").map(Number);
            const key = `${y}-${String(m).padStart(2, "0")}`;
            return key === ym;
          });
          const hours = subset.reduce(
            (acc, it) => acc + (Number(it.horasTotais) || 0),
            0
          );
          await fetch("/api/shifts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              month: ym,
              shifts: subset,
              totals: { hours },
            }),
          }).catch(() => {});
        }
      })();
    } catch {}
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
  }
}

/**
 * Carrega dados do localStorage e sincroniza com API
 */
export function carregarDados() {
  try {
    const historico = JSON.parse(localStorage.getItem("ac4-historico")) || [];
    const totais = JSON.parse(localStorage.getItem("ac4-totais")) || {
      horas: 0,
      valor: 0,
      pensao: 0,
    };

    appState.historico = historico;
    appState.totalHoras = totais.horas;
    appState.totalValor = totais.valor;
    appState.totalPensao = totais.pensao || 0;

    // Ordena por data crescente ao carregar
    historico
      .sort((a, b) => {
        const am = a.dataMillis || obterMillisDeDataBR(a.data);
        const bm = b.dataMillis || obterMillisDeDataBR(b.data);
        return am - bm;
      })
      .forEach((item) => {
        const itemElement = document.createElement("div");
        itemElement.className = "list-group-item";
        itemElement.dataset.id = item.id;
        itemElement.dataset.dateMilli = String(
          item.dataMillis || obterMillisDeDataBR(item.data)
        );

        itemElement.innerHTML = `
        <div class="d-flex justify-content-between">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="mb-1">${item.data}</h6>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary btn-editar-item" title="Editar">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-remover-item" title="Remover">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <small>${item.periodo}</small>
            <div class="mt-2">
              <span class="badge bg-primary">${item.horasTotais.toFixed(
                2
              )}h totais</span>
              ${
                item.percentualPensao > 0
                  ? `<span class="badge bg-warning text-dark">Pensão ${item.percentualPensao}%</span>`
                  : ""
              }
            </div>
            <div class="mt-2 d-flex align-items-center">
              ${
                item.percentualPensao > 0
                  ? `<span class="valor-original">${formatarMoeda(
                      item.totalBruto
                    )}</span>
                 <i class="bi bi-arrow-right"></i>`
                  : ""
              }
              <span class="valor-liquido">${formatarMoeda(
                item.totalLiquido
              )}</span>
            </div>
            ${
              item.anotacoes && item.anotacoes.length > 0
                ? `<div class="mt-1 text-muted"><small>Anotações: ${escaparHTML(
                    item.anotacoes
                  )}</small></div>`
                : ""
            }
          </div>
        </div>
      `;

        domRefs.historicoLista.appendChild(itemElement);

        // Adiciona evento ao botão de remover
        const btnRemover = itemElement.querySelector(".btn-remover-item");
        btnRemover.addEventListener("click", function () {
          removerItemHistorico(item.id, item);
        });

        const btnEditar = itemElement.querySelector(".btn-editar-item");
        btnEditar.addEventListener("click", function () {
          editarItemHistorico(item.id);
        });
      });

    if (historico.length > 0) {
      domRefs.historicoVazio.style.display = "none";
      atualizarTotais();
      atualizarTotalPensao();
      calendarSyncAll();
    }

    (async () => {
      try {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        const hasCurrentMonth = (historico || []).some((it) => {
          const [, m, y] = (it.data || "").split("/").map(Number);
          const key = `${y}-${String(m).padStart(2, "0")}`;
          return key === ym;
        });
        if (historico.length === 0 || !hasCurrentMonth) {
          const fb = await import("../firebase-config.js");
          await fb.firebasePromise;
          const authMod = await import("../auth.js");
          let idToken;
          try {
            idToken = await authMod.getIdToken();
          } catch {
            return;
          }
          const res = await fetch(`/api/shifts?month=${ym}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (!res.ok) {
            try {
              const text = await res.text();
              console.error("shifts error:", res.status, text);
            } catch {}
            return;
          }
          if (res.ok) {
            const data = await res.json();
            const remote = Array.isArray(data.shifts) ? data.shifts : [];
            if (remote.length > 0) {
              const merged = [
                ...historico.filter((it) => {
                  const [, m, y] = (it.data || "").split("/").map(Number);
                  const key = `${y}-${String(m).padStart(2, "0")}`;
                  return key !== ym;
                }),
                ...remote,
              ];
              appState.historico = merged;
              recalcularTotaisDoHistorico();
              salvarDados();
              window.dispatchEvent(new Event("historico-updated"));
            }
          }
        }
      } catch {}
    })();
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
  }
}
