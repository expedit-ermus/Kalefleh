var pass = sessionStorage.getItem("kf_pass") || "";
    var panelBox = document.getElementById("panelBox");
    var loginBox = document.getElementById("loginBox");
    var loginMsg = document.getElementById("loginMsg");
    var allFiches = [];
    var searchInput = document.getElementById("searchInput");
    var statutFilter = document.getElementById("statutFilter");
    var STATUTS = ["NOUVEAU", "CONTACTÉ", "EN COURS", "EXPÉDIÉ", "TERMINÉ"];

    function showPanel() {
      loginBox.style.display = "none";
      panelBox.style.display = "";
      loadFiches();
    }

    async function loadFiches() {
      var holder = document.getElementById("fiches");
      holder.innerHTML = '<p class="empty">Chargement...</p>';
      try {
        var res = await fetch("/api/fiches", { headers: { "X-Admin-Pass": pass } });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Accès refusé.");
        allFiches = data.fiches || [];
        document.getElementById("count").textContent = allFiches.length + " fiche(s)";
        renderStats();
        renderFiches();
      } catch (err) {
        holder.innerHTML = '<p class="empty">' + esc(err.message) + "</p>";
      }
    }

    function renderStats() {
      var box = document.getElementById("statsBox");
      if (!allFiches.length) { box.hidden = true; return; }
      var byStatut = {};
      var totalEstime = 0;
      var totalAvance = 0;
      allFiches.forEach(function (f) {
        byStatut[f.statut] = (byStatut[f.statut] || 0) + 1;
        totalEstime += Number(f.total_estime_fcfa) || 0;
        totalAvance += Number(f.avance_fcfa) || 0;
      });
      var html = '<div class="stat-chip"><b>' + allFiches.length + '</b><span>fiches</span></div>';
      STATUTS.forEach(function (s) {
        if (byStatut[s]) html += '<div class="stat-chip"><b>' + byStatut[s] + '</b><span>' + s.toLowerCase() + '</span></div>';
      });
      html += '<div class="stat-chip stat-total"><b>' + money(totalEstime) + '</b><span>total estimé</span></div>';
      if (totalAvance > 0) html += '<div class="stat-chip stat-avance"><b>' + money(totalAvance) + '</b><span>avances reçues</span></div>';
      box.innerHTML = html;
      box.hidden = false;
    }

    function renderFiches() {
      var holder = document.getElementById("fiches");
      var q = (searchInput.value || "").trim().toLowerCase();
      var sf = statutFilter.value;
      var rows = allFiches.filter(function (f) {
        if (sf && f.statut !== sf) return false;
        if (!q) return true;
        return (f.nom_client + " " + f.telephone + " " + f.ref + " " + f.pays + " " + f.ville).toLowerCase().indexOf(q) !== -1;
      });

      holder.innerHTML = "";
      if (!rows.length) { holder.innerHTML = '<p class="empty">Aucune fiche.</p>'; return; }

      rows.forEach(function (f) {
        var el = document.createElement("div");
        el.className = "fiche-card";
        el.innerHTML =
          '<div class="fiche-head"><span class="ref">' + esc(f.ref) + '</span>' +
          '<span class="badge stat-' + esc(f.statut.replace(/\s/g, "")) + '">' + esc(f.statut) + '</span>' +
          '<span class="date">' + esc(new Date(f.date).toLocaleString("fr-FR")) + '</span></div>' +
          '<div class="types">' + f.types_courses.map(function (t) { return '<span class="type-tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
          '<div class="fiche-grid">' +
          cell("Client", f.nom_client) + cell("Téléphone", f.telephone) +
          cell("WhatsApp", f.whatsapp) + cell("Email", f.email_client) + cell("Pays / Ville", f.pays + " — " + f.ville) +
          cell("Budget", money(f.budget_fcfa)) + cell("Prestation", money(f.prestation_fcfa)) +
          cell("Expédition", money(f.expedition_fcfa)) + cell("Total estimé", money(f.total_estime_fcfa)) +
          cell("Avance", money(f.avance_fcfa)) + cell("Paiement", f.paiement) +
          cell("Compagnie", f.compagnie_expedition) + cell("Livraison", f.adresse_livraison) +
          cell("Détail course", f.details_course) + cell("Commentaire", f.commentaire) +
          cell("Consentement RGPD", (f.consent_traitement ? "✅ Traitement accepté" : "⚠️ Non renseigné") + (f.consent_marketing ? " · ✅ Marketing OK" : " · ❌ Pas de marketing")) +
          '</div>' +
          '<div class="fiche-actions">' +
          '<label class="statut-select">Statut : ' +
          '<select data-ref="' + esc(f.ref) + '">' + STATUTS.map(function (s) {
            return '<option' + (s === f.statut ? " selected" : "") + '>' + esc(s) + '</option>';
          }).join("") + "</select></label>" +
          (f.whatsapp ? '<a class="wa-link" href="https://wa.me/' + f.whatsapp.replace(/\D/g, "") + '" target="_blank" rel="noopener">💬 WhatsApp</a>' : "") +
          '<button class="btn-mini" data-action="hist" data-ref="' + esc(f.ref) + '">🕘 Historique</button>' +
          '<button class="btn-mini" data-action="edit" data-ref="' + esc(f.ref) + '">✏️ Modifier</button>' +
          '<button class="btn-mini btn-danger" data-action="delete" data-ref="' + esc(f.ref) + '">🗑️</button>' +
          "</div>" +
          '<div class="fiche-edit" id="edit-' + esc(f.ref) + '" hidden>' +
          '<label>Avance versée (FCFA)<input type="number" class="e-avance" min="0" value="' + (Number(f.avance_fcfa) || 0) + '" /></label>' +
          '<label>Total estimé (FCFA)<input type="number" class="e-total" min="0" value="' + (Number(f.total_estime_fcfa) || 0) + '" /></label>' +
          '<label>Commentaire<textarea class="e-com" rows="2">' + esc(f.commentaire || "") + '</textarea></label>' +
          '<button class="btn-mini btn-save" data-ref="' + esc(f.ref) + '">💾 Enregistrer</button>' +
          "</div>" +
          '<div class="fiche-suivi" id="suivi-' + esc(f.ref) + '" hidden>' +
          '<div class="suivi-list" data-count="' + (Array.isArray(f.suivi) ? f.suivi.length : 0) + '">' +
          suiviEntriesHtml(f) + "</div>" +
          '<div class="suivi-note">' +
          '<textarea class="n-note" rows="2" placeholder="Relance, accord, photo envoyée…"></textarea>' +
          '<label class="suivi-vis"><input type="checkbox" class="n-public" /> Visible par le client</label>' +
          '<button class="btn-mini btn-save" data-action="note" data-ref="' + esc(f.ref) + '">➕ Ajouter</button>' +
          "</div></div>";
        holder.appendChild(el);

        var sel = el.querySelector('select[data-ref]');
        sel.addEventListener("change", function () { updateStatut(f.ref, sel.value); });

        el.querySelector('[data-action="edit"]').addEventListener("click", function () {
          var box = document.getElementById("edit-" + f.ref);
          box.hidden = !box.hidden;
        });

        el.querySelector('[data-action="hist"]').addEventListener("click", function () {
          var box = document.getElementById("suivi-" + f.ref);
          box.hidden = !box.hidden;
        });

        el.querySelector('[data-action="note"]').addEventListener("click", function () {
          var texte = el.querySelector(".n-note").value.trim();
          if (!texte) { alert("Écris d'abord le message."); return; }
          var payload = { note: texte, notePublic: el.querySelector(".n-public").checked };
          addNote(f.ref, payload, el);
        });

        el.querySelector('[data-action="delete"]').addEventListener("click", function () {
          if (confirm("Supprimer définitivement la fiche " + f.ref + " (" + f.nom_client + ") ?")) {
            deleteFiche(f.ref);
          }
        });

        el.querySelector(".btn-save").addEventListener("click", function () {
          var payload = {
            avance_fcfa: Number(el.querySelector(".e-avance").value) || 0,
            total_estime_fcfa: Number(el.querySelector(".e-total").value) || 0,
            commentaire: el.querySelector(".e-com").value
          };
          updateFiche(f.ref, payload);
        });
      });
    }

    async function updateStatut(ref, statut) {
      try {
        var res = await fetch("/api/fiches/" + encodeURIComponent(ref), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-Admin-Pass": pass },
          body: JSON.stringify({ statut: statut })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur.");
        loadFiches();
      } catch (err) {
        alert("Erreur changement de statut : " + err.message);
        loadFiches();
      }
    }

    async function addNote(ref, payload, el) {
      try {
        var res = await fetch("/api/fiches/" + encodeURIComponent(ref), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-Admin-Pass": pass },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur.");
        loadFiches();
      } catch (err) {
        alert("Erreur relance : " + err.message);
      }
    }

    function suiviEntriesHtml(f) {
      var log = Array.isArray(f.suivi) ? f.suivi : [];
      if (!log.length) return '<p class="suivi-empty">Aucun historique.</p>';
      return log.slice().reverse().map(function (e) {
        var who = e.auteur === "système" ? "⚙️ système" : (e.auteur === "admin" ? "🛠️ admin" : "👤 client");
        var vis = e.visibilite === "client" ? '<span class="suivi-badge vis-client">client</span>' : '<span class="suivi-badge vis-inte">interne</span>';
        return '<div class="suivi-entry"><div class="suivi-head">' + who + " · " + vis + " · <span class='date'>" + esc(new Date(e.date).toLocaleString("fr-FR")) + '</span></div><div class="suivi-text">' + esc(e.texte) + "</div></div>";
      }).join("");
    }

    async function updateFiche(ref, payload) {
      try {
        var res = await fetch("/api/fiches/" + encodeURIComponent(ref), {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-Admin-Pass": pass },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur.");
        loadFiches();
      } catch (err) {
        alert("Erreur modification : " + err.message);
      }
    }

    async function deleteFiche(ref) {
      try {
        var res = await fetch("/api/fiches/" + encodeURIComponent(ref), {
          method: "DELETE",
          headers: { "X-Admin-Pass": pass }
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur.");
        loadFiches();
      } catch (err) {
        alert("Erreur suppression : " + err.message);
      }
    }

    searchInput.addEventListener("input", renderFiches);
    statutFilter.addEventListener("change", renderFiches);

    var newFicheBox = document.getElementById("newFicheBox");
    function resetNewForm() {
      ["nNom", "nTel", "nEmail", "nPays", "nVille", "nBudget", "nAvance", "nPrestation", "nAdresse", "nCommentaire"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
      });
      ["nPaiement", "nDelai"].forEach(function (id) { document.getElementById(id).value = ""; });
      Array.from(document.querySelectorAll(".nTypes")).forEach(function (c) { c.checked = false; });
      document.getElementById("newMsg").textContent = "";
    }

    document.getElementById("btnNew").onclick = function () {
      newFicheBox.hidden = !newFicheBox.hidden;
      if (!newFicheBox.hidden) resetNewForm();
    };
    document.getElementById("btnNewClose").onclick = function () { newFicheBox.hidden = true; };

    document.getElementById("btnNewSave").onclick = async function () {
      var nom = document.getElementById("nNom").value.trim();
      var tel = document.getElementById("nTel").value.trim();
      var msg = document.getElementById("newMsg");
      if (!nom || !tel) { msg.className = "form-status err"; msg.textContent = "Nom et téléphone obligatoires."; return; }
      var types = Array.from(document.querySelectorAll(".nTypes")).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
      var budget = Number(document.getElementById("nBudget").value) || 0;
      var avance = Number(document.getElementById("nAvance").value) || 0;
      var prestation = Number(document.getElementById("nPrestation").value) || 0;
      var total = budget + prestation;
      var payload = {
        nomClient: nom,
        telephone: tel,
        whatsapp: tel,
        emailClient: document.getElementById("nEmail").value.trim() || "",
        pays: document.getElementById("nPays").value.trim() || "Côte d'Ivoire",
        ville: document.getElementById("nVille").value.trim() || "Abidjan",
        typesCourses: types,
        budgetFcfa: budget,
        prestationFcfa: prestation,
        expeditionFcfa: 0,
        totalEstimeFcfa: total,
        avanceFcfa: avance,
        paiement: document.getElementById("nPaiement").value,
        compagnieExpedition: "KALEFLEH s'occupe de tout",
        adresseLivraison: document.getElementById("nAdresse").value.trim(),
        delaiSouhaite: document.getElementById("nDelai").value,
        commentaire: document.getElementById("nCommentaire").value.trim()
      };
      try {
        var res = await fetch("/api/fiches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur.");
        msg.className = "form-status ok";
        msg.textContent = "Fiche " + data.fiche.ref + " enregistrée ✓";
        newFicheBox.hidden = true;
        loadFiches();
      } catch (err) {
        msg.className = "form-status err";
        msg.textContent = "Erreur : " + err.message;
      }
    };

    function cell(name, val) {
      return "<div><span>" + esc(name) + " :</span> " + esc(val || "—") + "</div>";
    }
    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function money(v) { return new Intl.NumberFormat("fr-FR").format(Number(v) || 0) + " FCFA"; }

    document.getElementById("btnLogin").onclick = async function () {
      var v = document.getElementById("passInput").value.trim().toUpperCase();
      if (!v) { loginMsg.textContent = "Entrez un mot de passe."; return; }
      var res = await fetch("/api/fiches", { headers: { "X-Admin-Pass": v } });
      if (res.status === 401) { loginMsg.textContent = "Mot de passe incorrect."; return; }
      pass = v;
      sessionStorage.setItem("kf_pass", pass);
      showPanel();
    };

    document.getElementById("btnExport").onclick = async function () {
      try {
        var res = await fetch("/api/export/fiches.csv", { headers: { "X-Admin-Pass": pass } });
        if (!res.ok) throw new Error("Export refusé.");
        var blob = await res.blob();
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "kalefleh-fiches-clients.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      } catch (err) {
        alert("Erreur export : " + err.message);
      }
    };

    document.getElementById("btnLogout").onclick = function () {
      sessionStorage.removeItem("kf_pass");
      pass = "";
      location.reload();
    };

    if (pass) showPanel();
    else document.getElementById("passInput").focus();

    // Auto-refresh : nouvelles fiches visibles sans recharger
    setInterval(function () {
      if (!panelBox.style.display || panelBox.style.display !== "none") loadFiches();
    }, 45000);
