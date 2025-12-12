/**
 * Air Datepicker Time Picker Initialization
 * Substitui o time picker nativo por um modal customizado
 */

// Locale em Português - exportado globalmente para reutilização
const localePtBR = {
  days: [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ],
  daysShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  daysMin: ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"],
  months: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthsShort: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],
  today: "Hoje",
  clear: "Limpar",
  dateFormat: "dd/MM/yyyy",
  timeFormat: "HH:mm",
  firstDay: 0,
};

// Botão customizado "Confirmar" para Air Datepicker
const confirmButton = {
  content: "Confirmar",
  className: "air-datepicker-button-confirm",
  onClick: (dp) => {
    dp.hide();
  }
};

// Expor locale e botão globalmente para uso em outros módulos
window.AirDatepickerLocalePt = localePtBR;
window.AirDatepickerConfirmBtn = confirmButton;

document.addEventListener("DOMContentLoaded", function () {
  // Verifica se Air Datepicker está disponível
  if (typeof AirDatepicker === "undefined") {
    console.error("❌ Air Datepicker não foi carregado!");
    return;
  }

  // Configuração comum
  const commonConfig = {
    locale: localePtBR,
    timepicker: true,
    onlyTimepicker: true, // Apenas seletor de tempo
    classes: "vidaextra-datepicker", // Classe customizada para CSS
    autoClose: false, // Desabilitado - confirmação via botão
    isMobile: true, // Ativa modo mobile nativo da lib se disponível
    minutesStep: 1,
    buttons: ["clear", confirmButton], // Botões: Limpar e Confirmar
  };

  // Inicializa Hora Inicial
  const horaInicioInput = document.getElementById("hora-inicio");
  if (horaInicioInput) {
    new AirDatepicker(horaInicioInput, {
      ...commonConfig,
      selectedDates: [new Date().setHours(8, 0, 0, 0)], // Default 08:00
      onSelect: () => {
        // Validação ou lógica extra se necessário
      },
    });
    // Remove readonly para permitir digitação se o usuário preferir
    // Mas o Air Datepicker lida bem com readonly em mobile
    horaInicioInput.setAttribute("readonly", "true"); 
  }

  // Inicializa Hora Final
  const horaFimInput = document.getElementById("hora-fim");
  if (horaFimInput) {
    new AirDatepicker(horaFimInput, {
      ...commonConfig,
      selectedDates: [new Date().setHours(17, 0, 0, 0)], // Default 17:00
    });
    horaFimInput.setAttribute("readonly", "true");
  }

  console.log("✅ Air Datepicker inicializado com sucesso!");
});
