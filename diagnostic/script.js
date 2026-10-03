/* =====================================================================
   BOOTY FLOW · TEST « DIAGNOSTIC » · Moteur
   Pas besoin de modifier ce fichier : tout se règle dans config.js.
   ===================================================================== */
(function () {
  "use strict";

  var C = window.BF_CONFIG;
  var scene = document.getElementById("contenu");
  var btnRetour = document.getElementById("retour");
  var blocProgression = document.getElementById("progression");
  var progressionTexte = document.getElementById("progression-texte");
  var progressionBarre = document.getElementById("progression-barre");
  var progressionRemplissage = document.getElementById("progression-remplissage");
  var PILIERS = ["E", "A", "S"];
  var reduitMouvement = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var etat = {
    reponses: {},     // id de question → valeur
    poids: null,
    prenom: "",
    email: "",
    formule: null,
    valide: false
  };
  var pile = [];      // écrans visités (pour le bouton retour)
  var minuteurs = [];

  /* ---------------------------------------------------------------
     Outils
     --------------------------------------------------------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function remplacer(txt, vars) {
    return String(txt || "").replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] != null ? vars[k] : m;
    });
  }
  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function $(sel, racine) { return (racine || scene).querySelector(sel); }
  function $$(sel, racine) { return Array.prototype.slice.call((racine || scene).querySelectorAll(sel)); }
  function plus(fn, ms) { minuteurs.push(setTimeout(fn, ms)); }
  function nettoyerMinuteurs() { minuteurs.forEach(clearTimeout); minuteurs = []; }

  // Image avec placeholder élégant si le fichier est absent
  function image(src, alt, classe, placeholder) {
    return '<img class="' + classe + '" src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" ' +
      'data-placeholder="' + esc(placeholder || "") + '" />';
  }
  function brancherPlaceholders(racine) {
    $$("img[data-placeholder]", racine).forEach(function (img) {
      function remplacerImg() {
        var p = document.createElement("div");
        p.className = img.className + " placeholder";
        p.setAttribute("role", "img");
        p.setAttribute("aria-label", img.alt);
        p.innerHTML = '<span aria-hidden="true">💜</span>' +
          (img.dataset.placeholder ? '<small>' + esc(img.dataset.placeholder) + '</small>' : "");
        img.replaceWith(p);
      }
      if (img.complete && img.naturalWidth === 0) remplacerImg();
      else img.addEventListener("error", remplacerImg, { once: true });
    });
  }

  /* ---------------------------------------------------------------
     Parcours
     --------------------------------------------------------------- */
  function optionObjectif() {
    var v = etat.reponses.objectif;
    return C.objectif.options.filter(function (o) { return o.valeur === v; })[0] || null;
  }
  function questionsQuiz() {
    var obj = etat.reponses.objectif || C.objectif.options[0].valeur;
    var objectifQ = { id: C.objectif.id, type: "choix", question: C.objectif.question, aide: C.objectif.aide, options: C.objectif.options };
    return [objectifQ].concat(C.questionsCommunes, C.questionsSpecifiques[obj] || []);
  }
  function questionsScorees() {
    var obj = etat.reponses.objectif;
    return C.questionsCommunes.concat(C.questionsSpecifiques[obj] || []).filter(function (q) { return q.type === "choix"; });
  }
  function trouverQuestion(id) {
    return questionsQuiz().concat(C.qualification.questions).filter(function (q) { return q.id === id; })[0];
  }

  function prochain(cle) {
    if (cle === "accueil") return "q:" + C.objectif.id;
    if (cle.indexOf("q:") === 0) {
      var liste = questionsQuiz();
      var i = liste.map(function (q) { return q.id; }).indexOf(cle.slice(2));
      if (i < liste.length - 1) return "q:" + liste[i + 1].id;
      return C.capture.actif ? "capture" : "analyse";
    }
    if (cle === "capture") return "analyse";
    if (cle === "analyse") return "diagnostic";
    if (cle === "diagnostic") return "preuve";
    if (cle === "preuve") return "qualif";
    if (cle === "qualif") return "qq:" + C.qualification.questions[0].id;
    if (cle.indexOf("qq:") === 0) {
      var qs = C.qualification.questions;
      var j = qs.map(function (q) { return q.id; }).indexOf(cle.slice(3));
      if (j < qs.length - 1) return "qq:" + qs[j + 1].id;
      return estQualifiee() ? "offres" : "pasprete";
    }
    if (cle === "pasprete") return "offres";
    if (cle === "offres") return "confirmation";
    return "accueil";
  }

  function estQualifiee() {
    var regle = C.qualification.regle;
    return Object.keys(regle).every(function (id) {
      return regle[id].indexOf(etat.reponses[id]) !== -1;
    });
  }

  /* ---------------------------------------------------------------
     Scoring des 3 piliers
     --------------------------------------------------------------- */
  function calculerDiagnostic() {
    var score = { E: 0, A: 0, S: 0 }, max = { E: 0, A: 0, S: 0 };
    questionsScorees().forEach(function (q) {
      PILIERS.forEach(function (p) {
        max[p] += Math.max.apply(null, q.options.map(function (o) { return (o.points && o.points[p]) || 0; }));
      });
      var choisie = q.options.filter(function (o) { return o.valeur === etat.reponses[q.id]; })[0];
      if (choisie && choisie.points) PILIERS.forEach(function (p) { score[p] += choisie.points[p] || 0; });
    });
    var egalite = (C.scoring.egalite[etat.reponses.objectif] || PILIERS);
    var bonus = (C.scoring.bonusPriorite || {})[etat.reponses.objectif] || {};
    var res = PILIERS.map(function (p) {
      var pct = max[p] ? Math.round(score[p] / max[p] * 100) : 0;
      var niveau = C.scoring.niveaux.filter(function (n) { return pct <= n.jusqua; })[0] || C.scoring.niveaux[C.scoring.niveaux.length - 1];
      // Le bonus ne s'applique que si le pilier a vraiment des points à corriger
      var rang = pct + (score[p] > 0 ? (bonus[p] || 0) : 0);
      return { pilier: p, score: score[p], max: max[p], pct: pct, rang: rang, niveau: niveau };
    });
    res.sort(function (a, b) {
      return (b.rang - a.rang) || (egalite.indexOf(a.pilier) - egalite.indexOf(b.pilier));
    });
    return res;
  }

  function textesPilier(p) {
    var contenu = C.diagnostic.contenus[etat.reponses.objectif][p];
    var ajouts = (contenu.ajouts || []).filter(function (a) {
      return a.si && a.si.valeurs.indexOf(etat.reponses[a.si.question]) !== -1;
    }).map(function (a) { return a.texte; });
    return { texte: contenu.texte, ajouts: ajouts };
  }

  function proteines() {
    if (!etat.poids) return null;
    var P = C.diagnostic.proteines;
    return { min: Math.round(etat.poids * P.coefMin), max: Math.round(etat.poids * P.coefMax) };
  }

  /* ---------------------------------------------------------------
     Navigation (bouton retour + geste retour du téléphone)
     --------------------------------------------------------------- */
  function aller(cle, options) {
    options = options || {};
    if (options.remplacer) {
      pile[pile.length - 1] = cle;
      try { history.replaceState({ bf: pile.length }, ""); } catch (e) {}
    } else {
      pile.push(cle);
      try { history.pushState({ bf: pile.length }, ""); } catch (e) {}
    }
    afficher(cle, "avant");
  }

  function revenir(longueur) {
    longueur = Math.max(1, longueur || pile.length - 1);
    if (longueur >= pile.length) return;
    pile = pile.slice(0, longueur);
    // L'écran d'analyse n'est jamais un écran de retour
    while (pile.length > 1 && pile[pile.length - 1] === "analyse") pile.pop();
    afficher(pile[pile.length - 1], "arriere");
  }

  btnRetour.addEventListener("click", function () {
    if (history.state && history.state.bf > 1) history.back();
    else revenir();
  });
  window.addEventListener("popstate", function (e) {
    var cible = e.state && e.state.bf;
    if (cible && cible < pile.length) revenir(cible);
  });

  /* ---------------------------------------------------------------
     Affichage d'un écran
     --------------------------------------------------------------- */
  var RENDUS = {
    accueil: rendreAccueil,
    capture: rendreCapture,
    analyse: rendreAnalyse,
    diagnostic: rendreDiagnostic,
    preuve: rendrePreuve,
    qualif: rendreQualifIntro,
    pasprete: rendrePasPrete,
    offres: rendreOffres,
    confirmation: rendreConfirmation
  };

  function afficher(cle, sens) {
    nettoyerMinuteurs();
    var noeud;
    if (cle.indexOf("q:") === 0) noeud = rendreQuestion(trouverQuestion(cle.slice(2)), "quiz");
    else if (cle.indexOf("qq:") === 0) noeud = rendreQuestion(trouverQuestion(cle.slice(3)), "qualif");
    else noeud = RENDUS[cle]();

    noeud.classList.add("ecran", sens === "arriere" ? "ecran--arriere" : "ecran--avant");
    scene.innerHTML = "";
    scene.appendChild(noeud);
    brancherPlaceholders(noeud);
    majEntete(cle);
    document.body.dataset.ecran = cle.replace(/:.*/, "");

    window.scrollTo(0, 0);
    var titre = $("h1, h2", noeud);
    if (titre) {
      titre.setAttribute("tabindex", "-1");
      try { titre.focus({ preventScroll: true }); } catch (e) { titre.focus(); }
    }
  }

  function majEntete(cle) {
    var sansRetour = cle === "accueil" || cle === "analyse";
    btnRetour.hidden = sansRetour;
    document.getElementById("retour-texte").textContent = C.textes.retour;

    var n = 0, total = 0, texte = "";
    if (cle.indexOf("q:") === 0) {
      var liste = questionsQuiz().map(function (q) { return q.id; });
      n = liste.indexOf(cle.slice(2)) + 1; total = liste.length;
      texte = remplacer(C.textes.progression, { n: n, total: total });
    } else if (cle.indexOf("qq:") === 0) {
      var lq = C.qualification.questions.map(function (q) { return q.id; });
      n = lq.indexOf(cle.slice(3)) + 1; total = lq.length;
      texte = remplacer(C.textes.progressionQualif, { n: n, total: total });
    }
    if (total) {
      var pct = Math.round(n / total * 100);
      blocProgression.hidden = false;
      progressionTexte.textContent = texte;
      progressionBarre.setAttribute("aria-valuenow", pct);
      progressionBarre.setAttribute("aria-valuetext", texte);
      progressionRemplissage.style.width = pct + "%";
    } else {
      blocProgression.hidden = true;
    }
  }

  /* ---------------------------------------------------------------
     Écran 1 · Accueil
     --------------------------------------------------------------- */
  function rendreAccueil() {
    var A = C.accueil, M = C.coach;
    var n = el(
      '<section class="accueil">' +
        '<div class="accueil__hero">' +
          image(C.marque.logo, C.marque.logoAlt, "accueil__logo", C.marque.nom) +
        '</div>' +
        '<p class="surtitre">' + A.surtitre + '</p>' +
        '<h1 class="titre titre--xl">' + A.titre + '</h1>' +
        '<p class="sous-titre">' + A.sousTitre + '</p>' +
        '<div class="credibilite">' +
          '<div class="avatar avatar--neon">' + image(M.photo, M.photoAlt, "avatar__img", "") + '</div>' +
          '<p class="credibilite__texte">' + M.ligne + '</p>' +
        '</div>' +
        '<button type="button" class="bouton bouton--principal bouton--neon" data-action="go">' + A.bouton +
          ' <span aria-hidden="true" class="bouton__fleche">→</span></button>' +
        '<p class="reassurance">' + A.reassurance + '</p>' +
      '</section>'
    );
    $("[data-action=go]", n).addEventListener("click", function () { aller(prochain("accueil")); });
    return n;
  }

  /* ---------------------------------------------------------------
     Questions (quiz + qualification)
     --------------------------------------------------------------- */
  function rendreQuestion(q, contexte) {
    var n;
    if (q.type === "nombre") {
      n = el(
        '<section class="question">' +
          '<h2 class="titre titre--q">' + q.question + '</h2>' +
          (q.aide ? '<p class="aide" id="aide-' + q.id + '">' + q.aide + '</p>' : "") +
          '<form class="champ-nombre" novalidate>' +
            '<label class="champ__label" for="champ-' + q.id + '">' + q.label + '</label>' +
            '<div class="champ__boite">' +
              '<input class="champ__input" id="champ-' + q.id + '" type="number" inputmode="decimal" min="' + q.min + '" max="' + q.max + '" step="0.1" ' +
                'placeholder="' + esc(q.placeholder) + '" aria-describedby="aide-' + q.id + ' erreur-' + q.id + '" value="' + (etat.poids || "") + '" />' +
              '<span class="champ__unite" aria-hidden="true">' + q.unite + '</span>' +
            '</div>' +
            '<p class="champ__erreur" id="erreur-' + q.id + '" role="alert"></p>' +
            '<button type="submit" class="bouton bouton--principal">' + C.textes.continuer + '</button>' +
            '<button type="button" class="bouton bouton--lien" data-action="passer">' + C.textes.passer + '</button>' +
          '</form>' +
        '</section>'
      );
      var input = $("input", n), erreur = $(".champ__erreur", n);
      $("form", n).addEventListener("submit", function (e) {
        e.preventDefault();
        var v = parseFloat(String(input.value).replace(",", "."));
        if (input.value === "") { etat.poids = null; aller(prochain("q:" + q.id)); return; }
        if (isNaN(v) || v < q.min || v > q.max) {
          erreur.textContent = q.erreur;
          input.setAttribute("aria-invalid", "true");
          input.focus();
          return;
        }
        etat.poids = v;
        aller(prochain("q:" + q.id));
      });
      $("[data-action=passer]", n).addEventListener("click", function () {
        etat.poids = null;
        aller(prochain("q:" + q.id));
      });
      return n;
    }

    var prefixe = contexte === "qualif" ? "qq:" : "q:";
    n = el(
      '<section class="question">' +
        '<h2 class="titre titre--q" id="titre-' + q.id + '">' + q.question + '</h2>' +
        (q.aide ? '<p class="aide">' + q.aide + '</p>' : "") +
        '<div class="options" role="group" aria-labelledby="titre-' + q.id + '">' +
          q.options.map(function (o, i) {
            var choisi = etat.reponses[q.id] === o.valeur;
            return '<button type="button" class="option' + (o.emoji ? " option--emoji" : "") + (choisi ? " est-choisie" : "") + '" ' +
              'aria-pressed="' + choisi + '" data-valeur="' + esc(o.valeur) + '" style="--i:' + i + '">' +
              (o.emoji ? '<span class="option__emoji" aria-hidden="true">' + o.emoji + '</span>' : "") +
              '<span class="option__label">' + o.label + '</span>' +
              '<span class="option__coche" aria-hidden="true"></span>' +
            '</button>';
          }).join("") +
        '</div>' +
      '</section>'
    );
    var verrou = false;
    $$(".option", n).forEach(function (b) {
      b.addEventListener("click", function () {
        if (verrou) return;
        verrou = true;
        var avant = etat.reponses[q.id];
        etat.reponses[q.id] = b.dataset.valeur;
        // Si l'objectif change, on efface les réponses spécifiques de l'ancien parcours
        if (q.id === C.objectif.id && avant && avant !== b.dataset.valeur) {
          (C.questionsSpecifiques[avant] || []).forEach(function (sq) { delete etat.reponses[sq.id]; });
        }
        $$(".option", n).forEach(function (o) {
          o.classList.toggle("est-choisie", o === b);
          o.setAttribute("aria-pressed", String(o === b));
        });
        b.classList.add("pulse");
        plus(function () { aller(prochain(prefixe + q.id)); }, reduitMouvement ? 120 : 380);
      });
    });
    return n;
  }

  /* ---------------------------------------------------------------
     Capture prénom + e-mail (bonus)
     --------------------------------------------------------------- */
  function resumePourEnvoi() {
    var d = calculerDiagnostic();
    var o = optionObjectif();
    return {
      prenom: etat.prenom, email: etat.email,
      objectif: o ? o.court : "",
      pilier_prioritaire: C.piliers[d[0].pilier].nom,
      niveaux: d.map(function (x) { return C.piliers[x.pilier].nom + " : " + x.niveau.label; }).join(" · "),
      reponses: etat.reponses, poids: etat.poids,
      date: new Date().toISOString()
    };
  }

  function rendreCapture() {
    var K = C.capture;
    if (K.mode === "tally" && K.tallyUrl) return rendreCaptureTally();
    var n = el(
      '<section class="capture">' +
        '<h2 class="titre titre--q">' + K.titre + '</h2>' +
        '<p class="aide">' + K.texte + '</p>' +
        '<form class="formulaire" novalidate>' +
          '<label class="champ__label" for="cap-prenom">' + K.labelPrenom + '</label>' +
          '<input class="champ__input champ__input--texte" id="cap-prenom" type="text" autocomplete="given-name" required value="' + esc(etat.prenom) + '" aria-describedby="err-prenom" />' +
          '<p class="champ__erreur" id="err-prenom" role="alert"></p>' +
          '<label class="champ__label" for="cap-email">' + K.labelEmail + '</label>' +
          '<input class="champ__input champ__input--texte" id="cap-email" type="email" inputmode="email" autocomplete="email" required value="' + esc(etat.email) + '" aria-describedby="err-email" />' +
          '<p class="champ__erreur" id="err-email" role="alert"></p>' +
          '<label class="case"><input type="checkbox" id="cap-ok" aria-describedby="err-ok" /><span class="case__boite" aria-hidden="true"></span><span>' + K.consentement + '</span></label>' +
          '<p class="champ__erreur" id="err-ok" role="alert"></p>' +
          '<button type="submit" class="bouton bouton--principal bouton--neon">' + K.bouton + '</button>' +
        '</form>' +
      '</section>'
    );
    $("form", n).addEventListener("submit", function (e) {
      e.preventDefault();
      var prenom = $("#cap-prenom", n).value.trim();
      var email = $("#cap-email", n).value.trim();
      var ok = $("#cap-ok", n).checked;
      var erreurs = [
        ["#cap-prenom", "#err-prenom", !prenom, K.erreurPrenom],
        ["#cap-email", "#err-email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), K.erreurEmail],
        ["#cap-ok", "#err-ok", !ok, K.erreurConsentement]
      ];
      var premier = null;
      erreurs.forEach(function (x) {
        $(x[1], n).textContent = x[2] ? x[3] : "";
        $(x[0], n).setAttribute("aria-invalid", String(x[2]));
        if (x[2] && !premier) premier = $(x[0], n);
      });
      if (premier) { premier.focus(); return; }
      etat.prenom = prenom; etat.email = email;
      if (K.webhookUrl) {
        try {
          fetch(K.webhookUrl, {
            method: "POST", mode: "no-cors", keepalive: true,
            headers: { "Content-Type": "text/plain;charset=UTF-8" },
            body: JSON.stringify(resumePourEnvoi())
          }).catch(function () {});
        } catch (err) {}
      }
      aller(prochain("capture"));
    });
    return n;
  }

  function rendreCaptureTally() {
    var K = C.capture, d = calculerDiagnostic(), o = optionObjectif();
    var src = K.tallyUrl.replace("/r/", "/embed/");
    src += (src.indexOf("?") === -1 ? "?" : "&") + "transparentBackground=1&dynamicHeight=1" +
      "&objectif=" + encodeURIComponent(o ? o.court : "") +
      "&pilier=" + encodeURIComponent(C.piliers[d[0].pilier].nom);
    var n = el(
      '<section class="capture">' +
        '<h2 class="titre titre--q">' + K.titre + '</h2>' +
        '<p class="aide">' + K.texte + '</p>' +
        '<iframe class="tally" src="' + esc(src) + '" title="Formulaire : ton prénom et ton e-mail" loading="lazy"></iframe>' +
        '<button type="button" class="bouton bouton--principal bouton--neon" aria-disabled="true">' + K.bouton + '</button>' +
      '</section>'
    );
    var b = $("button", n);
    function debloquer() { b.setAttribute("aria-disabled", "false"); }
    function surMessage(e) {
      if (String(e.data).indexOf("Tally.FormSubmitted") !== -1) { debloquer(); plus(function () { aller(prochain("capture")); }, 600); }
    }
    window.addEventListener("message", surMessage);
    plus(debloquer, 30000); // filet de sécurité si Tally ne prévient pas
    b.addEventListener("click", function () {
      if (b.getAttribute("aria-disabled") === "true") return;
      window.removeEventListener("message", surMessage);
      aller(prochain("capture"));
    });
    return n;
  }

  /* ---------------------------------------------------------------
     Écran d'analyse (transition vers le diagnostic)
     --------------------------------------------------------------- */
  function rendreAnalyse() {
    var phrases = C.textes.analyse;
    var n = el(
      '<section class="analyse">' +
        '<div class="analyse__anneau" aria-hidden="true"><span></span></div>' +
        '<h2 class="titre titre--q analyse__texte">' + phrases[0] + '</h2>' +
      '</section>'
    );
    var t = $(".analyse__texte", n);
    var duree = reduitMouvement ? 500 : 900;
    phrases.forEach(function (p, i) { if (i) plus(function () { t.textContent = p; }, i * duree); });
    plus(function () { aller("diagnostic", { remplacer: true }); }, phrases.length * duree);
    return n;
  }

  /* ---------------------------------------------------------------
     Diagnostic
     --------------------------------------------------------------- */
  function jauge(r, grande) {
    var largeur = Math.max(r.pct, 8);
    return '<div class="jauge jauge--' + r.niveau.id + (grande ? " jauge--grande" : "") + '">' +
      '<div class="jauge__piste" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + r.pct + '" ' +
        'aria-valuetext="' + esc(r.niveau.label) + '" aria-label="' + esc(C.piliers[r.pilier].nom) + '">' +
        '<span class="jauge__rempli" style="--w:' + largeur + '%"></span>' +
      '</div>' +
      (grande ? '<div class="jauge__echelle" aria-hidden="true">' +
        C.scoring.niveaux.map(function (nv) { return '<span' + (nv.id === r.niveau.id ? ' class="actif"' : "") + '>' + nv.label + '</span>'; }).join("") +
      '</div>' : "") +
    '</div>';
  }

  function cartePilier(r, prioritaire) {
    var P = C.piliers[r.pilier], t = textesPilier(r.pilier);
    return '<article class="pilier' + (prioritaire ? " pilier--prioritaire" : "") + '">' +
      '<div class="pilier__tete">' +
        '<span class="pilier__emoji" aria-hidden="true">' + P.emoji + '</span>' +
        '<h3 class="pilier__nom">' + P.nom + '</h3>' +
        '<span class="badge-niveau badge-niveau--' + r.niveau.id + '">' + r.niveau.label + '</span>' +
      '</div>' +
      jauge(r, prioritaire) +
      '<p class="pilier__texte">' + t.texte + '</p>' +
      (t.ajouts.length ? '<ul class="pilier__ajouts">' + t.ajouts.map(function (a) { return '<li>' + a + '</li>'; }).join("") + '</ul>' : "") +
    '</article>';
  }

  function carteProteines() {
    var p = proteines(), P = C.diagnostic.proteines;
    if (!p) return "";
    return '<aside class="carte-proteines">' +
      '<p class="carte-proteines__titre"><span aria-hidden="true">🥩</span> ' + P.titre + '</p>' +
      '<p class="carte-proteines__valeur">' + remplacer(P.texte, p) + '</p>' +
      '<p class="carte-proteines__mention">' + P.mention + '</p>' +
    '</aside>';
  }

  function rendreDiagnostic() {
    var D = C.diagnostic, d = calculerDiagnostic(), o = optionObjectif();
    var contenus = D.contenus[etat.reponses.objectif];
    var titre = etat.prenom ? remplacer(D.titreAvecPrenom, { prenom: esc(etat.prenom) }) : D.titre;
    var n = el(
      '<section class="diagnostic">' +
        '<p class="surtitre">' + D.surtitre + '</p>' +
        '<h2 class="titre titre--l">' + titre + '</h2>' +
        (o ? '<p class="puce-objectif">' + D.labelObjectif + ' : <strong>' + o.emoji + ' ' + o.court + '</strong></p>' : "") +
        '<p class="etiquette">' + D.labelPrioritaire + '</p>' +
        cartePilier(d[0], true) +
        '<p class="etiquette">' + D.labelAutres + '</p>' +
        cartePilier(d[1], false) +
        cartePilier(d[2], false) +
        carteProteines() +
        '<figure class="citation">' +
          '<div class="avatar avatar--petit">' + image(C.coach.photo, C.coach.photoAlt, "avatar__img", "") + '</div>' +
          '<blockquote><p>« ' + contenus.expertise + ' »</p></blockquote>' +
          '<figcaption>' + C.coach.prenom + ', coach Booty Flow</figcaption>' +
        '</figure>' +
        '<button type="button" class="bouton bouton--principal bouton--neon" data-action="go">' + D.bouton + '</button>' +
      '</section>'
    );
    $("[data-action=go]", n).addEventListener("click", function () { aller(prochain("diagnostic")); });
    // Animation des jauges
    requestAnimationFrame(function () { requestAnimationFrame(function () { n.classList.add("jauges-pretes"); }); });
    return n;
  }

  /* ---------------------------------------------------------------
     Preuve : carrousel de transformations
     --------------------------------------------------------------- */
  function rendrePreuve() {
    var P = C.preuve, T = P.transformations || [];
    var plusieurs = T.length > 1;
    var n = el(
      '<section class="preuve">' +
        '<h2 class="titre titre--l">' + P.titre + '</h2>' +
        '<div class="carrousel" aria-roledescription="carrousel" aria-label="Transformations">' +
          '<ul class="carrousel__piste" tabindex="0" aria-label="Fais glisser pour voir les transformations">' +
            T.map(function (t, i) {
              return '<li class="diapo" aria-roledescription="diapositive" aria-label="' + (i + 1) + ' sur ' + T.length + '">' +
                '<figure>' +
                  image(t.src, t.alt, "diapo__img" + (t.format === "paysage" ? " diapo__img--libre" : ""), P.placeholder) +
                  '<figcaption><strong class="diapo__legende">' + t.legende + '</strong>' +
                  (t.texte ? '<span class="diapo__texte">' + t.texte + '</span>' : "") + '</figcaption>' +
                '</figure>' +
              '</li>';
            }).join("") +
          '</ul>' +
          (plusieurs ?
            '<div class="carrousel__nav">' +
              '<button type="button" class="carrousel__fleche" data-dir="-1" aria-label="Transformation précédente">‹</button>' +
              '<div class="carrousel__points">' +
                T.map(function (t, i) { return '<button type="button" class="point' + (i ? "" : " actif") + '" data-i="' + i + '" aria-label="Voir la transformation ' + (i + 1) + '"' + (i ? "" : ' aria-current="true"') + '></button>'; }).join("") +
              '</div>' +
              '<button type="button" class="carrousel__fleche" data-dir="1" aria-label="Transformation suivante">›</button>' +
            '</div>' : "") +
        '</div>' +
        '<h3 class="sous-titre-section">' + P.titrePiliers + '</h3>' +
        '<ol class="trois-piliers">' +
          P.piliers.map(function (p) {
            return '<li><span class="trois-piliers__emoji" aria-hidden="true">' + p.emoji + '</span>' +
              '<div><strong>' + p.titre + '</strong><span>' + p.texte + '</span></div></li>';
          }).join("") +
        '</ol>' +
        '<button type="button" class="bouton bouton--principal bouton--neon" data-action="go">' + P.bouton + '</button>' +
      '</section>'
    );
    if (plusieurs) {
      var piste = $(".carrousel__piste", n), points = $$(".point", n);
      var courant = 0;
      var diapos = $$(".diapo", n);
      // La hauteur suit la diapositive affichée (photos verticales ou paysage)
      function ajusterHauteur() {
        var d = diapos[courant];
        if (d && d.offsetHeight) piste.style.height = d.offsetHeight + "px";
      }
      $$(".diapo img", n).forEach(function (img) { img.addEventListener("load", ajusterHauteur); });
      window.addEventListener("resize", ajusterHauteur);
      requestAnimationFrame(ajusterHauteur);
      function vers(i) {
        i = (i + T.length) % T.length;
        piste.scrollTo({ left: i * piste.clientWidth, behavior: reduitMouvement ? "auto" : "smooth" });
      }
      piste.addEventListener("scroll", function () {
        var i = Math.round(piste.scrollLeft / Math.max(piste.clientWidth, 1));
        if (i === courant) return;
        courant = i;
        ajusterHauteur();
        points.forEach(function (p, k) {
          p.classList.toggle("actif", k === i);
          if (k === i) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
        });
      }, { passive: true });
      points.forEach(function (p) { p.addEventListener("click", function () { vers(+p.dataset.i); }); });
      $$(".carrousel__fleche", n).forEach(function (f) { f.addEventListener("click", function () { vers(courant + (+f.dataset.dir)); }); });
      piste.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); vers(courant + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); vers(courant - 1); }
      });
    }
    $("[data-action=go]", n).addEventListener("click", function () { aller(prochain("preuve")); });
    return n;
  }

  /* ---------------------------------------------------------------
     Qualification
     --------------------------------------------------------------- */
  function rendreQualifIntro() {
    var Q = C.qualification.intro;
    var n = el(
      '<section class="qualif-intro">' +
        '<div class="anneau-neon" aria-hidden="true">💜</div>' +
        '<h2 class="titre titre--l">' + Q.titre + '</h2>' +
        '<p class="sous-titre">' + Q.texte + '</p>' +
        '<button type="button" class="bouton bouton--principal bouton--neon" data-action="go">' + Q.bouton + '</button>' +
      '</section>'
    );
    $("[data-action=go]", n).addEventListener("click", function () { aller(prochain("qualif")); });
    return n;
  }

  function rendrePasPrete() {
    var P = C.pasPrete, M = C.marque, d = calculerDiagnostic();
    var n = el(
      '<section class="pas-prete">' +
        '<h2 class="titre titre--l">' + P.titre + '</h2>' +
        '<p class="sous-titre">' + P.texte + '</p>' +
        '<div class="recap">' +
          '<h3 class="recap__titre">' + P.titreRecap + '</h3>' +
          '<ol class="recap__liste">' +
            d.map(function (r) {
              var t = textesPilier(r.pilier);
              return '<li><div class="recap__tete"><strong>' + C.piliers[r.pilier].emoji + ' ' + C.piliers[r.pilier].nom + '</strong>' +
                '<span class="badge-niveau badge-niveau--' + r.niveau.id + '">' + r.niveau.label + '</span></div>' +
                '<p>' + t.texte + '</p></li>';
            }).join("") +
          '</ol>' +
        '</div>' +
        carteProteines() +
        '<a class="bouton bouton--principal bouton--neon" href="' + esc(M.instagramUrl) + '" target="_blank" rel="noopener">' + P.boutonInstagram + '</a>' +
        (M.youtubeUrl ? '<a class="bouton bouton--secondaire" href="' + esc(M.youtubeUrl) + '" target="_blank" rel="noopener">' + P.boutonYoutube + '</a>' : "") +
        '<button type="button" class="bouton bouton--lien" data-action="offres">' + P.lienOffres + '</button>' +
      '</section>'
    );
    $("[data-action=offres]", n).addEventListener("click", function () { aller("offres"); });
    return n;
  }

  /* ---------------------------------------------------------------
     Offres : la SEULE porte vers Calendly
     --------------------------------------------------------------- */
  function formuleChoisie() {
    return C.offres.formules.filter(function (f) { return f.id === etat.formule; })[0] || null;
  }

  function urlCalendly() {
    var f = formuleChoisie(), o = optionObjectif(), d = calculerDiagnostic();
    var url = C.calendly.url;
    if (!C.calendly.prefill) return url;
    var params = [];
    function ajout(k, v) { if (v) params.push(k + "=" + encodeURIComponent(v)); }
    ajout("name", etat.prenom);
    ajout("email", etat.email);
    ajout("a1", f ? f.nom + " (" + f.prix + ")" : "");
    ajout("a2", o ? o.court : "");
    ajout("a3", C.piliers[d[0].pilier].nom + " · " + d[0].niveau.label);
    return url + (url.indexOf("?") === -1 ? "?" : "&") + params.join("&");
  }

  function peutReserver() { return !!(formuleChoisie() && etat.valide); }

  function rendreOffres() {
    var O = C.offres, M = C.coach;
    var n = el(
      '<section class="offres">' +
        '<h2 class="titre titre--l">' + O.titre + '</h2>' +
        '<div class="credibilite credibilite--offres">' +
          '<div class="avatar avatar--neon">' + image(M.photo, M.photoAlt, "avatar__img", "") + '</div>' +
          '<p class="credibilite__texte">' + O.credibilite + '</p>' +
        '</div>' +
        '<fieldset class="formules">' +
          '<legend class="etiquette">' + O.consigne + '</legend>' +
          O.formules.map(function (f) {
            var id = "formule-" + f.id;
            return '<label class="formule' + (f.recommande ? " formule--recommandee" : "") + '" for="' + id + '">' +
              '<input class="formule__radio" type="radio" name="formule" id="' + id + '" value="' + esc(f.id) + '"' + (etat.formule === f.id ? " checked" : "") + ' />' +
              (f.badge ? '<span class="formule__badge">' + f.badge + '</span>' : "") +
              '<span class="formule__tete">' +
                '<span class="formule__rond" aria-hidden="true"></span>' +
                '<span class="formule__nom">' + (f.emoji ? f.emoji + " " : "") + f.nom + '</span>' +
              '</span>' +
              '<ul class="formule__points">' + f.points.map(function (p) { return '<li>' + p + '</li>'; }).join("") + '</ul>' +
              '<span class="formule__prix"><strong>' + f.prix + '</strong> · ' + f.paiement + '</span>' +
            '</label>';
          }).join("") +
        '</fieldset>' +
        '<label class="case case--validation">' +
          '<input type="checkbox" id="validation"' + (etat.valide ? " checked" : "") + ' />' +
          '<span class="case__boite" aria-hidden="true"></span>' +
          '<span>' + O.validation + '</span>' +
        '</label>' +
        '<button type="button" class="bouton bouton--principal bouton--neon bouton--reserver" id="reserver" aria-describedby="aide-reserver">' +
          O.bouton + ' <span aria-hidden="true">📅</span></button>' +
        '<p class="aide aide--centre" id="aide-reserver" aria-live="polite"></p>' +
        '<p class="mention">' + O.mention + '</p>' +
      '</section>'
    );
    var bouton = $("#reserver", n), aide = $("#aide-reserver", n);
    function maj() {
      var ok = peutReserver();
      bouton.setAttribute("aria-disabled", String(!ok));
      bouton.classList.toggle("est-desactive", !ok);
      aide.textContent = ok ? "" : O.aideDesactive;
      $$(".formule", n).forEach(function (c) {
        c.classList.toggle("est-choisie", $("input", c).checked);
      });
    }
    $$(".formule__radio", n).forEach(function (r) {
      r.addEventListener("change", function () { etat.formule = r.value; maj(); });
    });
    $("#validation", n).addEventListener("change", function (e) { etat.valide = e.target.checked; maj(); });
    bouton.addEventListener("click", function () {
      if (!peutReserver()) {
        bouton.classList.remove("secoue"); void bouton.offsetWidth; bouton.classList.add("secoue");
        return;
      }
      ouvrirCalendly();
      aller("confirmation");
    });
    maj();
    return n;
  }

  function ouvrirCalendly() {
    if (!peutReserver()) return;
    var url = urlCalendly();
    var w = null;
    try { w = window.open(url, "_blank"); } catch (e) {}
    if (w) { try { w.opener = null; } catch (e) {} }
    else window.location.href = url;
  }

  /* ---------------------------------------------------------------
     Confirmation
     --------------------------------------------------------------- */
  function rendreConfirmation() {
    var K = C.confirmation, f = formuleChoisie();
    var n = el(
      '<section class="confirmation">' +
        '<div class="anneau-neon anneau-neon--grand" aria-hidden="true">' +
          image(C.coach.photo, "", "anneau-neon__img", "") +
        '</div>' +
        '<h2 class="titre titre--l">' + K.titre + '</h2>' +
        '<p class="sous-titre">' + K.texte + '</p>' +
        (f ? '<p class="puce-objectif">' + remplacer(K.rappel, { formule: "<strong>" + f.nom + "</strong>" }) + '</p>' : "") +
        '<a class="bouton bouton--secondaire" href="' + esc(C.marque.instagramUrl) + '" target="_blank" rel="noopener">' + K.boutonInstagram + '</a>' +
        (peutReserver() ? '<button type="button" class="bouton bouton--lien" data-action="secours">' + K.lienSecours + '</button>' : "") +
      '</section>'
    );
    var s = $("[data-action=secours]", n);
    if (s) s.addEventListener("click", ouvrirCalendly);
    return n;
  }

  /* ---------------------------------------------------------------
     Démarrage
     --------------------------------------------------------------- */
  document.getElementById("pied").textContent = C.pied;
  var logo = document.getElementById("entete-logo");
  logo.src = C.marque.logo; logo.alt = C.marque.logoAlt;
  logo.addEventListener("error", function () {
    var s = document.createElement("span");
    s.className = "entete__logo-texte"; s.textContent = C.marque.nom;
    logo.replaceWith(s);
  }, { once: true });

  pile = ["accueil"];
  try { history.replaceState({ bf: 1 }, ""); } catch (e) {}
  afficher("accueil", "avant");
})();
