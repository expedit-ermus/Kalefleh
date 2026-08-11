(function () {
  "use strict";

  var fmt = new Intl.NumberFormat("fr-FR");

  function money(v) { return fmt.format(Number(v) || 0) + " FCFA"; }

  function readTotals() {
    var b = Number(document.getElementById("budgetFcfa").value) || 0;
    var p = Number(document.getElementById("prestationFcfa").value) || 0;
    var e = Number(document.getElementById("expeditionFcfa").value) || 0;
    var a = Number(document.getElementById("avanceFcfa").value) || 0;
    return { budget: b, prestation: p, expedition: e, avance: a, total: b + p + e };
  }

  function updateTotals() {
    var t = readTotals();
    document.getElementById("tBudget").textContent = money(t.budget);
    document.getElementById("tPrestation").textContent = money(t.prestation);
    document.getElementById("tExpedition").textContent = money(t.expedition);
    document.getElementById("tTotal").textContent = money(t.total);
    document.getElementById("tAvance").textContent = money(t.avance);
    document.getElementById("tReste").textContent = money(t.total - t.avance);
  }

  document.querySelectorAll("#budgetFcfa, #prestationFcfa, #expeditionFcfa, #avanceFcfa")
    .forEach(function (el) { el.addEventListener("input", updateTotals); });
  updateTotals();

  var status = document.getElementById("formStatus");
  var form = document.getElementById("devisForm");

  // ---- Navigation par étapes ----
  var currentStep = 1;
  var stepBodies = Array.from(document.querySelectorAll("[data-step-body]"));
  var steps = Array.from(document.querySelectorAll("#stepper .step"));

  function showStep(n) {
    currentStep = n;
    stepBodies.forEach(function (b) {
      b.hidden = Number(b.dataset.stepBody) !== n;
    });
    steps.forEach(function (s) {
      var sn = Number(s.dataset.step);
      s.classList.toggle("active", sn === n);
      s.classList.toggle("done", sn < n);
    });
    window.scrollTo({ top: form.getBoundingClientRect().top + window.pageYOffset - 90, behavior: "smooth" });
  }

  function validateStep(n) {
    var body = stepBodies.find(function (b) { return Number(b.dataset.stepBody) === n; });
    var required = body.querySelectorAll("input[required]");
    for (var i = 0; i < required.length; i++) {
      if (!required[i].value.trim()) {
        required[i].focus();
        required[i].style.borderColor = "var(--err)";
        setTimeout(function () { required[i].style.borderColor = ""; }, 2500);
        return false;
      }
    }
    if (n === 2) {
      var checked = body.querySelectorAll('input[name="typesCourses"]:checked').length;
      if (!checked) {
        var first = body.querySelector('.check');
        if (first) {
          first.style.borderColor = "var(--err)";
          setTimeout(function () { first.style.borderColor = ""; }, 2500);
        }
        return false;
      }
    }
    return true;
  }

  document.querySelectorAll(".btn-next").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = Number(btn.dataset.next);
      if (validateStep(currentStep)) showStep(next);
    });
  });
  document.querySelectorAll(".btn-prev").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showStep(Number(btn.dataset.prev));
    });
  });

  // ---- Envoi du formulaire ----
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    status.className = "form-status";
    status.textContent = "Envoi en cours...";

    var types = Array.from(document.querySelectorAll('input[name="typesCourses"]:checked'))
      .map(function (c) { return c.value; });

    if (types.length === 0) {
      status.className = "form-status err";
      status.textContent = "Veuillez cocher au moins un type de courses.";
      return;
    }

    var t = readTotals();
    var payload = {
      nomClient: document.getElementById("nomClient").value,
      telephone: document.getElementById("telephone").value,
      whatsapp: document.getElementById("whatsapp").value,
      pays: document.getElementById("pays").value,
      ville: document.getElementById("ville").value,
      typesCourses: types,
      detailsCourse: document.getElementById("detailsCourse").value,
      budgetFcfa: t.budget,
      prestationFcfa: t.prestation,
      expeditionFcfa: t.expedition,
      totalEstimeFcfa: t.total,
      avanceFcfa: t.avance,
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
      status.textContent = "Devis envoyé ! Référence : " + data.fiche.ref + ". Nous vous contactons très vite. 🙌";
      form.reset();
      updateTotals();
      showStep(1);
      setTimeout(function () { status.textContent = ""; }, 8000);
    } catch (err) {
      status.className = "form-status err";
      status.textContent = "Échec de l'envoi : " + err.message;
    }
  });
})();