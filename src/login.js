/**
 * Login Page Script
 * VidaExtra® - Google Sign-In with Calendar Scope
 */

import { auth, firebasePromise } from "./firebase-config.js";
import { apiFetch } from "./api.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("login.js: Carregando..."); // DEBUG

// DOM Elements
const googleSignInBtn = document.getElementById("google-signin-btn");
const loadingState = document.getElementById("loading-state");
const loginButtonContainer = document.getElementById("login-button-container");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");

// Backend API calls will use apiFetch, which auto-detects local emulator or production

/**
 * Configura o Google Auth Provider com escopos do Calendar
 */
function setupGoogleProvider() {
  const provider = new GoogleAuthProvider();

  // Adiciona escopos do Google Calendar
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");

  // Força seleção de conta
  provider.setCustomParameters({
    prompt: "select_account",
  });

  return provider;
}

/**
 * Mostra estado de carregamento
 */
function showLoading() {
  loginButtonContainer.classList.add("d-none");
  errorMessage.classList.add("d-none");
  loadingState.classList.remove("d-none");
}

/**
 * Esconde estado de carregamento
 */
function hideLoading() {
  loadingState.classList.add("d-none");
  loginButtonContainer.classList.remove("d-none");
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove("d-none");
  hideLoading();
}

/**
 * Registra credenciais OAuth no backend
 */
async function registerCredentials(user, credential) {
  try {
    const idToken = await user.getIdToken();

    const response = await apiFetch(`/registerCredentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accessToken: credential.accessToken,
        // O backend trocará o accessToken por refreshToken
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao registrar credenciais");
    }

    const data = await response.json();
    console.log("Credenciais registradas com sucesso:", data);
    return data;
  } catch (error) {
    console.error("Erro ao registrar credenciais:", error);
    throw error;
  }
}

/**
 * Salva dados do usuário no localStorage
 */
function saveUserToLocalStorage(user, credential) {
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    accessToken: credential.accessToken,
    loginTimestamp: Date.now(),
  };

  localStorage.setItem("vidaextra-user", JSON.stringify(userData));
  console.log("Usuário salvo no localStorage");
}

/**
 * Redireciona para a página principal
 */
function redirectToApp() {
  // Pequeno delay para dar feedback visual
  setTimeout(() => {
    window.location.href = "/index.html";
  }, 1000);
}

/**
 * Manipula o login com Google
 */
async function handleGoogleSignIn() {
  console.log("handleGoogleSignIn chamado!"); // DEBUG
  showLoading();

  try {
    const provider = setupGoogleProvider();
    console.log("Provider configurado, abrindo popup..."); // DEBUG

    // Popup de autenticação
    const result = await signInWithPopup(auth, provider);

    // Extrai credenciais
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    console.log("Login bem-sucedido:", {
      user: user.email,
      isNewUser: additionalInfo.isNewUser,
    });

    // Salva no localStorage
    saveUserToLocalStorage(user, credential);

    // Registra credenciais no backend
    try {
      await registerCredentials(user, credential);
    } catch (backendError) {
      console.warn(
        "Erro ao registrar no backend, mas login continua:",
        backendError
      );
      // Não bloqueia o login se o backend falhar
    }

    // Redireciona para o app
    redirectToApp();
  } catch (error) {
    console.error("Erro no login:", error);

    // Mensagens de erro amigáveis
    let errorMsg = "Erro ao fazer login. Tente novamente.";

    // Fallback: se popup foi bloqueado ou COOP impedir acesso, usar redirect
    const coopRelated =
      (typeof error.message === "string" &&
        (error.message.includes("Cross-Origin-Opener-Policy") ||
          error.message.includes("window.closed"))) ||
      error.code === "auth/popup-blocked" ||
      error.code === "auth/cancelled-popup-request";

    if (coopRelated) {
      console.warn(
        "Popup bloqueado/COOP em vigor. Alternando para signInWithRedirect..."
      );
      try {
        const provider = setupGoogleProvider();
        await signInWithRedirect(auth, provider);
        return; // A navegação será realizada pelo Firebase
      } catch (redirectErr) {
        console.error("Falha no redirect:", redirectErr);
      }
    }

    if (error.code === "auth/popup-closed-by-user") {
      errorMsg = "Login cancelado. Tente novamente.";
    } else if (error.code === "auth/network-request-failed") {
      errorMsg = "Erro de conexão. Verifique sua internet.";
    } else if (error.code === "auth/unauthorized-domain") {
      errorMsg = "Domínio não autorizado. Configure o Firebase.";
    } else if (error.message) {
      errorMsg = error.message;
    }

    showError(errorMsg);
  }
}

/**
 * Verifica se já existe usuário logado
 */
function checkExistingUser() {
  // Verifica o estado do Firebase Auth primeiro
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe(); // Desinscreve após primeira verificação

      if (user) {
        // Usuário autenticado no Firebase
        console.log("Usuário já logado no Firebase, redirecionando...");
        showLoading();
        redirectToApp();
        resolve(true);
      } else {
        // Limpa localStorage se não estiver autenticado
        localStorage.removeItem("vidaextra-user");
        resolve(false);
      }
    });
  });
}

/**
 * Inicialização
 */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded, inicializando..."); // DEBUG

  // Aguarda Firebase inicializar
  try {
    await firebasePromise;
    console.log("Firebase pronto, continuando inicialização..."); // DEBUG
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    showError("Erro ao conectar com o servidor. Recarregue a página.");
    return;
  }

  // Trata resultado de signInWithRedirect (quando usado como fallback)
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult) {
      console.log("Login via redirect detectado. Prosseguindo...");
      const credential = GoogleAuthProvider.credentialFromResult(
        redirectResult
      );
      const user = redirectResult.user;
      const additionalInfo = getAdditionalUserInfo(redirectResult);

      console.log("Login bem-sucedido (redirect):", {
        user: user.email,
        isNewUser: additionalInfo?.isNewUser,
      });

      saveUserToLocalStorage(user, credential);
      try {
        await registerCredentials(user, credential);
      } catch (backendError) {
        console.warn(
          "Erro ao registrar no backend após redirect, seguindo login:",
          backendError
        );
      }
      redirectToApp();
      return; // encerra inicialização, já vai redirecionar
    }
  } catch (redirectCheckErr) {
    console.warn("Sem resultado de redirect ou erro ao verificar:", redirectCheckErr);
  }

  // Verifica se já está logado (assíncrono)
  const isLoggedIn = await checkExistingUser();

  if (isLoggedIn) {
    console.log("Usuário já logado, redirecionando..."); // DEBUG
    return; // Já está redirecionando
  }

  console.log("Adicionando event listener ao botão..."); // DEBUG

  // Verifica se o botão existe
  if (!googleSignInBtn) {
    console.error("ERRO: Botão google-signin-btn não encontrado!");
    return;
  }

  // Adiciona event listener ao botão
  googleSignInBtn.addEventListener("click", () => {
    console.log("Botão clicado!"); // DEBUG
    handleGoogleSignIn();
  });

  console.log("Login page initialized - Event listener adicionado!");
});

// Export para uso em outros módulos
export { handleGoogleSignIn, checkExistingUser };
