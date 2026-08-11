(function () {
  "use strict";

  var fmt = new Intl.NumberFormat("fr-FR");
  function money(v) { return fmt.format(Number(v) || 0) + " FCFA"; }

  var PRESTATION_SIMPLE = 8000;   // petite course : 3 à 5 petits articles
  var PRESTATION_COMPLETE = 15000; // course complète / marché
  var budgetValue = 0;

  // ---- Budget quick chips ----
  var chips = Array.from(document.querySelectorAll('input[name="budgetQuick"]'));
  var customBudgetWrap = document.getElementById("customBudgetWrap");
  var budgetInput = document.getElementById("budgetFcfa");
  var typeInputs = Array.from(document.querySelectorAll('input[name="typesCourses"]'));

  function selectedTypes() {
    return typeInputs.filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
  }

  function computePrestation() {
    var types = selectedTypes();
    if (types.length === 0) return PRESTATION_SIMPLE;
    var multi = types.length >= 3;
    if (types.indexOf("Alimentaire") !== -1) multi = true;      // marché = déplacements multiples
    if (types.indexOf("Perruques") !== -1 && types.length >= 2) multi = true; // boutique + compléments
    return multi ? PRESTATION_COMPLETE : PRESTATION_SIMPLE;
  }

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

  // Recalcule la prestation quand les catégories changent
  typeInputs.forEach(function (c) {
    c.addEventListener("change", function () {
      updateTotals();
      updateRecap();
    });
  });

  // ---- Live estimate ----
  var liveTotal = document.getElementById("liveTotal");
  function updateTotals() {
    if (!liveTotal) return;
    var prestation = computePrestation();
    liveTotal.hidden = budgetValue <= 0;
    document.getElementById("tBudget").textContent = money(budgetValue);
    document.getElementById("tPrestation").textContent = money(prestation);
    document.getElementById("tTotal").textContent = money(budgetValue + prestation);
  }

  // ---- Récap live ----
  var recap = document.getElementById("recap");
  function updateRecap() {
    if (!recap) return;
    var types = selectedTypes();
    var nom = document.getElementById("nomClient").value.trim();
    var tel = document.getElementById("telephone").value.trim();
    var pays = document.getElementById("pays").value.trim();
    var livraison = document.getElementById("adresseLivraison").value.trim();
    var prestation = computePrestation();

    var items = [];
    if (nom) items.push("<b>Client :</b> " + escHtml(nom) + (pays ? " (" + escHtml(pays) + ")" : ""));
    if (tel) items.push("<b>Téléphone :</b> " + escHtml(tel));
    if (types.length) items.push("<b>Courses :</b> " + types.map(escHtml).join(", "));
    if (budgetValue > 0) items.push("<b>Budget :</b> " + money(budgetValue));
    if (prestation) items.push("<b>Prestation :</b> " + money(prestation));
    if (livraison) items.push("<b>Livraison :</b> " + escHtml(livraison));

    if (items.length === 0) { recap.hidden = true; return; }
    recap.hidden = false;
    recap.innerHTML = items.map(function (i) { return "<div>" + i + "</div>"; }).join("");
  }

  ["nomClient", "telephone", "pays", "ville", "adresseLivraison"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", updateRecap);
  });

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---- Validation téléphone (indicatif international) ----
  var phoneRe = /^\+?[0-9\s().-]{7,20}$/;
  function validPhone(v) {
    if (!phoneRe.test(v)) return false;
    var digits = v.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return false;
    return true;
  }

  // ---- Form submit ----
  var status = document.getElementById("formStatus");
  var form = document.getElementById("devisForm");
  var whatsappAdmin = document.getElementById("whatsappAdmin");

  function setStatus(msg, ok) {
    status.className = "form-status" + (ok ? " ok" : " err");
    status.textContent = msg;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setStatus("Envoi en cours...", false);
    status.classList.remove("err", "ok");

    // Honeypot anti-spam : si rempli (robot), on feint le succès sans envoyer
    var hp = document.getElementById("website");
    if (hp && hp.value) {
      setStatus("Demande reçue ! Nous vous contactons très vite. 🙌", true);
      form.reset();
      setTimeout(function () { status.textContent = ""; }, 10000);
      return;
    }

    var nom = document.getElementById("nomClient").value.trim();
    var tel = document.getElementById("telephone").value.trim();
    if (!nom || !tel) {
      setStatus("Merci d'indiquer votre nom et votre téléphone.", false);
      return;
    }
    if (!validPhone(tel)) {
      setStatus("Numéro de téléphone invalide (indiquez l'indicatif, ex : +225 07 07 07 07 07).", false);
      return;
    }

    var types = selectedTypes();
    if (types.length === 0) {
      setStatus("Veuillez cocher au moins un type de courses.", false);
      return;
    }

    var prestation = computePrestation();
    var expedition = 0;
    var payload = {
      nomClient: nom,
      telephone: tel,
      whatsapp: tel,
      pays: document.getElementById("pays").value,
      ville: document.getElementById("ville").value,
      typesCourses: types,
      detailsCourse: document.getElementById("detailsCourse").value,
      delaiSouhaite: document.getElementById("delaiSouhaite").value,
      budgetFcfa: budgetValue,
      prestationFcfa: prestation,
      expeditionFcfa: expedition,
      totalEstimeFcfa: budgetValue + prestation,
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

      // Confirmation enrichie
      var msg = "Demande reçue (réf. " + data.fiche.ref + ") ! Nous vous contactons très vite. 🙌";
      if (whatsappAdmin && whatsappAdmin.value && whatsappAdmin.value.indexOf("NUMERO") === -1) {
        msg += " Envoyez-nous votre réf sur WhatsApp pour accélérer 👇";
      }
      setStatus(msg, true);

      // Bouton WhatsApp de suivi (si numéro admin renseigné)
      var followBtn = document.getElementById("followWhatsapp");
      if (followBtn) {
        if (whatsappAdmin && whatsappAdmin.value && whatsappAdmin.value.indexOf("NUMERO") === -1) {
          var txt = encodeURIComponent("Bonjour KALEFLEH 👋 J'ai envoyé une demande de devis (réf. " + data.fiche.ref + "). " + nom);
          followBtn.href = "https://wa.me/" + whatsappAdmin.value.replace(/\D/g, "") + "?text=" + txt;
          followBtn.style.display = "inline-block";
        } else {
          followBtn.style.display = "none";
        }
      }

      form.reset();
      budgetValue = 0;
      if (customBudgetWrap) customBudgetWrap.hidden = true;
      updateTotals();
      updateRecap();
      setTimeout(function () { status.textContent = ""; }, 15000);
    } catch (err) {
      setStatus("Échec de l'envoi : " + err.message, false);
    }
  });
})();