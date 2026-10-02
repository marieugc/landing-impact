/* =====================================================================
   BOOTY FLOW — TUNNEL « RECOMP »
   ---------------------------------------------------------------------
   👉 TOUT le texte de la page se modifie ici.
   Règles simples :
   - Modifie uniquement ce qui est ENTRE les guillemets "…".
   - Ne supprime pas les virgules en fin de ligne.
   - Pour mettre un mot en gras : <strong>mot</strong>
   - Après modification, enregistre et recharge la page pour vérifier.
   ===================================================================== */

window.RECOMP_CONFIG = {

  /* ---------- Marque ---------- */
  marque: {
    nom: "Booty Flow",
    instagram: "@booty__flow",
    instagramUrl: "https://www.instagram.com/booty__flow/"
  },

  /* ---------- Écran 1 : Accroche ---------- */
  accroche: {
    surtitre: "Recomposition corporelle",
    titre: "Tu penses devoir maigrir avant de muscler tes fessiers ?",
    sousTitre: "Réponds à 6 questions et découvre ta stratégie de recomposition personnalisée (2 min)",
    bouton: "Je découvre ma stratégie",
    reassurance: "Gratuit · Sans inscription · Résultat immédiat"
  },

  /* ---------- Écran 2 : Le mythe ---------- */
  mythe: {
    titre: "Le mythe qui te fait perdre des mois",
    blocs: [
      {
        etiquette: "FAUX",
        style: "faux",            // faux | piege | vrai (couleur de la carte)
        titre: "Perdre du gras d'abord",
        texte: "Ton corps peut construire du muscle <strong>ET</strong> perdre du gras en même temps : c'est la recomposition corporelle. Plus tu attends d'être « sèche », plus c'est dur de construire du muscle ensuite."
      },
      {
        etiquette: "LE PIÈGE",
        style: "piege",
        titre: "Mincir sans se muscler",
        texte: "Résultat : une version plus fine de toi-même, sans forme ni galbe. Tu perds du volume là où tu voulais en gagner."
      },
      {
        etiquette: "LA VRAIE STRATÉGIE",
        style: "vrai",
        titre: "Les 3 leviers en même temps",
        texte: "Déficit calorique modéré <strong>+</strong> force ciblée bas du corps <strong>+</strong> protéines suffisantes <strong>=</strong> perte de gras ET galbe en même temps."
      }
    ],
    bouton: "Ok, je veux ma stratégie"
  },

  /* ---------- Écrans 3 à 8 : Quiz ----------
     - "id" et "valeur" servent à la logique de profils : ne les change
       que si tu modifies aussi les "regles" plus bas.
     - "label" = le texte affiché : modifiable librement.            */
  quiz: {
    boutonRetour: "Retour",
    boutonSuivant: "Continuer",
    progression: "Question {n} sur {total}",
    questions: [
      {
        id: "anciennete",
        type: "choix",
        question: "Depuis combien de temps tu t'entraînes ?",
        options: [
          { valeur: "moins6mois", label: "Moins de 6 mois" },
          { valeur: "6a12mois", label: "6 mois à 1 an" },
          { valeur: "plus1an", label: "Plus d'un an" }
        ]
      },
      {
        id: "resultats",
        type: "choix",
        question: "Où en sont tes résultats ?",
        options: [
          { valeur: "progresse", label: "Je progresse" },
          { valeur: "stagne", label: "Je stagne malgré mes efforts" },
          { valeur: "nesaispas", label: "Je ne sais pas, je ne suis rien" }
        ]
      },
      {
        id: "cardio",
        type: "choix",
        question: "Combien de séances de cardio par semaine ?",
        options: [
          { valeur: "0a1", label: "0 à 1" },
          { valeur: "2a3", label: "2 à 3" },
          { valeur: "4plus", label: "4 ou plus, j'espère que ça galbe mes fessiers" }
        ]
      },
      {
        id: "regimes",
        type: "choix",
        question: "As-tu déjà suivi un régime restrictif qui n'a rien donné sur le long terme ?",
        options: [
          { valeur: "plusieurs", label: "Oui, plusieurs fois" },
          { valeur: "unefois", label: "Une fois" },
          { valeur: "non", label: "Non" }
        ]
      },
      {
        id: "poids",
        type: "nombre",
        question: "Ton poids actuel",
        aide: "Il sert uniquement à calculer ton repère protéines. Il n'est enregistré nulle part.",
        label: "Poids en kilos",
        unite: "kg",
        placeholder: "Ex : 62",
        min: 35,
        max: 200,
        erreur: "Indique un poids entre 35 et 200 kg 💜"
      },
      {
        id: "objectif",
        type: "choix",
        question: "Ton objectif principal :",
        options: [
          { valeur: "lesdeux", label: "Perdre du gras ET muscler mes fessiers" },
          { valeur: "galber", label: "Surtout galber mes fessiers" },
          { valeur: "gras", label: "Surtout perdre du gras" }
        ]
      }
    ]
  },

  /* ---------- Logique de profils ----------
     Les règles sont testées DANS L'ORDRE : la première qui correspond
     donne le profil principal, la suivante qui correspond (s'il y en a
     une) devient le « point d'attention ».
     Une condition = { idQuestion: "valeur" } ou { idQuestion: ["valeur1", "valeur2"] }.
     Si plusieurs conditions : elles doivent TOUTES être vraies.          */
  regles: [
    { profil: "regimes",    si: { regimes: "plusieurs" } },
    { profil: "cardio",     si: { cardio: "4plus" } },
    { profil: "stagnation", si: { anciennete: "plus1an", resultats: "stagne" } },
    { profil: "debutante",  si: { anciennete: "moins6mois" } }
  ],
  profilParDefaut: "recomp",

  /* ---------- Contenu des profils ---------- */
  profils: {
    debutante: {
      nom: "Débutante",
      intro: "Ta priorité n'est pas encore la recomposition fine : c'est d'installer les bonnes bases (technique, régularité, apprentissage de la charge).",
      conseils: [
        "Fixe ta protéine en premier (repère : 1,6 à 2 g/kg), ajuste ensuite les glucides selon ton énergie.",
        "Priorise 2 à 3 séances de force bas du corps par semaine avec une exécution propre plutôt que du volume.",
        "Note tes charges chaque séance : sans suivi, impossible de savoir si tu progresses."
      ]
    },
    stagnation: {
      nom: "Stagnation malgré l'assiduité",
      intro: "Ta structure actuelle (calories, macros ou programmation) n'est plus adaptée à ton niveau. Le corps s'adapte vite.",
      conseils: [
        "Revérifie tes calories réelles : l'apport doit être réajusté toutes les 4 à 6 semaines.",
        "Introduis de la surcharge progressive (charge, reps ou volume) sur tes exercices bas du corps clés.",
        "Si tu stagnes depuis plus de 4 semaines malgré ces ajustements, un refeed ou une pause de déficit est probablement nécessaire."
      ]
    },
    cardio: {
      nom: "Cardio en excès",
      intro: "Le cardio seul ne construit pas de muscle et peut freiner ta progression s'il est mal dosé en déficit.",
      conseils: [
        "Réduis le cardio à 1-2 séances courtes par semaine le temps de rééquilibrer.",
        "Remplace ce temps par une séance de force supplémentaire fessiers/ischios.",
        "Vérifie que tes protéines sont suffisantes pour ne pas puiser dans le muscle."
      ]
    },
    regimes: {
      nom: "Historique de régimes restrictifs",
      intro: "Les régimes trop stricts rendent la recomposition plus difficile ensuite.",
      conseils: [
        "Remonte progressivement tes calories sur plusieurs semaines avant tout nouveau déficit.",
        "Vise un déficit modéré (10-15 % sous ta dépense, pas plus) pour préserver le muscle.",
        "Priorise le sommeil et la gestion du stress : ce sont aussi des leviers de récupération."
      ]
    },
    recomp: {
      nom: "Perdre du gras ET muscler en même temps",
      intro: "C'est exactement l'objectif de la recomposition corporelle.",
      conseils: [
        "Garde un déficit léger pour laisser de la place à la construction musculaire.",
        "Priorise la force progressive sur 3-4 exercices bas du corps clés plutôt que la variété.",
        "Mesure ta progression au miroir et au mètre ruban, pas seulement à la balance."
      ]
    }
  },

  /* ---------- Écran résultat ---------- */
  resultat: {
    chargement: "J'analyse tes réponses…",
    surtitre: "Ton profil",
    proteines: {
      titre: "Ton repère protéines",
      coefMin: 1.6,              // g par kg de poids
      coefMax: 2,
      unite: "g / jour",
      mention: "Repère indicatif, à calibrer selon ton profil complet."
    },
    conseilsTitre: "Tes 3 priorités",
    caseACocher: "Je vais l'appliquer",
    pointAttentionTitre: "Point d'attention",
    videoTitre: "Je t'explique tout en vidéo",
    youtubeId: "qTsSe-9S-08",    // l'identifiant de la vidéo (ce qui suit youtu.be/)
    bouton: "Voir une vraie transformation"
  },

  /* ---------- Écran transformation ---------- */
  transformation: {
    titre: "Elle était au même point que toi",
    // Une ou plusieurs photos : s'il y en a plusieurs, des onglets apparaissent.
    // Pour en ajouter une : copie une ligne { … }, et dépose l'image dans assets/.
    images: [
      { onglet: "De face", src: "assets/transformation-face.webp", alt: "Linda de face, avant et après 4 mois de recomposition corporelle" },
      { onglet: "De dos",  src: "assets/transformation-dos.webp",  alt: "Linda de dos, avant et après 4 mois de recomposition corporelle : fessiers plus galbés" }
    ],
    legende: "Linda · 4 mois d'accompagnement",
    placeholder: "Photo avant / après",
    texte: "4 mois de recomposition corporelle : <strong>-7&nbsp;kg</strong> pour Linda, avec une stratégie axée sur la musculation en priorité, du cardio dosé et un déficit calorique. La preuve que perdre du gras et se muscler en même temps, ça fonctionne quand la stratégie est la bonne.",
    bouton: "Je veux le même accompagnement"
  },

  /* ---------- Écran offre ---------- */
  offre: {
    titre: "Passe de la direction aux résultats",
    intro: "Ces conseils te donnent une direction. Pour des résultats qui durent, ils doivent être calibrés précisément à ton corps, ton historique et ton quotidien, et ajustés dans le temps.",
    principale: {
      emoji: "💜",
      badge: "Recommandé",
      nom: "Coaching Recomposition 6 mois",
      points: [
        "Suivi nutrition et entraînement personnalisé",
        "Ajustements réguliers selon ta progression",
        "Accompagnement direct avec moi"
      ],
      prix: "1200 €",
      paiement: "payable en 3 ou 4 fois"
    },
    accordeonTitre: "Budget limité pour le moment ?",
    secondaire: {
      nom: "Coaching Recomposition 3 mois",
      description: "Même méthode sur un format plus court, idéal pour poser les bases.",
      prix: "600 €",
      paiement: "payable en 3 ou 4 fois"
    },
    cta: "Réserver mon appel",
    mention: "Places limitées chaque mois pour garantir un suivi de qualité à chaque cliente.",
    recommencer: "Refaire le test"
  },

  /* ---------- Lien de réservation ----------
     Le profil obtenu est ajouté au lien Calendly (paramètre a1), il
     apparaît pré-rempli dans la 1re question de ton formulaire Calendly.
     Modèle utilisable : {profil} {pointAttention} {objectif} {proteines} */
  calendly: {
    url: "https://calendly.com/bootyflow/nouvelle-reunion",
    parametre: "a1",
    modele: "Profil : {profil}{pointAttention} | Objectif : {objectif} | Protéines : {proteines}"
  }
};
