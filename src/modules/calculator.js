/**
 * VidaExtra® - Módulo de Cálculo
 * calculator.js - Lógica de cálculo de horas extras AC-4
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

import { appState, domRefs, hasLuxon, getLuxon } from './state.js';
import { formatarMoeda, formatarData, formatarParaBusca } from './utils.js';
import { 
  calcularDiferencaHoras, 
  verificarDuplicata, 
  adicionarAoHistorico, 
  exibirResultado,
  salvarDados 
} from './history.js';
import { tocarSomSucesso } from './sounds.js';

/**
 * Função principal de cálculo de horas extras
 */
export function calcularHoras() {
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
  const temPensao = domRefs.pensaoCheckbox.checked;
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
  
  let diaSemana;
  if (hasLuxon()) {
    const { DateTime } = getLuxon();
    diaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
      DateTime.fromJSDate(dataObj).weekday % 7
    ];
  } else {
    diaSemana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"][
      dataObj.getDay()
    ];
  }

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

  // Verifica se já existe duplicata
  if (verificarDuplicata(novoItem)) {
    // Reverte os totais que foram adicionados anteriormente
    appState.totalHoras -= horasTotais;
    appState.totalValor -= totalLiquido;
    appState.totalPensao -= descontoPensao;

    Swal.fire({
      icon: "warning",
      title: "Evento duplicado",
      html: `Já existe um cálculo com os mesmos dados:<br>
             <strong>${novoItem.data}</strong> - ${novoItem.periodo}<br>
             Valor: ${formatarMoeda(novoItem.totalLiquido)}<br>
             ${
               novoItem.percentualPensao > 0
                 ? `Pensão: ${novoItem.percentualPensao}%`
                 : "Sem pensão"
             }`,
      confirmButtonColor: "#0d6efd",
      confirmButtonText: "Entendi",
    });
    return;
  }

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

    import("../reminders.js")
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
            import("../auth.js").then((authModule) => {
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

/**
 * Carrega os valores AC-4 do JSON
 * @returns {Promise<void>}
 */
export async function carregarValoresAC4() {
  try {
    const response = await fetch("valores-ac4.json");
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    
    const data = await response.json();
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
  } catch (error) {
    console.error("Erro ao carregar valores:", error);
    Swal.fire({
      icon: "error",
      title: "Erro",
      html: `Não foi possível carregar os valores.<br><small>${error.message}</small>`,
      confirmButtonColor: "#0d6efd",
    });
  }
}

/**
 * Limpa todos os dados
 */
export function limparTudo() {
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
      domRefs.form.reset();
      domRefs.pensaoContainer.style.display = "none";
      domRefs.resultadoContainer.style.display = "none";
      domRefs.resultadoVazio.style.display = "block";
      domRefs.historicoLista.innerHTML = "";
      domRefs.historicoVazio.style.display = "block";
      appState.historico = [];
      appState.totalHoras = 0;
      appState.totalValor = 0;
      appState.totalPensao = 0;
      domRefs.totalAcumulado.style.display = "none";
      domRefs.totalPerdidoPensao.style.display = "none";
      localStorage.removeItem("ac4-historico");
      localStorage.removeItem("ac4-totais");
      Swal.fire("Limpo!", "Todos os dados foram apagados.", "success");

      // Toca som de limpeza
      import('./sounds.js').then(mod => mod.tocarSomLimpeza());
    }
  });
}
