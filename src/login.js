/**
 * Login Page Script
 * VidaExtra® - Google Sign-In with Calendar Scope
 */

import { auth } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// DOM Elements
const googleSignInBtn = document.getElementById("google-signin-btn");
const loadingState = document.getElementById("loading-state");
const loginButtonContainer = document.getElementById("login-button-container");
const errorMessage = document.getElementById("error-message");
const errorText = document.getElementById("error-text");

// Backend API URL (ajuste conforme seu deploy)
const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5001/vidaextra-8db27/us-central1"
    : "https://us-central1-vidaextra-8db27.cloudfunctions.net";

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

    const response = await fetch(`${API_URL}/registerCredentials`, {
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
    window.location.href = "../index.html";
  }, 1000);
}

/**
 * Manipula o login com Google
 */
async function handleGoogleSignIn() {
  showLoading();

  try {
    const provider = setupGoogleProvider();

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
  const userData = localStorage.getItem("vidaextra-user");

  if (userData) {
    try {
      const user = JSON.parse(userData);
      const loginAge = Date.now() - (user.loginTimestamp || 0);

      // Se o login tem menos de 24 horas, redireciona automaticamente
      if (loginAge < 24 * 60 * 60 * 1000) {
        console.log("Usuário já logado, redirecionando...");
        redirectToApp();
        return true;
      }
    } catch (e) {
      console.error("Erro ao verificar usuário existente:", e);
      localStorage.removeItem("vidaextra-user");
    }
  }

  return false;
}

/**
 * Inicialização
 */
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se já está logado
  if (checkExistingUser()) {
    showLoading();
    return;
  }

  // Adiciona event listener ao botão
  googleSignInBtn.addEventListener("click", handleGoogleSignIn);

  console.log("Login page initialized");
});

// Export para uso em outros módulos
export { handleGoogleSignIn, checkExistingUser };
