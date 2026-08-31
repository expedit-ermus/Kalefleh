(function () {
  function init() {
    document.querySelectorAll(".navbar").forEach(function (nav) {
      var toggle = nav.querySelector(".navbar-toggle");
      var links = nav.querySelector(".navbar-links");
      if (!toggle || !links) return;

      function setOpen(open) {
        nav.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      }

      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        setOpen(!nav.classList.contains("open"));
      });

      links.addEventListener("click", function () {
        setOpen(false);
      });

      document.addEventListener("click", function (e) {
        if (nav.classList.contains("open") && !nav.contains(e.target)) {
          setOpen(false);
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("open")) {
          setOpen(false);
          toggle.focus();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
