var STATUTS = ["NOUVEAU", "CONTACTÉ", "EN COURS", "EXPÉDIÉ", "TERMINÉ"];
    var form = document.getElementById("suiviForm");
    var input = document.getElementById("refInput");
    var status = document.getElementById("suiviStatus");

    function money(v) { return new Intl.NumberFormat("fr-FR").format(Number(v) || 0) + " FCFA"; }

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function renderTrack(statut) {
      var idx = STATUTS.indexOf(statut);
      var labels = {
        "NOUVEAU": "Reçu",
        "CONTACTÉ": "Contacté",
        "EN COURS": "Courses",
        "EXPÉDIÉ": "Expédié",
        "TERMINÉ": "Livré"
      };
      var track = document.getElementById("track");
      track.innerHTML = STATUTS.map(function (s, i) {
        var done = i <= idx;
        return '<div class="step' + (done ? " done" : "") + '">' +
          '<span class="dot">' + (done ? "✓" : i + 1) + "</span>" +
          "<span>" + labels[s] + "</span></div>";
      }).join("");
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var ref = input.value.trim().toUpperCase();
      await lookup(ref);
    });

    async function lookup(ref) {
      status.className = "form-status";
      status.textContent = "Recherche...";
      var box = document.getElementById("resultBox");
      box.hidden = true;
      if (!/^KF-[A-Z0-9]+$/.test(ref)) {
        status.className = "form-status err";
        status.textContent = "Référence invalide. Format attendu : KF-XXXXXXXX.";
        return;
      }
      currentRef = ref;
      try {
        var res = await fetch("/api/fiches/" + encodeURIComponent(ref) + "/statut");
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Introuvable.");
        status.className = "form-status ok";
        status.textContent = "Commande trouvée !";
        document.getElementById("rRef").textContent = data.ref;
        document.getElementById("rMeta").textContent = "Demande du " + new Date(data.date).toLocaleDateString("fr-FR") + " — " + data.nom_client;
        document.getElementById("rStatut").textContent = data.statut;
        document.getElementById("rDelai").textContent = data.delai_souhaite || "—";
        document.getElementById("rTotal").textContent = money(data.total_estime_fcfa);
        document.getElementById("rAvance").textContent = money(data.avance_fcfa);
        document.getElementById("rVille").textContent = data.pays + " — " + data.ville;
        document.getElementById("rTypes").textContent = (data.types_courses || []).join(", ") || "—";
        renderTrack(data.statut);

        var suiviBox = document.getElementById("rSuivi");
        var entries = data.suivi || [];
        if (entries.length) {
          document.getElementById("rSuiviList").innerHTML = entries.map(function (e) {
            var who = e.auteur === "client" ? "Vous" : "KALEFLEH";
            return '<div class="suivi-entry"><div class="suivi-head">' + who + " · " + new Date(e.date).toLocaleString("fr-FR") + '</div><div class="suivi-text">' + esc(e.texte) + "</div></div>";
          }).join("");
          suiviBox.hidden = false;
        } else {
          suiviBox.hidden = true;
        }

        document.getElementById("rMsgBox").hidden = false;
        document.getElementById("msgStatus").textContent = "";
        box.hidden = false;
      } catch (err) {
        status.className = "form-status err";
        status.textContent = "Aucune commande trouvée avec cette référence. Vérifie et réessaie.";
      }
    }

    // Envoi d'un message client
    var currentRef = "";
    var cMsgBox = document.getElementById("cMsg");
    var cHpBox = document.getElementById("cHp");
    var msgSt = document.getElementById("msgStatus");
    document.getElementById("btnMsg").addEventListener("click", function () {
      var texte = cMsgBox.value.trim();
      if (!currentRef || !texte) return;
      msgSt.className = "form-status";
      msgSt.textContent = "Envoi...";
      fetch("/api/fiches/" + encodeURIComponent(currentRef) + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: texte, website: cHpBox.value })
      }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.d.error || "Erreur.");
          cMsgBox.value = "";
          cHpBox.value = "";
          msgSt.className = "form-status ok";
          msgSt.textContent = "Message envoyé ✓ KALEFLEH te répond bientôt.";
          lookup(currentRef);
        })
        .catch(function (err) {
          msgSt.className = "form-status err";
          msgSt.textContent = "Échec : " + err.message;
        });
    });

    // Suivi direct via ?ref=KF-XXXX
    (function () {
      var m = (location.search || "").match(/[?&]ref=([^&]+)/);
      if (m) {
        input.value = decodeURIComponent(m[1]).toUpperCase();
        lookup(input.value);
      }
    })();
