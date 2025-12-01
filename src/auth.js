/**
 * Authentication Guard
 * Verifies user login and redirects if necessary
 */

import { auth, firebasePromise } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Verifica se usuário está autenticado
 */
export function checkAuth() {
  return new Promise(async (resolve) => {
    // Aguarda o Firebase estar totalmente inicializado antes de escutar o estado
    try {
      await firebasePromise;
    } catch (e) {
      console.error("Falha ao inicializar Firebase antes de checkAuth:", e);
      // Em caso de falha crítica, force retorno ao login
      window.location.replace("/pages/login.html");
      return resolve(null);
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuário está logado
        console.log("User authenticated:", user.email);

        // Se estiver na página de login, redireciona para a aplicação
        const currentPath = window.location.pathname;
        if (currentPath === "/pages/login.html") {
          window.location.replace("/index.html");
          return resolve(user);
        }

        updateUIWithUser(user);

        // Check if this is a new user (first login)
        const isNewUser =
          localStorage.getItem("vidaextra-welcome-sent") !== "true";

        if (isNewUser) {
          // Send welcome email
          try {
            const response = await fetch("/api/sendWelcomeEmail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userName: user.displayName,
                userEmail: user.email,
              }),
            });

            if (response.ok) {
              console.log("Welcome email sent");
              localStorage.setItem("vidaextra-welcome-sent", "true");
            }
          } catch (error) {
            console.error("Error sending welcome email:", error);
          }
        }

        resolve(user);
      } else {
        // Não está logado - redireciona para login
        console.log("User not authenticated, redirecting to login");
        window.location.replace("/pages/login.html");
        resolve(null);
      }
    });
  });
}

/**
 * Atualiza UI com dados do usuário
 */
function updateUIWithUser(user) {
  // Adiciona foto e nome do usuário no header
  const userInfoEl = document.getElementById("user-info");
  if (userInfoEl) {
    const photoHTML = user.photoURL
      ? `<img 
          src="${user.photoURL}" 
          alt="${user.displayName || user.email}" 
          class="rounded-circle" 
          style="width: 32px; height: 32px; object-fit: cover; border: 2px solid #0d6efd;"
          onerror="this.style.display='none'"
        >`
      : `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-size: 14px; font-weight: bold;">
          ${(user.displayName || user.email || "U").charAt(0).toUpperCase()}
        </div>`;

    userInfoEl.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        ${photoHTML}
        <span class="text-muted small">${user.displayName || user.email}</span>
      </div>
    `;
  }
}

/**
 * Função de logout
 */
export async function handleLogout() {
  try {
    // Limpar localStorage ANTES do signOut
    localStorage.removeItem("vidaextra-user");
    localStorage.removeItem("ac4-historico");
    localStorage.removeItem("ac4-totais");

    // Fazer logout do Firebase
    await signOut(auth);

    console.log("User logged out successfully");

    // Redirecionar para landing page
    window.location.replace("/pages/home.html");
  } catch (error) {
    console.error("Error logging out:", error);

    // Mesmo com erro, tenta limpar e redirecionar
    localStorage.clear();
    window.location.replace("/pages/home.html");
  }
}

/**
 * Obtém dados do usuário atual
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Obtém ID token para chamadas ao backend
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user logged in");
  }
  return await user.getIdToken();
}

export default {
  checkAuth,
  handleLogout,
  getCurrentUser,
  getIdToken,
};
