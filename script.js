const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener("click", () => {
  navMenu.classList.toggle("open");
  menuBtn.textContent = navMenu.classList.contains("open") ? "✕" : "☰";
});

document.querySelectorAll("#navMenu a").forEach(link => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuBtn.textContent = "☰";
  });
});

document.getElementById("year").textContent = new Date().getFullYear();


// Quote form: works on GitHub Pages without a server by preparing a WhatsApp message.
const quoteForm = document.getElementById("quoteForm");
const serviceSelect = document.getElementById("serviceSelect");
document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    if (serviceSelect) serviceSelect.value = link.dataset.service;
  });
});
if (quoteForm) {
  quoteForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const data = new FormData(quoteForm);
    const message = `Hello Hetzen Technologies, I would like to request a quote.\n\nName: ${data.get("name")}\nBusiness: ${data.get("business") || "Not provided"}\nEmail: ${data.get("email")}\nPhone/WhatsApp: ${data.get("phone")}\nService: ${data.get("service")}\nBudget: ${data.get("budget") || "Not specified"}\nTimeline: ${data.get("timeline") || "Not specified"}\n\nProject details:\n${data.get("details")}`;
    window.open(`https://wa.me/27786246258?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
}
