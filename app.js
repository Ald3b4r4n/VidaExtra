/**
 * VidaExtra® - Calculadora AC-4
 * app.js - Código principal da aplicação
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

document.addEventListener('DOMContentLoaded', function() {
  // =============================================
  // 1. SELEÇÃO DE ELEMENTOS DO DOM
  // =============================================
  const form = document.getElementById('form-calculo');
  const btnLimpar = document.getElementById('btn-limpar');
  const btnExportar = document.getElementById('btn-exportar');
  const pensaoCheckbox = document.getElementById('pensao-alimenticia');
  const pensaoContainer = document.getElementById('pensao-container');
  const resultadoContainer = document.getElementById('resultado-container');
  const resultadoVazio = document.getElementById('resultado-vazio');
  const historicoLista = document.getElementById('historico-lista');
  const historicoVazio = document.getElementById('historico-vazio');
  const totalAcumulado = document.getElementById('total-acumulado');

  // =============================================
  // 2. ESTADO DA APLICAÇÃO
  // =============================================
  const appState = {
    valoresAC4: [],       // Armazena os valores do JSON
    historico: [],        // Histórico de cálculos
    totalHoras: 0,        // Total de horas acumuladas
    totalValor: 0,        // Total monetário acumulado
    carregado: false      // Flag se os dados foram carregados
  };

  // =============================================
  // 3. CARREGAMENTO DOS VALORES DO JSON
  // =============================================
  fetch('valores-ac4.json')
    .then(response => {
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return response.json();
    })
    .then(data => {
      // Aceita tanto {valores: [...]} quanto array direto
      const valores = data.valores || data;
      
      if (!Array.isArray(valores)) throw new Error('Formato inválido: esperado array de valores');
      
      // Normaliza os horários para busca
      appState.valoresAC4 = valores.map(item => ({
        ...item,
        horarioBusca: item.horario
          .replace(/\(\d+h\)$/, '')  // Remove (XXh)
          .replace(/_/g, ' ')        // Substitui underscores
          .trim()
      }));
      
      appState.carregado = true;
      console.log('Dados carregados com sucesso!');
    })
    .catch(error => {
      console.error('Erro ao carregar valores:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        html: `Não foi possível carregar os valores.<br><small>${error.message}</small>`,
        confirmButtonColor: '#0d6efd'
      });
    });

  // =============================================
  // 4. CONFIGURAÇÃO DE EVENT LISTENERS
  // =============================================
  pensaoCheckbox.addEventListener('change', function() {
    pensaoContainer.style.display = this.checked ? 'block' : 'none';
  });

  btnLimpar.addEventListener('click', limparTudo);
  btnExportar.addEventListener('click', exportarPDF);
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    calcularHoras();
  });

  // =============================================
  // 5. FUNÇÃO PRINCIPAL DE CÁLCULO
  // =============================================
  function calcularHoras() {
    if (!appState.carregado) {
      Swal.fire({
        icon: 'error',
        title: 'Atenção',
        text: 'Os valores ainda não foram carregados. Por favor, aguarde.',
        confirmButtonColor: '#0d6efd'
      });
      return;
    }

    // Obtém valores dos inputs
    const dataInput = document.getElementById('data-servico').value;
    const horaInicio = document.getElementById('hora-inicio').value;
    const horaFim = document.getElementById('hora-fim').value;
    const temPensao = pensaoCheckbox.checked;
    const percentualPensao = parseFloat(document.getElementById('percentual-pensao').value) || 0;

    // Validação básica
    if (!dataInput || !horaInicio || !horaFim) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Atenção', 
        text: 'Preencha todos os campos obrigatórios', 
        confirmButtonColor: '#0d6efd' 
      });
      return;
    }

    // Processamento da data
    const [ano, mes, dia] = dataInput.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'][dataObj.getDay()];
    
    // Formatação para busca no JSON
    const formatarParaBusca = (hora) => {
      const [h, m] = hora.split(':');
      const horaFormatada = h.padStart(2, '0');
      return m === '00' ? `${horaFormatada}h` : `${horaFormatada}h${m}m`;
    };

    const horaInicioFormatada = formatarParaBusca(horaInicio);
    const horaFimFormatada = formatarParaBusca(horaFim);
    const chaveBusca = `${horaInicioFormatada} as ${horaFimFormatada}`;

    // Busca no JSON
    const valorEncontrado = appState.valoresAC4.find(item => {
      return item.horarioBusca.toLowerCase() === chaveBusca.toLowerCase();
    });

    if (!valorEncontrado) {
      const horariosDisponiveis = [...new Set(
        appState.valoresAC4.slice(0, 5).map(v => v.horarioBusca)
      )].join(', ');
      
      Swal.fire({ 
        icon: 'error', 
        title: 'Horário não encontrado', 
        html: `Nenhum valor cadastrado para:<br>
               <strong>${horaInicio} às ${horaFim}</strong><br>
               Formato buscado: ${chaveBusca}<br>
               Exemplos disponíveis: ${horariosDisponiveis}...`,
        confirmButtonColor: '#0d6efd' 
      });
      return;
    }

    // Cálculos financeiros
    const horasTotais = valorEncontrado.horas || calcularDiferencaHoras(horaInicio, horaFim);
    const totalBruto = parseFloat(valorEncontrado[diaSemana]);
    const descontoPensao = temPensao ? parseFloat((totalBruto * (percentualPensao / 100)).toFixed(2)) : 0;
    const totalLiquido = parseFloat((totalBruto - descontoPensao).toFixed(2));

    // Atualiza estado
    appState.totalHoras += horasTotais;
    appState.totalValor += totalLiquido;

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
      totalLiquido 
    });

    // Adiciona ao histórico
    adicionarAoHistorico({ 
      data: formatarData(dataObj), 
      periodo: `${horaInicio} às ${horaFim}`,
      horasTotais,
      totalLiquido,
      percentualPensao: temPensao ? percentualPensao : 0 
    });

    salvarDados();
  }

  // =============================================
  // 6. FUNÇÕES AUXILIARES
  // =============================================

  // Calcula diferença entre horários
  function calcularDiferencaHoras(inicio, fim) {
    const [hIni, mIni] = inicio.split(':').map(Number);
    const [hFim, mFim] = fim.split(':').map(Number);
    
    let diffHoras = hFim - hIni;
    let diffMinutos = mFim - mIni;
    
    if (diffMinutos < 0) {
      diffMinutos += 60;
      diffHoras--;
    }
    if (diffHoras < 0) diffHoras += 24;
    
    return diffHoras + (diffMinutos / 60);
  }

  // Exibe os resultados na tabela 
  function exibirResultado(calculo) {
    document.getElementById('horas-diurnas').textContent = calculo.horasTotais.toFixed(2);
    document.getElementById('total-diurno').textContent = formatarMoeda(calculo.totalBruto);
    document.getElementById('total-bruto').textContent = formatarMoeda(calculo.totalBruto);
    document.getElementById('total-liquido').textContent = formatarMoeda(calculo.totalLiquido);

    if (calculo.temPensao) {
      document.getElementById('linha-pensao').style.display = '';
      document.getElementById('desconto-pensao').textContent = `- ${formatarMoeda(calculo.descontoPensao)}`;
    } else {
      document.getElementById('linha-pensao').style.display = 'none';
    }

    document.getElementById('resumo-periodo').innerHTML = `
      <strong>${calculo.data}</strong> (${calculo.diaSemana.charAt(0).toUpperCase() + calculo.diaSemana.slice(1)})<br>
      Período: ${calculo.periodo}
    `;

    resultadoVazio.style.display = 'none';
    resultadoContainer.style.display = 'block';
  }

  // Adiciona item ao histórico
  function adicionarAoHistorico(calculo) {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    item.innerHTML = `
      <div class="d-flex justify-content-between">
        <div>
          <h6 class="mb-1">${calculo.data}</h6>
          <small>${calculo.periodo}</small>
        </div>
        <span class="badge bg-success">${formatarMoeda(calculo.totalLiquido)}</span>
      </div>
      <div class="mt-2">
        <span class="badge bg-primary">${calculo.horasTotais.toFixed(2)}h totais</span>
        ${calculo.percentualPensao > 0 ? `<span class="badge bg-warning text-dark">Pensão ${calculo.percentualPensao}%</span>` : ''}
      </div>
    `;
    historicoLista.prepend(item);
    historicoVazio.style.display = 'none';
    atualizarTotais();

    appState.historico.unshift({
      ...calculo,
      timestamp: new Date().getTime()
    });
  }

  // Atualiza totais acumulados
  function atualizarTotais() {
    document.getElementById('total-horas-valor').textContent = `${appState.totalHoras.toFixed(2)}h`;
    document.getElementById('total-valor-acumulado').textContent = formatarMoeda(appState.totalValor);
    totalAcumulado.style.display = 'block';
  }

  // Persistência no localStorage
  function salvarDados() {
    try {
      localStorage.setItem('ac4-historico', JSON.stringify(appState.historico));
      localStorage.setItem('ac4-totais', JSON.stringify({
        horas: appState.totalHoras,
        valor: appState.totalValor
      }));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  // Carrega dados do localStorage
  function carregarDados() {
    try {
      const historico = JSON.parse(localStorage.getItem('ac4-historico')) || [];
      const totais = JSON.parse(localStorage.getItem('ac4-totais')) || { horas: 0, valor: 0 };

      appState.historico = historico;
      appState.totalHoras = totais.horas;
      appState.totalValor = totais.valor;

      historico.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item';
        itemElement.innerHTML = `
          <div class="d-flex justify-content-between">
            <div>
              <h6 class="mb-1">${item.data}</h6>
              <small>${item.periodo}</small>
            </div>
            <span class="badge bg-success">${formatarMoeda(item.totalLiquido)}</span>
          </div>
          <div class="mt-2">
            <span class="badge bg-primary">${item.horasTotais.toFixed(2)}h totais</span>
            ${item.percentualPensao > 0 ? `<span class="badge bg-warning text-dark">Pensão ${item.percentualPensao}%</span>` : ''}
          </div>
        `;
        historicoLista.appendChild(itemElement);
      });

      if (historico.length > 0) {
        historicoVazio.style.display = 'none';
        atualizarTotais();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  // Formatação de valores
  function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  // =============================================
  // 7. FUNÇÕES DE CONTROLE (LIMPEZA E EXPORTAÇÃO)
  // =============================================

  function limparTudo() {
    Swal.fire({
      title: 'Confirmar limpeza',
      text: 'Isso apagará todo o histórico e cálculos atuais. Continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, limpar tudo',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        form.reset();
        pensaoContainer.style.display = 'none';
        resultadoContainer.style.display = 'none';
        resultadoVazio.style.display = 'block';
        historicoLista.innerHTML = '';
        historicoVazio.style.display = 'block';
        appState.historico = [];
        appState.totalHoras = 0;
        appState.totalValor = 0;
        totalAcumulado.style.display = 'none';
        localStorage.removeItem('ac4-historico');
        localStorage.removeItem('ac4-totais');
        Swal.fire('Limpo!', 'Todos os dados foram apagados.', 'success');
      }
    });
  }

  // Função de exportação para PDF CORRIGIDA
  function exportarPDF() {
    if (historicoLista.children.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Atenção',
            text: 'Nenhum histórico para exportar',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    // Criar elemento temporário com estilos inline
    const element = document.createElement('div');
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.padding = '20px';
    element.style.width = '100%';
    
    // Adicionar um pequeno delay para garantir que o elemento está pronto
    setTimeout(() => {
        // Construir o conteúdo do PDF
        element.innerHTML = `
            <h3 style="text-align:center;color:#0d6efd;margin-bottom:5px;">Histórico AC-4</h3>
            <p style="text-align:center;color:#6c757d;margin-top:0;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
            
            <table style="width:100%;border-collapse:collapse;margin-top:20px;">
                <thead>
                    <tr style="background-color:#f8f9fa;">
                        <th style="border:1px solid #ddd;padding:8px;text-align:left;">Data</th>
                        <th style="border:1px solid #ddd;padding:8px;text-align:left;">Período</th>
                        <th style="border:1px solid #ddd;padding:8px;text-align:right;">Horas</th>
                        <th style="border:1px solid #ddd;padding:8px;text-align:right;">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(historicoLista.children).map(item => `
                        <tr>
                            <td style="border:1px solid #ddd;padding:8px;">${item.querySelector('h6').textContent}</td>
                            <td style="border:1px solid #ddd;padding:8px;">${item.querySelector('small').textContent}</td>
                            <td style="border:1px solid #ddd;padding:8px;text-align:right;">${item.querySelector('.badge.bg-primary').textContent.replace('h totais', '')}</td>
                            <td style="border:1px solid #ddd;padding:8px;text-align:right;">${item.querySelector('.badge.bg-success').textContent}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top:20px;text-align:right;font-weight:bold;">
                Total: ${formatarMoeda(appState.totalValor)} (${appState.totalHoras.toFixed(2)}h)
            </div>
        `;

        // Configurações do PDF
        const opt = {
            margin: 10,
            filename: `historico_ac4_${new Date().toISOString().slice(0,10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                logging: true,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };

        // Gerar PDF
        html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'PDF gerado com sucesso!',
                    showConfirmButton: false,
                    timer: 1500
                });
            })
            .catch(err => {
                console.error('Erro ao gerar PDF:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Falha ao gerar PDF. Verifique o console para detalhes.',
                    confirmButtonColor: '#0d6efd'
                });
            });
    }, 100); // Pequeno delay de 100ms
}

  // =============================================
  // 8. INICIALIZAÇÃO DA APLICAÇÃO
  // =============================================
  carregarDados();
});
