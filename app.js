/**
 * VidaExtra® - Calculadora AC-4
 * app.js - Código principal da aplicação
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

document.addEventListener("DOMContentLoaded", function () {
  // Integração opcional com Luxon
  const hasLuxon =
    typeof window !== "undefined" &&
    window.luxon &&
    window.luxon.DateTime &&
    window.luxon.Interval;
  const { DateTime, Interval } = hasLuxon ? window.luxon : {};
  // Integração opcional com FullCalendar
  const hasFullCalendar =
    typeof window !== "undefined" &&
    window.FullCalendar &&
    window.FullCalendar.Calendar;
  // =============================================
  // 1. SELEÇÃO DE ELEMENTOS DO DOM
  // =============================================
  const form = document.getElementById("form-calculo");
  const btnLimpar = document.getElementById("btn-limpar");
  const btnExportar = document.getElementById("btn-exportar");
  const pensaoCheckbox = document.getElementById("pensao-alimenticia");
  const pensaoContainer = document.getElementById("pensao-container");
  const resultadoContainer = document.getElementById("resultado-container");
  const resultadoVazio = document.getElementById("resultado-vazio");
  const resumoAnotacoes = document.getElementById("resumo-anotacoes");
  const historicoLista = document.getElementById("historico-lista");
  const historicoVazio = document.getElementById("historico-vazio");
  const totalAcumulado = document.getElementById("total-acumulado");
  const totalPerdidoPensao = document.getElementById("total-perdido-pensao");
  const calendarioEl = document.getElementById("historico-calendario");

  // =============================================
  // 2. ESTADO DA APLICAÇÃO
  // =============================================
  const appState = {
    valoresAC4: [], // Armazena os valores do JSON
    historico: [], // Histórico de cálculos
    totalHoras: 0, // Total de horas acumuladas
    totalValor: 0, // Total monetário acumulado
    totalPensao: 0, // Total de descontos de pensão
    carregado: false, // Flag se os dados foram carregados
  };

  // Estado do calendário
  const calendarState = { calendar: null };

  function initCalendar() {
    if (!hasFullCalendar || !calendarioEl) return;
    try {
      calendarState.calendar = new FullCalendar.Calendar(calendarioEl, {
        initialView: "dayGridMonth",
        height: 420,
        locale: "pt-br",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        },
        buttonText: { today: "hoje", month: "mês", week: "semana" },
        // Mostrar apenas texto, sem pintar o evento
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
        // Conteúdo customizado: período + anotação (sem borda, borda fica na célula do dia)
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

  function getDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function markDaysWithEvents() {
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
        else if (dateKey > todayKey)
          cell.classList.add("ve-day-has-event-future");
      }
    });
  }

  function construirEventoWeek(item) {
    const [dia, mes, ano] = item.data.split("/").map(Number);
    const [horaInicio, , horaFim] = item.periodo.split(" ");
    const [hiH, hiM] = horaInicio.split(":").map(Number);
    const [hfH, hfM] = horaFim.split(":").map(Number);

    let startISO, endISO;
    if (hasLuxon) {
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

    // Título padrão vazio; usamos eventContent para renderizar
    const title = "";

    return {
      id: String(item.id) + "-w",
      title: title,
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

  function construirEventoMonth(item) {
    const [dia, mes, ano] = item.data.split("/").map(Number);
    const [horaInicio] = item.periodo.split(" ");
    const [hiH, hiM] = horaInicio.split(":").map(Number);

    let startISO;
    if (hasLuxon) {
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

  function calendarSyncAll() {
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

  // ---------------------------------------------
  // Tooltips (hover/click) no calendário Histórico
  // ---------------------------------------------
  function isHoverCapable() {
    try {
      return window.matchMedia && window.matchMedia("(hover: hover)").matches;
    } catch {
      return true;
    }
  }

  function buildTooltipHtmlForDate(dateKey) {
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
           <div class="ve-tip-periodo"><strong>${escaparHTML(
             periodo
           )}</strong></div>
           <div class="ve-tip-meta">Horas: ${escaparHTML(horas)}h ${
          liquido ? "• Valor: " + escaparHTML(liquido) : ""
        }</div>
           ${
             anot
               ? `<div class="ve-tip-notas">📝 ${escaparHTML(anot)}</div>`
               : ""
           }
         </div>`
      );
    });
    return `<div class="ve-tip-wrapper">${parts.join("")}</div>`;
  }

  function bindDayCellTooltips() {
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

  function calendarAddItem(item) {
    if (!calendarState.calendar) return;
    try {
      calendarState.calendar.addEvent(construirEventoMonth(item));
      calendarState.calendar.addEvent(construirEventoWeek(item));
    } catch {}
    markDaysWithEvents();
  }

  function calendarRemoveItem(id) {
    if (!calendarState.calendar) return;
    const evM = calendarState.calendar.getEventById(String(id) + "-m");
    if (evM) evM.remove();
    const evW = calendarState.calendar.getEventById(String(id) + "-w");
    if (evW) evW.remove();
    markDaysWithEvents();
  }

  // =============================================
  // 3. CARREGAMENTO DOS VALORES DO JSON
  // =============================================
  fetch("valores-ac4.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      // Aceita tanto {valores: [...]} quanto array direto
      const valores = data.valores || data;

      if (!Array.isArray(valores))
        throw new Error("Formato inválido: esperado array de valores");

      // Normaliza os horários para busca
      appState.valoresAC4 = valores.map((item) => ({
        ...item,
        horarioBusca: item.horario
          .replace(/\(\d+h\)$/, "") // Remove (XXh)
          .replace(/_/g, " ") // Substitui underscores
          .trim(),
      }));

      appState.carregado = true;
      console.log("Dados carregados com sucesso!");
    })
    .catch((error) => {
      console.error("Erro ao carregar valores:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        html: `Não foi possível carregar os valores.<br><small>${error.message}</small>`,
        confirmButtonColor: "#0d6efd",
      });
    });

  // =============================================
  // 4. CONFIGURAÇÃO DE EVENT LISTENERS
  // =============================================
  pensaoCheckbox.addEventListener("change", function () {
    pensaoContainer.style.display = this.checked ? "block" : "none";
  });

  btnLimpar.addEventListener("click", limparTudo);
  btnExportar.addEventListener("click", exportarPDF);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    calcularHoras();
  });

  // Inicializa calendário
  initCalendar();

  // Garante render correto quando a aba Histórico ficar visível
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

  // =============================================
  // 5. FUNÇÃO PRINCIPAL DE CÁLCULO
  // =============================================
  function calcularHoras() {
    if (!appState.carregado) {
      Swal.fire({
        icon: "error",
        title: "Atenção",
        text: "Os valores ainda não foram carregados. Por favor, aguarde.",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    // Obtém valores dos inputs
    const dataInput = document.getElementById("data-servico").value;
    const horaInicio = document.getElementById("hora-inicio").value;
    const horaFim = document.getElementById("hora-fim").value;
    const temPensao = pensaoCheckbox.checked;
    const percentualPensao =
      parseFloat(document.getElementById("percentual-pensao").value) || 0;
    const anotacoes = (
      document.getElementById("anotacoes")?.value || ""
    ).trim();

    // Validação básica
    if (!dataInput || !horaInicio || !horaFim) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Preencha todos os campos obrigatórios",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    // Processamento da data
    const [ano, mes, dia] = dataInput.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = hasLuxon
      ? ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
          DateTime.fromJSDate(dataObj).weekday % 7
        ]
      : ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
          dataObj.getDay()
        ];

    // Formatação para busca no JSON
    const formatarParaBusca = (hora) => {
      const [h, m] = hora.split(":");
      const horaFormatada = h.padStart(2, "0");
      return m === "00" ? `${horaFormatada}h` : `${horaFormatada}h${m}m`;
    };

    const horaInicioFormatada = formatarParaBusca(horaInicio);
    const horaFimFormatada = formatarParaBusca(horaFim);
    const chaveBusca = `${horaInicioFormatada} as ${horaFimFormatada}`;

    // Busca no JSON
    const valorEncontrado = appState.valoresAC4.find((item) => {
      return item.horarioBusca.toLowerCase() === chaveBusca.toLowerCase();
    });

    if (!valorEncontrado) {
      const horariosDisponiveis = [
        ...new Set(appState.valoresAC4.slice(0, 5).map((v) => v.horarioBusca)),
      ].join(", ");

      Swal.fire({
        icon: "error",
        title: "Horário não encontrado",
        html: `Nenhum valor cadastrado para:<br>
               <strong>${horaInicio} às ${horaFim}</strong><br>
               Formato buscado: ${chaveBusca}<br>
               Exemplos disponíveis: ${horariosDisponiveis}...`,
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    // Cálculos financeiros
    const horasTotais =
      valorEncontrado.horas || calcularDiferencaHoras(horaInicio, horaFim);
    const totalBruto = parseFloat(valorEncontrado[diaSemana]);
    const descontoPensao = temPensao
      ? parseFloat((totalBruto * (percentualPensao / 100)).toFixed(2))
      : 0;
    const totalLiquido = parseFloat((totalBruto - descontoPensao).toFixed(2));

    // Atualiza estado
    appState.totalHoras += horasTotais;
    appState.totalValor += totalLiquido;
    appState.totalPensao += descontoPensao;

    // Exibe resultados
    exibirResultado({
      data: formatarData(dataObj),
      periodo: `${horaInicio} às ${horaFim}`,
      diaSemana,
      horasTotais,
      totalBruto,
      temPensao,
      percentualPensao,
      descontoPensao,
      totalLiquido,
      anotacoes,
    });

    // Adiciona ao histórico
    const novoItem = {
      data: formatarData(dataObj),
      periodo: `${horaInicio} às ${horaFim}`,
      horasTotais,
      totalBruto,
      totalLiquido,
      percentualPensao: temPensao ? percentualPensao : 0,
      anotacoes,
      dataMillis: dataObj.getTime(),
    };
    adicionarAoHistorico(novoItem);

    salvarDados();

    // Agenda no Google Calendar (assíncrono, não bloqueia a UX)
    try {
      // Converte data e horários para ISO (início/fim) respeitando virada de dia
      const [hIni, mIni] = horaInicio.split(":").map(Number);
      const [hFim, mFim] = horaFim.split(":").map(Number);
      const start = new Date(ano, mes - 1, dia, hIni, mIni);
      let end = new Date(ano, mes - 1, dia, hFim, mFim);
      if (end <= start) end = new Date(ano, mes - 1, dia + 1, hFim, mFim);

      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const summary = `AC-4 ${horaInicio} às ${horaFim}`;
      const descParts = [
        `Horas: ${horasTotais.toFixed(2)}h`,
        `Valor líquido: ${formatarMoeda(totalLiquido)}`,
      ];
      if (temPensao)
        descParts.push(
          `Pensão: ${percentualPensao}% (${formatarMoeda(descontoPensao)})`
        );
      if (anotacoes) descParts.push(`Anotações: ${anotacoes}`);
      const description = descParts.join(" | ");

      // Lembretes: reforça e-mail 24h e 1h antes + popup 30min
      const reminders = {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 30 },
          { method: "popup", minutes: 15 },
        ],
      };

      import("./src/reminders.js")
        .then((mod) => {
          mod
            .createCalendarEvent({
              summary,
              description,
              location: undefined,
              startISO,
              endISO,
              reminders,
            })
            .then((res) => {
              console.log("Evento criado no Google Calendar:", res);

              // Salvar eventId no histórico para permitir sincronização
              if (res?.event?.id && novoItem?.id) {
                const historicoAtual = JSON.parse(
                  localStorage.getItem("historico") || "[]"
                );
                const itemIndex = historicoAtual.findIndex(
                  (item) => item.id === novoItem.id
                );
                if (itemIndex !== -1) {
                  historicoAtual[itemIndex].eventId = res.event.id;
                  historicoAtual[itemIndex].eventLink = res.event.htmlLink;
                  localStorage.setItem(
                    "historico",
                    JSON.stringify(historicoAtual)
                  );
                  console.log("✅ Event ID salvo no histórico:", res.event.id);
                }
              }

              // Send confirmation email
              import("./src/auth.js").then((authModule) => {
                const user = authModule.getCurrentUser();
                if (user && res?.event) {
                  fetch("/api/sendEventConfirmation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userName: user.displayName,
                      userEmail: user.email,
                      event: res.event,
                    }),
                  }).catch((err) => {
                    console.error("Error sending confirmation email:", err);
                  });
                }
              });
            })
            .catch((err) => {
              console.warn(
                "Falha ao criar evento no Google Calendar:",
                err?.message || err
              );
            });
        })
        .catch(() => {});
    } catch (e) {
      console.warn("Não foi possível agendar no Google Calendar:", e);
    }

    // Toca som de confirmação
    tocarSomSucesso();

    // Exibe mensagem de sucesso com detalhes
    Swal.fire({
      icon: "success",
      title: "Cálculo adicionado!",
      html: `
        <div class="text-start">
          <p><strong>Data:</strong> ${formatarData(dataObj)} (${
        diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
      })</p>
          <p><strong>Período:</strong> ${horaInicio} às ${horaFim}</p>
          <p><strong>Horas:</strong> ${horasTotais.toFixed(2)}h</p>
          <p><strong>Valor líquido:</strong> ${formatarMoeda(totalLiquido)}</p>
          ${
            temPensao
              ? `<p><strong>Desconto pensão:</strong> ${percentualPensao}% (${formatarMoeda(
                  descontoPensao
                )})</p>`
              : ""
          }
        </div>
      `,
      confirmButtonColor: "#0d6efd",
      confirmButtonText: "OK",
    });
  }

  // =============================================
  // 6. FUNÇÕES AUXILIARES
  // =============================================

  // Calcula diferença entre horários
  function calcularDiferencaHoras(inicio, fim) {
    const [hIni, mIni] = inicio.split(":").map(Number);
    const [hFim, mFim] = fim.split(":").map(Number);
    if (hasLuxon) {
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

  // Exibe os resultados na tabela
  function exibirResultado(calculo) {
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
      resumoAnotacoes.style.display = "block";
      resumoAnotacoes.innerHTML = `<i class="bi bi-journal-text"></i> <em>Anotações:</em> ${escaparHTML(
        calculo.anotacoes
      )}`;
    } else {
      resumoAnotacoes.style.display = "none";
      resumoAnotacoes.textContent = "";
    }

    resultadoVazio.style.display = "none";
    resultadoContainer.style.display = "block";
  }

  // Adiciona item ao histórico com botão de remoção
  function adicionarAoHistorico(calculo) {
    const itemId = Date.now(); // ID único para o item

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

    historicoLista.appendChild(item);
    ordenarHistoricoDOMAsc();
    historicoVazio.style.display = "none";
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

  // Remove um item específico do histórico
  function removerItemHistorico(id, calculo) {
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
        if (historicoLista.children.length === 0) {
          historicoVazio.style.display = "block";
          totalAcumulado.style.display = "none";
          totalPerdidoPensao.style.display = "none";
        }
      }
    });
  }

  // Atualiza totais acumulados
  function atualizarTotais() {
    document.getElementById(
      "total-horas-valor"
    ).textContent = `${appState.totalHoras.toFixed(2)}h`;
    document.getElementById("total-valor-acumulado").textContent =
      formatarMoeda(appState.totalValor);
    totalAcumulado.style.display = "block";
  }

  // Atualiza total perdido com pensão
  function atualizarTotalPensao() {
    document.getElementById("total-perdido-valor").textContent = formatarMoeda(
      appState.totalPensao
    );
    totalPerdidoPensao.style.display =
      appState.totalPensao > 0 ? "block" : "none";
  }

  // Persistência no localStorage
  function salvarDados() {
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
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  }

  // Carrega dados do localStorage
  function carregarDados() {
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

          historicoLista.appendChild(itemElement);

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
        historicoVazio.style.display = "none";
        atualizarTotais();
        atualizarTotalPensao();
        calendarSyncAll();
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  // Escapa texto para evitar inserção de HTML
  function escaparHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Converte dd/mm/aaaa para millis
  function obterMillisDeDataBR(dataStr) {
    const [dia, mes, ano] = dataStr.split("/").map(Number);
    return new Date(ano, mes - 1, dia).getTime();
  }

  // Ordena DOM do histórico por data crescente
  function ordenarHistoricoDOMAsc() {
    const items = Array.from(historicoLista.children);
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
    items.forEach((el) => historicoLista.appendChild(el));
  }

  // Edita um item do histórico
  function editarItemHistorico(id) {
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
              <input type="time" id="edit-inicio" class="form-control" value="${horaInicio}">
            </div>
            <div class="col">
              <label class="form-label fw-bold">Hora Final</label>
              <input type="time" id="edit-fim" class="form-control" value="${horaFim}">
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

      const formatarParaBusca = (hora) => {
        const [h, m] = hora.split(":");
        const horaFormatada = h.padStart(2, "0");
        return m === "00" ? `${horaFormatada}h` : `${horaFormatada}h${m}m`;
      };
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

  // Formatação de valores
  function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  // Função para tocar som de confirmação (bip)
  function tocarSomSucesso() {
    try {
      // Cria contexto de áudio
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Conecta os nós
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configura o oscilador (tipo de onda e frequência)
      oscillator.type = "sine";
      oscillator.frequency.value = 880; // Lá5 (frequência agradável)

      // Configura o ganho (volume)
      gainNode.gain.value = 0.3; // Volume moderado

      // Inicia o oscilador
      oscillator.start();

      // Fade out suave (para evitar estalo no fim)
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.3
      );

      // Para o oscilador após 300ms
      oscillator.stop(context.currentTime + 0.3);
    } catch (e) {
      console.log("Erro ao reproduzir som:", e);
    }
  }

  // Função para tocar som de limpeza (decrescente)
  function tocarSomLimpeza() {
    try {
      // Cria contexto de áudio
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Conecta os nós
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configura o oscilador
      oscillator.type = "sine";
      oscillator.frequency.value = 660; // Mi5 (frequência média)

      // Configura o ganho (volume)
      gainNode.gain.value = 0.4;

      // Inicia o oscilador
      oscillator.start();

      // Diminui a frequência gradualmente (de 660Hz para 220Hz)
      oscillator.frequency.exponentialRampToValueAtTime(
        220,
        context.currentTime + 0.8
      );

      // Fade out suave
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.8
      );

      // Para o oscilador após 800ms
      oscillator.stop(context.currentTime + 0.8);
    } catch (e) {
      console.log("Erro ao reproduzir som de limpeza:", e);
    }
  }

  // Função para tocar som de exclusão (curto e agudo)
  function tocarSomExclusao() {
    try {
      // Cria contexto de áudio
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      // Conecta os nós
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configura o oscilador
      oscillator.type = "sine";
      oscillator.frequency.value = 1000; // Frequência mais aguda

      // Configura o ganho (volume)
      gainNode.gain.value = 0.3;

      // Inicia o oscilador
      oscillator.start();

      // Fade out rápido
      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.15
      );

      // Para o oscilador após 150ms
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.log("Erro ao reproduzir som de exclusão:", e);
    }
  }

  // =============================================
  // 7. FUNÇÕES DE CONTROLE (LIMPEZA E EXPORTAÇÃO)
  // =============================================

  function limparTudo() {
    Swal.fire({
      title: "Confirmar limpeza",
      text: "Isso apagará todo o histórico e cálculos atuais. Continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, limpar tudo",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        form.reset();
        pensaoContainer.style.display = "none";
        resultadoContainer.style.display = "none";
        resultadoVazio.style.display = "block";
        historicoLista.innerHTML = "";
        historicoVazio.style.display = "block";
        appState.historico = [];
        appState.totalHoras = 0;
        appState.totalValor = 0;
        appState.totalPensao = 0;
        totalAcumulado.style.display = "none";
        totalPerdidoPensao.style.display = "none";
        localStorage.removeItem("ac4-historico");
        localStorage.removeItem("ac4-totais");
        Swal.fire("Limpo!", "Todos os dados foram apagados.", "success");

        // Toca som de limpeza
        tocarSomLimpeza();
      }
    });
  }

  // Função de exportação para PDF
  function exportarPDF() {
    if (historicoLista.children.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Nenhum histórico para exportar",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    // Criar elemento temporário com estilos inline
    const element = document.createElement("div");
    element.style.fontFamily = "Arial, sans-serif";
    element.style.padding = "20px";
    element.style.width = "100%";

    // Construir o conteúdo do PDF
    element.innerHTML = `
        <h3 style="text-align:center;color:#0d6efd;margin-bottom:5px;">Histórico AC-4</h3>
        <p style="text-align:center;color:#6c757d;margin-top:0;">Gerado em ${new Date().toLocaleDateString(
          "pt-BR"
        )}</p>
        
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <thead>
                <tr style="background-color:#f8f9fa;">
                    <th style="border:1px solid #ddd;padding:8px;text-align:left;">Data</th>
                    <th style="border:1px solid #ddd;padding:8px;text-align:left;">Período</th>
                    <th style="border:1px solid #ddd;padding:8px;text-align:left;">Anotações</th>
                    <th style="border:1px solid #ddd;padding:8px;text-align:right;">Horas</th>
                    <th style="border:1px solid #ddd;padding:8px;text-align:right;">Valor</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(historicoLista.children)
                  .sort(
                    (a, b) =>
                      Number(
                        a.dataset.dateMilli ||
                          obterMillisDeDataBR(a.querySelector("h6").textContent)
                      ) -
                      Number(
                        b.dataset.dateMilli ||
                          obterMillisDeDataBR(b.querySelector("h6").textContent)
                      )
                  )
                  .map((item) => {
                    const data = item.querySelector("h6").textContent;
                    const periodo = item.querySelector("small").textContent;
                    const anotacoesEl = item.querySelector(".mt-1.text-muted");
                    const anotacoes = anotacoesEl
                      ? anotacoesEl.textContent.replace(/^Anotações:\s*/i, "")
                      : "";
                    const horas = item
                      .querySelector(".badge.bg-primary")
                      .textContent.replace("h totais", "");
                    const valor =
                      item.querySelector(".valor-liquido").textContent;
                    const valorOriginal =
                      item.querySelector(".valor-original")?.textContent || "";

                    return `
                    <tr>
                      <td style="border:1px solid #ddd;padding:8px;">${data}</td>
                      <td style="border:1px solid #ddd;padding:8px;">${periodo}</td>
                      <td style="border:1px solid #ddd;padding:8px;">${anotacoes}</td>
                      <td style="border:1px solid #ddd;padding:8px;text-align:right;">${horas}</td>
                      <td style="border:1px solid #ddd;padding:8px;text-align:right;">
                        ${
                          valorOriginal
                            ? `<span style="text-decoration:line-through;color:#999;">${valorOriginal}</span><br>`
                            : ""
                        }
                        ${valor}
                      </td>
                    </tr>
                  `;
                  })
                  .join("")}
            </tbody>
        </table>
        
        <div style="margin-top:20px;text-align:right;font-weight:bold;">
            Total Acumulado: ${formatarMoeda(
              appState.totalValor
            )} (${appState.totalHoras.toFixed(2)}h)
        </div>
        ${
          appState.totalPensao > 0
            ? `
        <div style="margin-top:10px;text-align:right;font-weight:bold;color:#dc3545;">
            Total Perdido para Pensão: ${formatarMoeda(appState.totalPensao)}
        </div>
        `
            : ""
        }
    `;

    // Configurações do PDF
    const opt = {
      margin: 10,
      filename: `historico_ac4_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    // Gerar PDF
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        Swal.fire({
          icon: "success",
          title: "PDF gerado com sucesso!",
          showConfirmButton: false,
          timer: 1500,
        });
      })
      .catch((err) => {
        console.error("Erro ao gerar PDF:", err);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Falha ao gerar PDF. Verifique o console para detalhes.",
          confirmButtonColor: "#0d6efd",
        });
      });
  }

  // =============================================
  // 8. INICIALIZAÇÃO DA APLICAÇÃO
  // =============================================

  // Listener para recarregar histórico quando eventos forem sincronizados
  window.addEventListener("historico-updated", () => {
    console.log("📊 Histórico atualizado - recarregando...");

    // Limpar lista atual
    historicoLista.innerHTML = "";

    // Recarregar dados
    carregarDados();
  });

  carregarDados();
});
