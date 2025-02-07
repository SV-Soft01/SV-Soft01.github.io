// Verificar en qué página estamos
const currentPage = document.documentElement.getAttribute("data-page")

// Obtener la URL base
const baseUrl = window.location.href.split("/").slice(0, -1).join("/")

// Redirigir si es necesario
if (currentPage === "admin" && !window.location.href.includes("index.html")) {
  window.location.href = `${baseUrl}/index.html`
} else if (currentPage === "client" && !window.location.href.includes("cliente.html")) {
  window.location.href = `${baseUrl}/cliente.html`
}

