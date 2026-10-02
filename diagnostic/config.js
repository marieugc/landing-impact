/* =====================================================================
   BOOTY FLOW · TEST « DIAGNOSTIC »
   ---------------------------------------------------------------------
   👉 TOUS les textes, questions, prix et liens se modifient ICI.

   Règles simples :
   - Modifie uniquement ce qui est ENTRE les guillemets "…".
   - Ne supprime ni les virgules en fin de ligne, ni les accolades { }.
   - Pour mettre un mot en gras : <strong>mot</strong>
   - Les "id" et "valeur" servent à la logique : ne les change pas
     (ou change-les partout où ils apparaissent). Les "label" sont libres.
   - Après une modification : enregistre, puis recharge la page.
   ===================================================================== */

window.BF_CONFIG = {

  /* =================================================================
     1. MARQUE & LIENS
     ================================================================= */
  marque: {
    nom: "Booty Flow",
    logo: "assets/logo.webp",
    logoAlt: "Booty Flow Coaching",
    instagram: "@booty__flow",
    instagramUrl: "https://instagram.com/booty__flow",
    // 👉 Colle ici le lien de ta chaîne YouTube. Laisse "" pour masquer le bouton.
    youtubeUrl: ""
  },

  // Le SEUL lien vers ton agenda dans toute l'expérience.
  // Il n'est accessible qu'après le choix ET la validation d'une formule.
  calendly: {
    url: "https://calendly.com/bootyflow/nouvelle-reunion",
    // Dans Calendly, crée 3 questions dans ton événement (dans cet ordre) :
    // 1. « Formule choisie »  2. « Objectif »  3. « Pilier prioritaire »
    // Elles seront pré-remplies automatiquement (paramètres a1, a2, a3).
    prefill: true
  },

  /* =================================================================
     2. CRÉDIBILITÉ (affichée sur l'accueil et l'écran des offres)
     ================================================================= */
  coach: {
    prenom: "Marie",
    photo: "assets/marie.jpg",
    photoAlt: "Marie, coach fondatrice de Booty Flow",
    ligne: "Par Marie · 11 ans d'expérience · Compétitrice Wellness · Juge de compétition",
    points: [
      "11 ans d'expérience en coaching",
      "Compétitrice Wellness, une catégorie où le développement du bas du corps est un critère de sélection",
      "Juge de compétition IFBB : je sais exactement ce qui fait un physique développé et harmonieux"
    ]
  },

  /* =================================================================
     3. ÉCRAN 1 · ACCUEIL
     ================================================================= */
  accueil: {
    surtitre: "Test gratuit · 2 minutes",
    titre: "Découvre ce qui bloque vraiment tes résultats",
    sousTitre: "Réponds à quelques questions (2 min) et reçois ton diagnostic personnalisé : entraînement, alimentation, suivi.",
    bouton: "Je commence mon test",
    reassurance: "Gratuit · Sans inscription · Résultat immédiat"
  },

  /* =================================================================
     4. TEXTES COMMUNS DU QUIZ
     ================================================================= */
  textes: {
    retour: "Retour",
    continuer: "Continuer",
    passer: "Passer cette question",
    progression: "Question {n} sur {total}",
    progressionQualif: "Dernière ligne droite · {n} sur {total}",
    analyse: [
      "J'analyse tes réponses…",
      "Je calcule tes 3 piliers…",
      "Je prépare tes priorités…"
    ]
  },

  /* =================================================================
     5. ÉCRAN 2 · OBJECTIF (aiguillage principal)
     Les valeurs "gras", "muscle", "fessiers" sont utilisées partout
     plus bas : ne les modifie pas.
     ================================================================= */
  objectif: {
    id: "objectif",
    question: "Quel est ton objectif principal ?",
    aide: "Ton parcours et ton diagnostic s'adaptent à ta réponse.",
    options: [
      { valeur: "gras",     emoji: "🔥", label: "Perdre du gras (et garder mes formes)", court: "Perte de gras" },
      { valeur: "muscle",   emoji: "💪", label: "Prendre du muscle de façon générale",    court: "Prise de muscle générale" },
      { valeur: "fessiers", emoji: "🍑", label: "Développer mes fessiers en priorité",    court: "Développement des fessiers" }
    ]
  },

  /* =================================================================
     6. QUESTIONS COMMUNES (une question par écran)
     -----------------------------------------------------------------
     "points" = points « à corriger » ajoutés à chaque pilier :
        E = Entraînement · A = Alimentation · S = Suivi
     Plus un pilier cumule de points, plus il est prioritaire.
     Exemple : points: { E: 3, S: 1 } ajoute 3 en Entraînement et 1 en Suivi.
     ================================================================= */
  questionsCommunes: [
    {
      id: "anciennete",
      type: "choix",
      question: "Depuis combien de temps t'entraînes-tu en musculation ?",
      options: [
        { valeur: "pasencore", label: "Je ne m'entraîne pas encore", points: { E: 3 } },
        { valeur: "moins6",    label: "Moins de 6 mois",             points: { E: 2 } },
        { valeur: "6a24",      label: "6 mois à 2 ans",              points: { E: 1 } },
        { valeur: "plus2ans",  label: "Plus de 2 ans",               points: {} }
      ]
    },
    {
      id: "seances",
      type: "choix",
      question: "Combien de séances par semaine ?",
      options: [
        { valeur: "0a1",   label: "0-1",       points: { E: 3 } },
        { valeur: "2a3",   label: "2-3",       points: { E: 1 } },
        { valeur: "4a5",   label: "4-5",       points: {} },
        { valeur: "6plus", label: "6 ou plus", points: { E: 1, S: 1 } }
      ]
    },
    {
      id: "programme",
      type: "choix",
      question: "Comment construis-tu tes séances ?",
      options: [
        { valeur: "aucun",     label: "Je n'ai pas de programme",                    points: { E: 3 } },
        { valeur: "gratuit",   label: "Je suis des vidéos ou programmes gratuits",   points: { E: 2 } },
        { valeur: "nonperso",  label: "J'ai un programme mais pas personnalisé",     points: { E: 1 } },
        { valeur: "perso",     label: "J'ai un programme personnalisé",              points: {} }
      ]
    },
    {
      id: "alimentation",
      type: "choix",
      question: "Ton alimentation aujourd'hui ?",
      options: [
        { valeur: "sanspenser",   label: "Je mange sans vraiment y penser",              points: { A: 3 } },
        { valeur: "sansreperes",  label: "J'essaie de faire attention mais sans repères", points: { A: 2 } },
        { valeur: "calories",     label: "Je compte mes calories mais pas mes protéines", points: { A: 2 } },
        { valeur: "plan",         label: "Je suis un plan précis",                        points: {} }
      ]
    },
    {
      id: "suivi",
      type: "choix",
      question: "Est-ce que tu suis ta progression ?",
      aide: "Charges, photos, mensurations…",
      options: [
        { valeur: "jamais",     label: "Jamais",              points: { S: 4 } },
        { valeur: "parfois",    label: "De temps en temps",   points: { S: 2 } },
        { valeur: "hebdo",      label: "Chaque semaine",      points: {} }
      ]
    },
    {
      id: "poids",
      type: "nombre",
      question: "Ton poids actuel",
      aide: "Facultatif. Il sert uniquement à calculer ton repère protéines. Il n'est enregistré nulle part.",
      label: "Poids en kilos",
      unite: "kg",
      placeholder: "Ex : 62",
      min: 35,
      max: 200,
      erreur: "Indique un poids entre 35 et 200 kg, ou passe cette question 💜"
    }
  ],

  /* =================================================================
     7. QUESTIONS SPÉCIFIQUES SELON L'OBJECTIF
     ================================================================= */
  questionsSpecifiques: {
    gras: [
      {
        id: "regimes",
        type: "choix",
        question: "As-tu déjà suivi des régimes restrictifs ?",
        options: [
          { valeur: "plusieurs", label: "Oui, plusieurs fois", points: { A: 3, S: 1 } },
          { valeur: "unefois",   label: "Une fois",            points: { A: 1 } },
          { valeur: "non",       label: "Non",                 points: {} }
        ]
      },
      {
        id: "cardio",
        type: "choix",
        question: "Combien de séances de cardio par semaine ?",
        options: [
          { valeur: "0a1",   label: "0-1",       points: {} },
          { valeur: "2a3",   label: "2-3",       points: {} },
          { valeur: "4plus", label: "4 ou plus", points: { E: 2, A: 1 } }
        ]
      }
    ],
    muscle: [
      {
        id: "charges",
        type: "choix",
        question: "Est-ce que tu progresses sur tes charges ?",
        options: [
          { valeur: "oui",       label: "Oui, régulièrement", points: {} },
          { valeur: "stagne",    label: "Je stagne",          points: { E: 2, S: 1 } },
          { valeur: "nesaispas", label: "Je ne sais pas",     points: { S: 3 } }
        ]
      },
      {
        id: "mangeassez",
        type: "choix",
        question: "Manges-tu assez pour construire du muscle ?",
        options: [
          { valeur: "oui",       label: "Oui",               points: {} },
          { valeur: "nonpense",  label: "Je ne pense pas",   points: { A: 3 } },
          { valeur: "nesaispas", label: "Je ne sais pas",    points: { A: 2, S: 1 } }
        ]
      }
    ],
    fessiers: [
      {
        id: "exercices",
        type: "choix",
        question: "Quels exercices font la base de tes séances bas du corps ?",
        options: [
          { valeur: "squats",     label: "Surtout squats et fentes",                 points: { E: 3 } },
          { valeur: "cibles",     label: "Hip thrust et exercices ciblés fessiers",  points: {} },
          { valeur: "melange",    label: "Un peu de tout, sans logique",             points: { E: 2 } },
          { valeur: "nesaispas",  label: "Je ne sais pas",                           points: { E: 3 } }
        ]
      },
      {
        id: "frequence",
        type: "choix",
        question: "Combien de fois par semaine tes fessiers sont-ils vraiment ciblés ?",
        options: [
          { valeur: "1",     label: "1 fois",          points: { E: 2 } },
          { valeur: "2",     label: "2 fois",          points: {} },
          { valeur: "3plus", label: "3 fois ou plus",  points: {} }
        ]
      }
    ]
  },

  /* =================================================================
     8. CAPTURE PRÉNOM + E-MAIL (bonus, désactivée par défaut)
     -----------------------------------------------------------------
     actif: true  → un écran demande prénom + e-mail avant le diagnostic.
     mode: "formulaire" → mon formulaire intégré. Les données sont
           envoyées à "webhookUrl" (Make, Zapier, Google Sheets…).
     mode: "tally" → ton formulaire Tally s'affiche à la place.
           Colle son lien dans "tallyUrl" (ex : https://tally.so/r/abcd12).
     ================================================================= */
  capture: {
    actif: false,
    mode: "formulaire",
    webhookUrl: "",
    tallyUrl: "",
    titre: "Ton diagnostic est prêt 💜",
    texte: "Où est-ce que je te l'envoie ? Tu le verras aussi tout de suite à l'écran.",
    labelPrenom: "Ton prénom",
    labelEmail: "Ton e-mail",
    consentement: "J'accepte de recevoir mon diagnostic et les conseils de Booty Flow par e-mail. Désinscription en un clic.",
    bouton: "Voir mon diagnostic",
    erreurPrenom: "Indique ton prénom",
    erreurEmail: "Indique une adresse e-mail valide",
    erreurConsentement: "Coche la case pour continuer"
  },

  /* =================================================================
     9. LOGIQUE DE DIAGNOSTIC
     -----------------------------------------------------------------
     Pour chaque pilier, le score = points cumulés ÷ maximum possible
     sur le parcours de la personne (calcul automatique), en %.

     Niveaux (le premier dont le % est inférieur ou égal à "jusqua") :
       0 à 30 %   → À optimiser
       31 à 60 %  → À structurer
       61 à 100 % → Point bloquant

     Pilier prioritaire = le % le plus élevé, + le "bonusPriorite" de
     l'objectif (en points de %, sert UNIQUEMENT à départager, la jauge
     affichée ne change pas). Ex : pour les fessiers, l'entraînement
     ciblé est le levier n°1, donc il passe devant à score proche.
     En cas d'égalité parfaite, on suit l'ordre de "egalite".
     ================================================================= */
  scoring: {
    niveaux: [
      { jusqua: 30,  id: "optimiser",  label: "À optimiser" },
      { jusqua: 60,  id: "structurer", label: "À structurer" },
      { jusqua: 100, id: "bloquant",   label: "Point bloquant" }
    ],
    bonusPriorite: {
      gras:     { A: 5 },
      muscle:   { E: 5 },
      fessiers: { E: 10 }
    },
    egalite: {
      gras:     ["A", "E", "S"],
      muscle:   ["E", "A", "S"],
      fessiers: ["E", "A", "S"]
    }
  },

  piliers: {
    E: { nom: "Entraînement", emoji: "🏋️‍♀️" },
    A: { nom: "Alimentation", emoji: "🥗" },
    S: { nom: "Suivi",        emoji: "📈" }
  },

  /* =================================================================
     10. CONTENU EXPERT DU DIAGNOSTIC
     -----------------------------------------------------------------
     Pour chaque objectif et chaque pilier :
       texte  → toujours affiché
       ajouts → affichés seulement si la condition "si" est remplie
                si: { question: "id", valeurs: ["valeur1", "valeur2"] }
     {prenom} est remplacé par son prénom (si la capture est active).
     ================================================================= */
  diagnostic: {
    surtitre: "Ton diagnostic personnalisé",
    titre: "Voici ce qui bloque vraiment tes résultats",
    titreAvecPrenom: "{prenom}, voici ce qui bloque vraiment tes résultats",
    labelPrioritaire: "Ta priorité n°1",
    labelAutres: "Tes deux autres piliers",
    labelObjectif: "Ton objectif",
    bouton: "Voir une vraie transformation",

    proteines: {
      titre: "Ton repère protéines",
      texte: "Entre <strong>{min} g</strong> et <strong>{max} g</strong> de protéines par jour",
      coefMin: 1.6,
      coefMax: 2,
      mention: "Repère indicatif. Tes vrais besoins dépendent de ton profil complet."
    },

    contenus: {
      gras: {
        expertise: "En tant que juge de compétition, c'est exactement ce que je vois sur scène : les physiques les plus harmonieux ne sont pas ceux qui ont le plus restreint, ce sont ceux qui ont gardé leur muscle pendant la sèche.",
        E: {
          texte: "La musculation reste ta priorité, même en perte de gras. C'est elle qui te permet de garder (et même de construire) du muscle, pour ne pas devenir « une version plus fine de toi sans les formes ». Le cardio est un complément, pas la base.",
          ajouts: [
            { si: { question: "cardio", valeurs: ["4plus"] }, texte: "Avec 4 séances de cardio ou plus, tu risques de grignoter ton muscle et ta récupération : on réduit et on remet la musculation au centre." },
            { si: { question: "programme", valeurs: ["aucun", "gratuit"] }, texte: "Sans programme construit pour toi, impossible d'appliquer une vraie surcharge progressive : c'est ce qui envoie le signal à ton corps de garder son muscle." }
          ]
        },
        A: {
          texte: "Un déficit <strong>modéré</strong>, jamais agressif, et des protéines hautes (repère : 1,6 à 2 g par kilo de poids de corps) pour protéger ton muscle.",
          ajouts: [
            { si: { question: "regimes", valeurs: ["plusieurs", "unefois"] }, texte: "Avec ton historique de régimes restrictifs, on commence par <strong>remonter progressivement tes calories</strong> avant de relancer un nouveau déficit. Sinon, ton corps résiste et tu stagnes." },
            { si: { question: "alimentation", valeurs: ["calories"] }, texte: "Compter tes calories sans regarder tes protéines, c'est perdre du poids… mais pas forcément du gras." }
          ]
        },
        S: {
          texte: "La balance ne suffit pas. Mensurations et photos <strong>chaque semaine</strong> pour voir la recomposition : tu peux perdre du gras et gagner du muscle sans que le chiffre bouge.",
          ajouts: [
            { si: { question: "suivi", valeurs: ["jamais"] }, texte: "Sans aucun suivi, tu ne peux pas savoir quand ajuster : c'est souvent là que la motivation lâche." }
          ]
        }
      },

      muscle: {
        expertise: "En tant que juge de compétition, c'est exactement ce que je vois sur scène : les physiques les plus développés sont ceux qui ont une stratégie précise, pas ceux qui en font le plus.",
        E: {
          texte: "Surcharge progressive sur des exercices de base, chaque groupe musculaire stimulé environ <strong>2 fois par semaine</strong>, avec une programmation adaptée à ton niveau.",
          ajouts: [
            { si: { question: "charges", valeurs: ["stagne"] }, texte: "Tu stagnes : ton corps s'est adapté. Il faut faire évoluer le volume, l'intensité et le choix des exercices, pas juste « forcer plus »." },
            { si: { question: "anciennete", valeurs: ["pasencore", "moins6"] }, texte: "Bonne nouvelle : en début de parcours, ton potentiel de progression est énorme si les bases sont bien posées dès maintenant." }
          ]
        },
        A: {
          texte: "Un léger surplus ou une maintenance bien calibrée, avec des protéines suffisantes. Sans assez d'énergie, pas de construction.",
          ajouts: [
            { si: { question: "mangeassez", valeurs: ["nonpense", "nesaispas"] }, texte: "C'est très probablement un de tes freins principaux : beaucoup de femmes s'entraînent dur mais mangent comme si elles étaient en sèche." }
          ]
        },
        S: {
          texte: "Note tes charges <strong>à chaque séance</strong>. Sinon, impossible de savoir si tu progresses vraiment.",
          ajouts: [
            { si: { question: "charges", valeurs: ["nesaispas"] }, texte: "Tu ne sais pas si tu progresses sur tes charges : c'est le premier réflexe à mettre en place, dès ta prochaine séance." }
          ]
        }
      },

      fessiers: {
        expertise: "En tant que compétitrice Wellness et juge de compétition, je le vois sur chaque scène : les fessiers les plus développés sont ceux qui ont une stratégie précise, pas ceux qui enchaînent le plus de squats.",
        E: {
          texte: "Le squat seul ne suffit pas : il sollicite beaucoup les cuisses. Il te faut une <strong>séance spécifique fessiers</strong> + des rappels fessiers sur tes autres séances, avec des exercices ciblés (hip thrust, abductions…) et de la surcharge progressive.",
          ajouts: [
            { si: { question: "exercices", valeurs: ["squats"] }, texte: "Tes séances reposent surtout sur squats et fentes : c'est souvent pour ça que les cuisses se développent plus vite que les fessiers." },
            { si: { question: "frequence", valeurs: ["1"] }, texte: "1 fois par semaine, c'est trop peu pour faire réellement grossir tes fessiers : vise 2 à 3 stimulations bien construites." }
          ]
        },
        A: {
          texte: "Un plan adapté pour <strong>galber le muscle</strong> tout en contrôlant le gras. Sans les bons apports, tes fessiers n'ont pas de quoi se construire.",
          ajouts: [
            { si: { question: "alimentation", valeurs: ["sanspenser", "sansreperes"] }, texte: "Sans repères, tu manges sûrement trop peu de protéines pour construire du muscle là où tu le veux." }
          ]
        },
        S: {
          texte: "Photos et mensurations <strong>chaque semaine</strong> : ce qui fonctionne le premier mois ne fonctionne plus le troisième. Il faut ajuster.",
          ajouts: [
            { si: { question: "suivi", valeurs: ["jamais", "parfois"] }, texte: "Sans suivi régulier, tu ne verras pas le moment où ton corps s'adapte, et tu continueras le même programme pour rien." }
          ]
        }
      }
    }
  },

  /* =================================================================
     11. ÉCRAN PREUVE (carrousel)
     Pour ajouter une transformation : copie un bloc { … },
     dépose l'image dans le dossier assets/ et change "src".
     ================================================================= */
  preuve: {
    titre: "Elle était au même point que toi",
    placeholder: "Photo avant / après",
    transformations: [
      {
        src: "assets/transformation-face.webp",
        alt: "Linda de face, avant et après 4 mois d'accompagnement",
        legende: "Linda · 4 mois · de face",
        texte: "<strong>-7 kg</strong> en 4 mois, avec la musculation en priorité, un cardio dosé et un plan alimentaire adapté."
      },
      {
        src: "assets/transformation-dos.webp",
        alt: "Linda de dos, avant et après 4 mois d'accompagnement : fessiers plus galbés",
        legende: "Linda · 4 mois · de dos",
        texte: "Moins de gras, <strong>des fessiers plus galbés</strong> : la recomposition quand la stratégie est la bonne."
      }
    ],
    titrePiliers: "La méthode Booty Flow",
    piliers: [
      { emoji: "🏋️‍♀️", titre: "Programme personnalisé",  texte: "Construit pour ton corps, ton niveau et ton objectif." },
      { emoji: "🥗",     titre: "Plan alimentaire adapté", texte: "Des repères précis, sans régime restrictif." },
      { emoji: "📈",     titre: "Suivi chaque semaine",    texte: "On ajuste en continu pour que tu continues de progresser." }
    ],
    bouton: "Je veux le même accompagnement"
  },

  /* =================================================================
     12. QUALIFICATION
     ================================================================= */
  qualification: {
    intro: {
      titre: "Ton diagnostic montre que tu as besoin d'une stratégie précise.",
      texte: "Voyons si un accompagnement est fait pour toi. 3 questions rapides.",
      bouton: "C'est parti"
    },
    questions: [
      {
        id: "qa",
        type: "choix",
        question: "Es-tu prête à t'investir sérieusement pour te transformer ?",
        options: [
          { valeur: "oui",       label: "Oui, totalement" },
          { valeur: "nesaispas", label: "Je ne sais pas encore" }
        ]
      },
      {
        id: "qb",
        type: "choix",
        question: "Quand veux-tu commencer ?",
        options: [
          { valeur: "maintenant", label: "Maintenant" },
          { valeur: "semaines",   label: "Dans les prochaines semaines" },
          { valeur: "plustard",   label: "Plus tard" }
        ]
      },
      {
        id: "qc",
        type: "choix",
        question: "Es-tu prête à investir dans un accompagnement personnalisé, avec un paiement possible en 3 ou 4 fois ?",
        options: [
          { valeur: "oui", label: "Oui" },
          { valeur: "non", label: "Pas pour le moment" }
        ]
      }
    ],
    // Pour accéder directement aux offres, TOUTES les conditions doivent être vraies.
    regle: {
      qa: ["oui"],
      qb: ["maintenant", "semaines"],
      qc: ["oui"]
    }
  },

  /* =================================================================
     13. ÉCRAN « PAS ENCORE PRÊTE »
     ================================================================= */
  pasPrete: {
    titre: "Pas de souci, avance à ton rythme 💜",
    texte: "Tu as déjà ton diagnostic : c'est une vraie feuille de route. Voici ce que tu peux appliquer seule dès cette semaine.",
    titreRecap: "Ton plan d'action",
    boutonInstagram: "Suivre mes conseils sur Instagram",
    boutonYoutube: "Voir mes vidéos sur YouTube",
    lienOffres: "En fait, je veux voir les formules"
  },

  /* =================================================================
     14. ÉCRAN OFFRES
     ================================================================= */
  offres: {
    titre: "Ta transformation, accompagnée par une experte",
    credibilite: "11 ans d'expérience · Compétitrice Wellness (catégorie où le bas du corps est un critère de sélection) · Juge de compétition",
    consigne: "Choisis ta formule",
    formules: [
      {
        id: "6mois",
        emoji: "💜",
        badge: "Recommandé",
        recommande: true,
        nom: "Coaching Transformation 6 mois",
        points: [
          "Entraînement personnalisé",
          "Plan alimentaire personnalisé",
          "Suivi hebdomadaire avec ajustements",
          "Le temps nécessaire pour une transformation visible et durable"
        ],
        prix: "1200 €",
        paiement: "payable en 3 ou 4 fois"
      },
      {
        id: "3mois",
        emoji: "",
        badge: "",
        recommande: false,
        nom: "Coaching Transformation 3 mois",
        points: [
          "Même méthode : entraînement personnalisé, plan alimentaire, suivi hebdomadaire",
          "Idéal pour poser les bases et lancer ta transformation"
        ],
        prix: "600 €",
        paiement: "payable en 3 ou 4 fois"
      }
    ],
    validation: "Je valide cette formule et je souhaite réserver mon appel pour démarrer",
    bouton: "Réserver mon appel",
    aideDesactive: "Choisis une formule et coche la case pour réserver ton appel.",
    mention: "Places limitées chaque mois pour garantir un suivi de qualité à chaque cliente."
  },

  /* =================================================================
     15. ÉCRAN FINAL
     ================================================================= */
  confirmation: {
    titre: "Hâte d'échanger avec toi 💜",
    texte: "Ton agenda s'est ouvert dans un nouvel onglet. Choisis le créneau qui te convient : on fera le point sur ton diagnostic et sur la meilleure stratégie pour toi.",
    rappel: "Formule choisie : {formule}",
    lienSecours: "L'agenda ne s'est pas ouvert ? Clique ici",
    boutonInstagram: "En attendant, rejoins-moi sur Instagram"
  },

  /* =================================================================
     16. PIED DE PAGE
     ================================================================= */
  pied: "© Booty Flow · Les conseils de ce test sont indicatifs et ne remplacent pas un avis médical."
};
