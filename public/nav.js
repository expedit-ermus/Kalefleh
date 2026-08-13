(function () {
  "use strict";
  var burger = document.getElementById("navbarBurger");
  var links = document.getElementById("navbarLinks");
  if (!burger || !links) return;

  function closeMenu() {
    burger.classList.remove("is-open");
    links.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  burger.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Ferme le menu quand on clique un lien (navigation) ou en dehors
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("click", function (e) {
    if (!links.classList.contains("is-open")) return;
    if (links.contains(e.target) || burger.contains(e.target)) return;
    closeMenu();
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) closeMenu();
  });
})();
