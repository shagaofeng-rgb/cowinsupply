const homeRoot = document.querySelector(".home-v1");
const homeToggle = document.querySelector(".home-nav-toggle");
homeToggle?.addEventListener("click", () => {
  const isOpen = homeRoot?.classList.toggle("nav-open") || false;
  homeToggle.setAttribute("aria-expanded", String(isOpen));
  homeToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});
document.querySelectorAll(".home-main-nav a, .home-nav-tools a").forEach((link) => link.addEventListener("click", () => {
  homeRoot?.classList.remove("nav-open");
  homeToggle?.setAttribute("aria-expanded", "false");
  homeToggle?.setAttribute("aria-label", "Open navigation");
}));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { homeRoot?.classList.remove("nav-open"); homeToggle?.setAttribute("aria-expanded", "false"); homeToggle?.setAttribute("aria-label", "Open navigation"); } });
