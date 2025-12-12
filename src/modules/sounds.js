/**
 * VidaExtra® - Módulo de Sons
 * sounds.js - Efeitos sonoros da aplicação
 * Desenvolvido por CB Antônio Rafael - 14ª CIPM
 */

/**
 * Toca som de confirmação/sucesso (bip agudo)
 */
export function tocarSomSucesso() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 880; // Lá5

    gainNode.gain.value = 0.3;

    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.3
    );

    oscillator.stop(context.currentTime + 0.3);
  } catch (e) {
    console.log("Erro ao reproduzir som:", e);
  }
}

/**
 * Toca som de limpeza (frequência decrescente)
 */
export function tocarSomLimpeza() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 660; // Mi5

    gainNode.gain.value = 0.4;

    oscillator.start();

    oscillator.frequency.exponentialRampToValueAtTime(
      220,
      context.currentTime + 0.8
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.8
    );

    oscillator.stop(context.currentTime + 0.8);
  } catch (e) {
    console.log("Erro ao reproduzir som de limpeza:", e);
  }
}

/**
 * Toca som de exclusão (bip curto e agudo)
 */
export function tocarSomExclusao() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 1000;

    gainNode.gain.value = 0.3;

    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.15
    );

    oscillator.stop(context.currentTime + 0.15);
  } catch (e) {
    console.log("Erro ao reproduzir som de exclusão:", e);
  }
}
