(function () {
  var form = document.getElementById("payForm");
  var status = document.getElementById("payStatus");
  function setStatus(t, ok) { status.className = "form-status" + (ok ? " ok" : " err"); status.textContent = t; }
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var hp = document.getElementById("payWebsite");
    if (hp && hp.value) { setStatus("Avance déclarée ✓", true); form.reset(); return; }
    var ref = document.getElementById("payRef").value.trim().toUpperCase();
    var montant = Number(document.getElementById("payMontant").value);
    var methode = (form.querySelector('input[name="methode"]:checked') || {}).value || "";
    var telephone = document.getElementById("payTel").value.trim();
    if (!/^KF-[A-Z0-9]+$/.test(ref)) { setStatus("Référence invalide (format KF-XXXXXXXX).", false); return; }
    if (!montant || montant < 1000) { setStatus("Indique un montant d'avance valide (min 1000 FCFA).", false); return; }
    setStatus("Enregistrement...", false);
    try {
      var res = await fetch("/api/fiches/" + encodeURIComponent(ref) + "/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ montant: montant, methode: methode, telephone: telephone, website: hp ? hp.value : "" })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur.");
      var waInput = document.getElementById("payWhatsappAdmin");
      var wa = waInput && waInput.value;
      if (wa && wa.indexOf("NUMERO") === -1) {
        var msg = "Bonjour KALEFLEH 👋 Je viens de déclarer une avance de " + montant.toLocaleString("fr-FR") + " FCFA pour la commande " + ref + " via " + methode + ". Merci de confirmer.";
        document.getElementById("okWa").href = "https://wa.me/" + wa.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
        document.getElementById("okWa").style.display = "inline-block";
      } else {
        document.getElementById("okWa").style.display = "none";
      }
      document.getElementById("okRef").textContent = ref;
      document.getElementById("okResume").textContent = montant.toLocaleString("fr-FR") + " FCFA via " + methode + (telephone ? " — confirmation au " + telephone : "") + ".";
      document.getElementById("payOk").hidden = false;
      form.reset();
      document.getElementById("payOk").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      setStatus("Échec : " + err.message, false);
    }
  });
  document.getElementById("payRef").focus();
})();
