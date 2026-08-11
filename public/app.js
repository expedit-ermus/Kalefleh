(function () {
  "use strict";

  var fmt = new Intl.NumberFormat("fr-FR");
  function money(v) { return fmt.format(Number(v) || 0) + " FCFA"; }

  var PRESTATION = 5000; // petite course
  var budgetValue = 0;

  // ---- Budget quick chips ----
  var chips = Array.from(document.querySelectorAll('input[name="budgetQuick"]'));
  var customBudgetWrap = document.getElementById("customBudgetWrap");
  var budgetInput = document.getElementById("budgetFcfa");

  function onBudgetChange() {
    var sel = chips.find(function (c) { return c.checked; });
    customBudgetWrap.hidden = !sel || sel.value !== "custom";
    if (sel) {
      budgetValue = sel.value === "custom" ? (Number(budgetInput.value) || 0) : Number(sel.value);
    }
    updateTotals();
  }
  chips.forEach(function (c) {
    c.addEventListener("change", function () { onBudgetChange(); });
  });
  (budgetInput ? [budgetInput] : []).forEach(function (el) {
    el.addEventListener("input", function () {
      var custom = chips.find(function (c) { return c.value === "custom" && c.checked; });
      if (custom) { budgetValue = Number(el.value) || 0; updateTotals(); }
    });
  });

  // ---- Live estimate ----
  var liveTotal = document.getElementById("liveTotal");
  function updateTotals() {
    if (!liveTotal) return;
    liveTotal.hidden = budgetValue <= 0;
    var prestation = PRESTATION;
    document.getElementById("tBudget").textContent = money(budgetValue);
    document.getElementById("tPrestation").textContent = money(prestation);
    document.getElementById("tTotal").textContent = money(budgetValue + prestation);
  }

  // ---- Form submit ----
  var status = document.getElementById("formStatus");
  var form = document.getElementById("devisForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "Envoi en cours...";

    var nom = document.getElementById("nomClient").value.trim();
    var tel = document.getElementById("telephone").value.trim();
    if (!nom || !tel) {
      status.className = "form-status err";
      status.textContent = "Merci d'indiquer votre nom et votre téléphone.";
      return;
    }

    var types = Array.from(document.querySelectorAll('input[name="typesCourses"]:checked'))
      .map(function (c) { return c.value; });
    if (types.length === 0) {
      status.className = "form-status err";
      status.textContent = "Veuillez cocher au moins un type de courses.";
      return;
    }

    var expedition = 0;
    var payload = {
      nomClient: nom,
      telephone: tel,
      whatsapp: document.getElementById("telephone").value.trim(),
      pays: document.getElementById("pays").value,
      ville: document.getElementById("ville").value,
      typesCourses: types,
      detailsCourse: document.getElementById("detailsCourse").value,
      budgetFcfa: budgetValue,
      prestationFcfa: PRESTATION,
      expeditionFcfa: expedition,
      totalEstimeFcfa: budgetValue + PRESTATION,
      avanceFcfa: 0,
      paiement: document.getElementById("paiement").value,
      compagnieExpedition: document.getElementById("compagnieExpedition").value,
      adresseLivraison: document.getElementById("adresseLivraison").value,
      commentaire: document.getElementById("commentaire").value
    };

    try {
      var res = await fetch("/api/fiches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'envoi.");
      status.className = "form-status ok";
      status.textContent = "Demande reçue (réf. " + data.fiche.ref + ") ! Nous vous contactons très vite. 🙌";
      form.reset();
      budgetValue = 0;
      if (customBudgetWrap) customBudgetWrap.hidden = true;
      updateTotals();
      setTimeout(function () { status.textContent = ""; }, 10000);
    } catch (err) {
      status.className = "form-status err";
      status.textContent = "Échec de l'envoi : " + err.message;
    }
  });
})();