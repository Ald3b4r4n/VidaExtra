/**
 * VidaExtra® - Módulo de Exportação PDF
 * pdf-export.js - Geração de relatórios em PDF
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

import { appState, domRefs } from './state.js';
import { formatarMoeda, obterMillisDeDataBR } from './utils.js';

/**
 * Exporta o histórico para PDF com design premium
 */
export function exportarPDF() {
  if (domRefs.historicoLista.children.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Nenhum histórico para exportar",
      confirmButtonColor: "#0d6efd",
    });
    return;
  }

  // Coletar dados do histórico
  const historicoOrdenado = Array.from(domRefs.historicoLista.children)
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
      const valor = item.querySelector(".valor-liquido").textContent;
      const valorOriginal =
        item.querySelector(".valor-original")?.textContent || "";
      return { data, periodo, anotacoes, horas, valor, valorOriginal };
    });

  // Data de geração
  const dataGeracao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Criar elemento temporário com design premium
  const element = document.createElement("div");
  element.style.cssText = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    width: 100%;
    background: linear-gradient(180deg, #f8f9fa 0%, #e7f5ff 50%, #f8f9fa 100%);
    min-height: 100vh;
    padding: 0;
    margin: 0;
  `;

  element.innerHTML = `
    <!-- Header com gradiente -->
    <div style="
      background: linear-gradient(135deg, #0d6efd 0%, #20c997 100%);
      color: white;
      padding: 30px 40px;
      border-radius: 0 0 20px 20px;
      margin-bottom: 25px;
      box-shadow: 0 4px 20px rgba(13, 110, 253, 0.3);
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: 2px solid rgba(255,255,255,0.4);
          ">🛡️</div>
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
              VidaExtra<sup style="font-size: 14px;">®</sup>
            </h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">
              Calculadora de Horas Extras AC-4
            </p>
          </div>
        </div>
        <div style="text-align: right; margin-top: 10px;">
          <p style="margin: 0; font-size: 12px; opacity: 0.85;">Relatório gerado em</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 600;">${dataGeracao}</p>
        </div>
      </div>
    </div>
    
    <!-- Conteúdo principal -->
    <div style="padding: 0 30px;">
      <!-- Cards de resumo -->
      <div style="
        display: flex;
        gap: 12px;
        margin-bottom: 25px;
        flex-wrap: nowrap;
      ">
        <div style="
          flex: 1;
          min-width: 0;
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-left: 4px solid #0d6efd;
          overflow: hidden;
        ">
          <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Total de Registros</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #0d6efd;">${historicoOrdenado.length}</p>
        </div>
        <div style="
          flex: 1;
          min-width: 0;
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-left: 4px solid #20c997;
          overflow: hidden;
        ">
          <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Horas Trabalhadas</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #20c997;">${appState.totalHoras.toFixed(2)}h</p>
        </div>
        <div style="
          flex: 1;
          min-width: 0;
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-left: 4px solid #198754;
          overflow: hidden;
        ">
          <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Valor Total Líquido</p>
          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #198754; white-space: nowrap;">${formatarMoeda(appState.totalValor)}</p>
        </div>
        ${appState.totalPensao > 0 ? `
        <div style="
          flex: 1;
          min-width: 0;
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-left: 4px solid #dc3545;
          overflow: hidden;
        ">
          <p style="margin: 0; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">Desconto Pensão</p>
          <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 700; color: #dc3545; white-space: nowrap;">${formatarMoeda(appState.totalPensao)}</p>
        </div>
        ` : ''}
      </div>
      
      <!-- Título da tabela -->
      <h2 style="
        font-size: 18px;
        color: #212529;
        margin: 0 0 15px 0;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #0d6efd 0%, #20c997 100%);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        ">📋</span>
        Detalhamento dos Serviços
      </h2>
      
      <!-- Tabela estilizada -->
      <table style="
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      ">
        <thead>
          <tr style="background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);">
            <th style="padding: 14px 12px; text-align: left; color: white; font-weight: 600; font-size: 13px;">Data</th>
            <th style="padding: 14px 12px; text-align: left; color: white; font-weight: 600; font-size: 13px;">Período</th>
            <th style="padding: 14px 12px; text-align: left; color: white; font-weight: 600; font-size: 13px;">Anotações</th>
            <th style="padding: 14px 12px; text-align: center; color: white; font-weight: 600; font-size: 13px;">Horas</th>
            <th style="padding: 14px 12px; text-align: right; color: white; font-weight: 600; font-size: 13px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${historicoOrdenado.map((item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'}; page-break-inside: avoid; break-inside: avoid;">
              <td style="padding: 12px; border-bottom: 1px solid #e9ecef; font-weight: 600; color: #0d6efd;">${item.data}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e9ecef; color: #495057;">${item.periodo}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e9ecef; color: #6c757d; font-size: 12px; max-width: 200px;">${item.anotacoes || '-'}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center;">
                <span style="
                  background: #e7f5ff;
                  color: #0d6efd;
                  padding: 4px 10px;
                  border-radius: 20px;
                  font-weight: 600;
                  font-size: 12px;
                ">${item.horas}h</span>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: right;">
                ${item.valorOriginal ? `<span style="text-decoration: line-through; color: #adb5bd; font-size: 11px; display: block;">${item.valorOriginal}</span>` : ''}
                <span style="color: #198754; font-weight: 700;">${item.valor}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="
      margin-top: 40px;
      padding: 25px 40px;
      background: linear-gradient(135deg, #212529 0%, #343a40 100%);
      color: white;
      border-radius: 20px 20px 0 0;
      page-break-inside: avoid;
      break-inside: avoid;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
        <div>
          <p style="margin: 0; font-size: 14px; font-weight: 600;">
            © VidaExtra® - Todos os direitos reservados
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">
            Desenvolvido por <strong>CB Antônio Rafael</strong> - 14ª CIPM
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 11px; opacity: 0.7;">
            Documento gerado automaticamente
          </p>
          <p style="margin: 3px 0 0 0; font-size: 11px; opacity: 0.7;">
            Este relatório é válido para fins de controle interno
          </p>
        </div>
      </div>
    </div>
  `;

  // Configurações do PDF
  const opt = {
    margin: [10, 0, 10, 0], // top, right, bottom, left (mm)
    filename: `vidaextra_ac4_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: '#f8f9fa',
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: 'tr, .avoid-break'
    }
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
        text: "Seu relatório VidaExtra® foi exportado",
        showConfirmButton: false,
        timer: 2000,
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
