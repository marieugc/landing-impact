/* =====================================================================
   BOOTY FLOW — TUNNEL « RECOMP »
   Logique de l'application. Les textes se modifient dans config.js.
   ===================================================================== */
(function () {
  "use strict";

  var C = window.RECOMP_CONFIG;
  var scene = document.getElementById("contenu");
  var reduireAnimations = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var QUESTIONS = C.quiz.questions;

  var etat = {
    reponses: {},
    ecran: null,
    pas: 0,          // nombre d'écrans parcourus (pour le bouton retour)
    enTransition: false
  };

  /* ------------------------------------------------------------------
     Outils
     ------------------------------------------------------------------ */
  function el(tag, attrs, enfants) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "html") n.innerHTML = v;          // texte venant de config.js
        else if (k === "text") n.textContent = v;
        else if (k === "class") n.className = v;
        else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? "" : v);
      });
    }
    (enfants || []).forEach(function (e) { if (e) n.appendChild(e); });
    return n;
  }

  function bouton(texte, onClick, classe) {
    return el("button", { type: "button", class: "btn " + (classe || "btn--principal"), onclick: onClick }, [
      el("span", { text: texte })
    ]);
  }

  function formatNombre(n) {
    return Math.round(n).toLocaleString("fr-FR");
  }

  /* ------------------------------------------------------------------
     Logique de profils
     ------------------------------------------------------------------ */
  function correspond(conditions, reponses) {
    return Object.keys(conditions).every(function (id) {
      var attendu = conditions[id];
      var valeur = reponses[id];
      return Array.isArray(attendu) ? attendu.indexOf(valeur) !== -1 : valeur === attendu;
    });
  }

  function calculerProfils(reponses) {
    var trouves = [];
    C.regles.forEach(function (r) {
      if (correspond(r.si, reponses) && trouves.indexOf(r.profil) === -1) trouves.push(r.profil);
    });
    return {
      principal: trouves[0] || C.profilParDefaut,
      secondaire: trouves[1] || null
    };
  }

  function calculerProteines(poids) {
    var p = C.resultat.proteines;
    return { min: poids * p.coefMin, max: poids * p.coefMax };
  }

  function libelleReponse(idQuestion) {
    var q = QUESTIONS.filter(function (x) { return x.id === idQuestion; })[0];
    if (!q || !q.options) return "";
    var o = q.options.filter(function (x) { return x.valeur === etat.reponses[idQuestion]; })[0];
    return o ? o.label : "";
  }

  function lienCalendly() {
    var profils = calculerProfils(etat.reponses);
    var prot = calculerProteines(etat.reponses.poids);
    var texte = C.calendly.modele
      .replace("{profil}", C.profils[profils.principal].nom)
      .replace("{pointAttention}", profils.secondaire ? " · Attention : " + C.profils[profils.secondaire].nom : "")
      .replace("{objectif}", libelleReponse("objectif"))
      .replace("{proteines}", formatNombre(prot.min) + "-" + formatNombre(prot.max) + " g/j");
    try {
      var url = new URL(C.calendly.url);
      url.searchParams.set(C.calendly.parametre, texte);
      return url.toString();
    } catch (e) {
      return C.calendly.url;
    }
  }

  function quizComplet() {
    return QUESTIONS.every(function (q) { return etat.reponses[q.id] !== undefined; });
  }

  /* ------------------------------------------------------------------
     Navigation entre les écrans (avec historique du navigateur)
     ------------------------------------------------------------------ */
  var ECRANS = {
    accroche: ecranAccroche,
    mythe: ecranMythe,
    chargement: ecranChargement,
    resultat: ecranResultat,
    transformation: ecranTransformation,
    offre: ecranOffre
  };
  QUESTIONS.forEach(function (q, i) { ECRANS["q" + i] = function () { return ecranQuestion(i); }; });

  function aller(nom, options) {
    options = options || {};
    if (!ECRANS[nom]) nom = "accroche";
    // Sécurité : pas de résultat sans réponses complètes
    if (["chargement", "resultat", "transformation", "offre"].indexOf(nom) !== -1 && !quizComplet()) nom = "accroche";

    if (options.historique === "push") {
      etat.pas += 1;
      history.pushState({ ecran: nom, pas: etat.pas }, "", "#" + nom);
    } else if (options.historique === "replace") {
      history.replaceState({ ecran: nom, pas: etat.pas }, "", "#" + nom);
    }
    afficher(nom, options.sens || "avant", options.focus !== false);
  }

  function suivant(nom) { aller(nom, { historique: "push" }); }

  function retour(nomParDefaut) {
    if (etat.pas > 0) history.back();
    else aller(nomParDefaut, { historique: "replace", sens: "arriere" });
  }

  window.addEventListener("popstate", function (e) {
    var s = e.state || {};
    etat.pas = s.pas || 0;
    aller(s.ecran || "accroche", { sens: "arriere" });
  });

  function afficher(nom, sens, donnerFocus) {
    var ancien = scene.querySelector(".ecran");
    var nouveau = ECRANS[nom]();
    nouveau.classList.add("ecran", "ecran--" + (sens === "arriere" ? "entree-arriere" : "entree-avant"));
    nouveau.setAttribute("data-ecran", nom);
    etat.ecran = nom;
    majProgression(nom);

    function monter() {
      if (ancien && ancien.parentNode) ancien.parentNode.removeChild(ancien);
      scene.appendChild(nouveau);
      window.scrollTo(0, 0);
      if (donnerFocus) {
        var titre = nouveau.querySelector("h1, h2");
        if (titre) { titre.setAttribute("tabindex", "-1"); titre.focus({ preventScroll: true }); }
      }
      if (nouveau._apresMontage) nouveau._apresMontage();
    }

    if (ancien && !reduireAnimations) {
      ancien.classList.add("ecran--sortie");
      setTimeout(monter, 160);
    } else {
      monter();
    }
  }

  function majProgression(nom) {
    var bloc = document.getElementById("progression");
    var match = /^q(\d+)$/.exec(nom);
    document.body.classList.toggle("en-quiz", !!match);
    if (!match) { bloc.hidden = true; return; }
    var i = parseInt(match[1], 10);
    var total = QUESTIONS.length;
    bloc.hidden = false;
    document.getElementById("progression-texte").textContent =
      C.quiz.progression.replace("{n}", i + 1).replace("{total}", total);
    var barre = document.getElementById("progression-barre");
    barre.setAttribute("aria-valuemax", total);
    barre.setAttribute("aria-valuenow", i + 1);
    barre.setAttribute("aria-valuetext", C.quiz.progression.replace("{n}", i + 1).replace("{total}", total));
    document.getElementById("progression-remplissage").style.width = ((i + 1) / total * 100) + "%";
  }

  /* ------------------------------------------------------------------
     Écran 1 : Accroche
     ------------------------------------------------------------------ */
  function ecranAccroche() {
    var a = C.accroche;
    return el("section", { class: "ecran--accroche", "aria-labelledby": "titre-accroche" }, [
      el("div", { class: "deco-cercles", "aria-hidden": "true" }),
      el("p", { class: "surtitre", text: a.surtitre }),
      el("h1", { id: "titre-accroche", class: "titre-xl", html: a.titre }),
      el("p", { class: "sous-titre", html: a.sousTitre }),
      bouton(a.bouton, function () { suivant("mythe"); }, "btn--principal btn--pulse"),
      el("p", { class: "reassurance", text: a.reassurance })
    ]);
  }

  /* ------------------------------------------------------------------
     Écran 2 : Le mythe
     ------------------------------------------------------------------ */
  var ICONES_MYTHE = { faux: "✕", piege: "!", vrai: "✓" };

  function ecranMythe() {
    var m = C.mythe;
    var liste = el("ol", { class: "mythe" });
    m.blocs.forEach(function (b, i) {
      liste.appendChild(el("li", { class: "mythe__bloc mythe__bloc--" + b.style, style: "--i:" + i }, [
        el("span", { class: "mythe__icone", "aria-hidden": "true", text: ICONES_MYTHE[b.style] || "•" }),
        el("div", null, [
          el("p", { class: "mythe__etiquette", text: b.etiquette }),
          el("h2", { class: "mythe__titre", html: b.titre }),
          el("p", { class: "mythe__texte", html: b.texte })
        ])
      ]));
    });
    return el("section", { "aria-labelledby": "titre-mythe" }, [
      el("h1", { id: "titre-mythe", class: "titre-l", html: m.titre }),
      liste,
      bouton(m.bouton, function () { suivant("q0"); })
    ]);
  }

  /* ------------------------------------------------------------------
     Écrans quiz
     ------------------------------------------------------------------ */
  function navQuestion(i) {
    return el("div", { class: "nav-question" }, [
      el("button", {
        type: "button", class: "btn-retour",
        onclick: function () { retour(i === 0 ? "mythe" : "q" + (i - 1)); }
      }, [el("span", { "aria-hidden": "true", text: "←" }), el("span", { text: " " + C.quiz.boutonRetour })])
    ]);
  }

  function apresReponse(i) {
    var prochain = i + 1 < QUESTIONS.length ? "q" + (i + 1) : "chargement";
    suivant(prochain);
  }

  function ecranQuestion(i) {
    var q = QUESTIONS[i];
    var idTitre = "question-" + q.id;
    var section = el("section", { "aria-labelledby": idTitre }, [navQuestion(i)]);
    section.appendChild(el("h1", { id: idTitre, class: "titre-l question", html: q.question }));
    if (q.type === "nombre") section.appendChild(champNombre(q, i));
    else section.appendChild(listeChoix(q, i, idTitre));
    return section;
  }

  function listeChoix(q, i, idTitre) {
    var verrou = false;
    var groupe = el("div", { class: "choix", role: "group", "aria-labelledby": idTitre });
    q.options.forEach(function (o, j) {
      var choisi = etat.reponses[q.id] === o.valeur;
      var b = el("button", {
        type: "button",
        class: "choix__option" + (choisi ? " est-choisi" : ""),
        "aria-pressed": choisi ? "true" : "false",
        style: "--i:" + j,
        onclick: function () {
          if (verrou) return;
          verrou = true;
          etat.reponses[q.id] = o.valeur;
          Array.prototype.forEach.call(groupe.children, function (x) {
            x.classList.remove("est-choisi");
            x.setAttribute("aria-pressed", "false");
          });
          b.classList.add("est-choisi");
          b.setAttribute("aria-pressed", "true");
          setTimeout(function () { apresReponse(i); }, reduireAnimations ? 60 : 320);
        }
      }, [
        el("span", { class: "choix__puce", "aria-hidden": "true" }),
        el("span", { class: "choix__label", html: o.label })
      ]);
      groupe.appendChild(b);
    });
    return groupe;
  }

  function champNombre(q, i) {
    var idChamp = "champ-" + q.id;
    var idAide = "aide-" + q.id;
    var idErreur = "erreur-" + q.id;
    var input = el("input", {
      id: idChamp, name: q.id, type: "text", inputmode: "decimal", autocomplete: "off",
      class: "champ__input", placeholder: q.placeholder, "aria-describedby": idAide + " " + idErreur,
      value: etat.reponses[q.id] !== undefined ? String(etat.reponses[q.id]).replace(".", ",") : null
    });
    var erreur = el("p", { id: idErreur, class: "champ__erreur", role: "alert" });

    function valider(e) {
      e.preventDefault();
      var v = parseFloat(String(input.value).replace(",", ".").replace(/\s/g, ""));
      if (isNaN(v) || v < q.min || v > q.max) {
        input.setAttribute("aria-invalid", "true");
        erreur.textContent = q.erreur;
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      erreur.textContent = "";
      etat.reponses[q.id] = v;
      input.blur();
      apresReponse(i);
    }

    var form = el("form", { class: "champ", novalidate: true, onsubmit: valider }, [
      el("label", { for: idChamp, class: "champ__label", text: q.label }),
      el("div", { class: "champ__ligne" }, [input, el("span", { class: "champ__unite", "aria-hidden": "true", text: q.unite })]),
      el("p", { id: idAide, class: "champ__aide", text: q.aide }),
      erreur,
      el("button", { type: "submit", class: "btn btn--principal" }, [el("span", { text: C.quiz.boutonSuivant })])
    ]);
    form._input = input;
    return form;
  }

  /* ------------------------------------------------------------------
     Chargement (petite pause « analyse »)
     ------------------------------------------------------------------ */
  function ecranChargement() {
    var s = el("section", { class: "chargement", "aria-labelledby": "titre-chargement" }, [
      el("div", { class: "chargement__anneau", "aria-hidden": "true" }),
      el("h1", { id: "titre-chargement", class: "titre-m", text: C.resultat.chargement })
    ]);
    s._apresMontage = function () {
      setTimeout(function () {
        if (etat.ecran === "chargement") aller("resultat", { historique: "replace" });
      }, reduireAnimations ? 300 : 1500);
    };
    return s;
  }

  /* ------------------------------------------------------------------
     Écran résultat
     ------------------------------------------------------------------ */
  function ecranResultat() {
    var R = C.resultat;
    var profils = calculerProfils(etat.reponses);
    var profil = C.profils[profils.principal];
    var prot = calculerProteines(etat.reponses.poids);

    var conseils = el("ul", { class: "conseils" });
    profil.conseils.forEach(function (texte, j) {
      var id = "conseil-" + j;
      conseils.appendChild(el("li", { class: "conseil", style: "--i:" + j }, [
        el("span", { class: "conseil__num", "aria-hidden": "true", text: String(j + 1) }),
        el("p", { class: "conseil__texte", id: id + "-texte", html: texte }),
        el("label", { class: "conseil__check" }, [
          el("input", { type: "checkbox", "aria-describedby": id + "-texte" }),
          el("span", { class: "conseil__case", "aria-hidden": "true" }),
          el("span", { text: R.caseACocher })
        ])
      ]));
    });

    var attention = null;
    if (profils.secondaire) {
      var p2 = C.profils[profils.secondaire];
      attention = el("aside", { class: "attention", "aria-labelledby": "titre-attention" }, [
        el("p", { class: "attention__etiquette", id: "titre-attention", text: R.pointAttentionTitre }),
        el("h2", { class: "attention__titre", html: p2.nom }),
        el("p", { html: p2.intro }),
        el("p", { class: "attention__conseil", html: "→ " + p2.conseils[0] })
      ]);
    }

    return el("section", { class: "resultat", "aria-labelledby": "titre-profil" }, [
      el("div", { class: "resultat__entete" }, [
        el("p", { class: "surtitre", text: R.surtitre }),
        el("h1", { id: "titre-profil", class: "titre-l resultat__nom", html: profil.nom }),
        el("p", { class: "resultat__intro", html: profil.intro })
      ]),
      el("div", { class: "carte-proteines" }, [
        el("p", { class: "carte-proteines__titre", text: R.proteines.titre }),
        el("p", { class: "carte-proteines__valeur" }, [
          el("strong", { text: formatNombre(prot.min) + " à " + formatNombre(prot.max) }),
          el("span", { text: " " + R.proteines.unite })
        ]),
        el("p", { class: "carte-proteines__calcul",
          text: formatNombre(etat.reponses.poids) + " kg × " + String(R.proteines.coefMin).replace(".", ",") +
                " à " + String(R.proteines.coefMax).replace(".", ",") + " g/kg" }),
        el("p", { class: "carte-proteines__mention", text: R.proteines.mention })
      ]),
      el("h2", { class: "titre-m", text: R.conseilsTitre }),
      conseils,
      attention,
      el("h2", { class: "titre-m", text: R.videoTitre }),
      el("div", { class: "video" }, [
        el("iframe", {
          src: "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(R.youtubeId) + "?rel=0&playsinline=1",
          title: R.videoTitre, loading: "lazy", allowfullscreen: true,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          referrerpolicy: "strict-origin-when-cross-origin"
        })
      ]),
      bouton(R.bouton, function () { suivant("transformation"); })
    ]);
  }

  /* ------------------------------------------------------------------
     Écran transformation
     ------------------------------------------------------------------ */
  function ecranTransformation() {
    var T = C.transformation;
    var images = T.images || [{ src: T.image, alt: T.imageAlt }];

    function placeholder() {
      return el("div", { class: "transfo__placeholder", role: "img", "aria-label": T.placeholder }, [
        el("div", { class: "transfo__moitie" }, [el("span", { text: "Avant" })]),
        el("div", { class: "transfo__moitie transfo__moitie--apres" }, [el("span", { text: "Après" })])
      ]);
    }

    var cadre = el("figure", { class: "transfo" });
    var vues = images.map(function (im, i) {
      var img = el("img", { class: "transfo__img", src: im.src, alt: im.alt, decoding: "async", loading: i ? "lazy" : null });
      img.addEventListener("error", function () { if (img.parentNode) img.parentNode.replaceChild(placeholder(), img); });
      img.addEventListener("load", function () { img.classList.add("est-chargee"); });
      return el("div", { class: "transfo__vue", id: "transfo-vue-" + i, hidden: i > 0 }, [img]);
    });

    if (images.length > 1) {
      var onglets = el("div", { class: "transfo__onglets", role: "group", "aria-label": "Choisir la vue" });
      images.forEach(function (im, i) {
        var b = el("button", {
          type: "button", class: "transfo__onglet", "aria-pressed": i === 0 ? "true" : "false",
          "aria-controls": "transfo-vue-" + i, text: im.onglet || "Photo " + (i + 1),
          onclick: function () {
            Array.prototype.forEach.call(onglets.children, function (x, k) { x.setAttribute("aria-pressed", k === i ? "true" : "false"); });
            vues.forEach(function (v, k) { v.hidden = k !== i; });
          }
        });
        onglets.appendChild(b);
      });
      cadre.appendChild(onglets);
    }
    vues.forEach(function (v) { cadre.appendChild(v); });
    if (T.legende) cadre.appendChild(el("figcaption", { class: "transfo__legende", text: T.legende }));

    return el("section", { "aria-labelledby": "titre-transfo" }, [
      el("h1", { id: "titre-transfo", class: "titre-l", html: T.titre }),
      cadre,
      el("p", { class: "transfo__texte", html: T.texte }),
      bouton(T.bouton, function () { suivant("offre"); })
    ]);
  }

  /* ------------------------------------------------------------------
     Écran offre
     ------------------------------------------------------------------ */
  function ecranOffre() {
    var O = C.offre;
    var P = O.principale;
    var S = O.secondaire;
    var lien = lienCalendly();

    function cta() {
      return el("a", { class: "btn btn--principal btn--pulse", href: lien, target: "_blank", rel: "noopener" }, [
        el("span", { text: O.cta })
      ]);
    }

    var points = el("ul", { class: "offre__points" });
    P.points.forEach(function (t) { points.appendChild(el("li", { html: t })); });

    return el("section", { class: "offre", "aria-labelledby": "titre-offre" }, [
      el("h1", { id: "titre-offre", class: "titre-l", html: O.titre }),
      el("p", { class: "offre__intro", html: O.intro }),

      el("article", { class: "carte-offre carte-offre--principale", "aria-labelledby": "nom-offre-1" }, [
        el("span", { class: "badge", text: P.badge }),
        el("h2", { id: "nom-offre-1", class: "carte-offre__nom" }, [
          el("span", { "aria-hidden": "true", text: P.emoji + " " }),
          el("span", { html: P.nom })
        ]),
        points,
        el("p", { class: "prix" }, [
          el("strong", { text: P.prix }),
          el("span", { text: " · " + P.paiement })
        ]),
        cta()
      ]),

      el("details", { class: "accordeon" }, [
        el("summary", { text: O.accordeonTitre }),
        el("article", { class: "carte-offre", "aria-labelledby": "nom-offre-2" }, [
          el("h2", { id: "nom-offre-2", class: "carte-offre__nom", html: S.nom }),
          el("p", { html: S.description }),
          el("p", { class: "prix" }, [
            el("strong", { text: S.prix }),
            el("span", { text: " · " + S.paiement })
          ]),
          el("a", { class: "btn btn--secondaire", href: lien, target: "_blank", rel: "noopener" }, [
            el("span", { text: O.cta })
          ])
        ])
      ]),

      el("p", { class: "mention-places", html: O.mention }),
      el("button", {
        type: "button", class: "lien-discret",
        onclick: function () { etat.reponses = {}; aller("accroche", { historique: "push" }); },
        text: O.recommencer
      })
    ]);
  }

  /* ------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------ */
  document.getElementById("logo").textContent = C.marque.nom;
  document.getElementById("pied").appendChild(el("p", null, [
    el("span", { text: "© " + new Date().getFullYear() + " " + C.marque.nom + " · " }),
    el("a", { href: C.marque.instagramUrl, target: "_blank", rel: "noopener", text: C.marque.instagram })
  ]));

  aller("accroche", { historique: "replace", focus: false });
})();
