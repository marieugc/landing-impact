import type { Food, FoodCategory, FoodRole, FoodTag } from './types';

/**
 * Base d'aliments par défaut, valeurs pour 100 g pesés crus / secs.
 * Valeurs reprises de la table CIQUAL (ANSES) et arrondies : À VÉRIFIER par la coach
 * (https://ciqual.anses.fr) et à adapter aux marques utilisées (écran « Aliments »).
 * Les glucides sont les glucides disponibles (hors fibres).
 */
function food(
  id: string,
  name: string,
  category: FoodCategory,
  p: number,
  c: number,
  f: number,
  tags: FoodTag[],
  roles: FoodRole[],
  extra: Partial<Food> = {},
): Food {
  return { id, name, category, p, c, f, tags, roles, ...extra };
}

const VIANDE: FoodTag[] = ['animal', 'viande'];
const POISSON: FoodTag[] = ['animal', 'poisson'];
const LAIT: FoodTag[] = ['animal', 'laitier', 'lactose'];
const NOIX: FoodTag[] = ['fruit_a_coque'];
const AI: FoodTag = 'anti_inflammatoire';

export const DEFAULT_FOODS: Food[] = [
  // ---- Viandes
  food('poulet', 'Blanc de poulet', 'viande', 23.0, 0, 1.5, VIANDE, ['prot_repas']),
  food('dinde', 'Escalope de dinde', 'viande', 23.5, 0, 1.2, VIANDE, ['prot_repas']),
  food('boeuf5', 'Bœuf haché 5 % MG', 'viande', 21.0, 0, 5.0, VIANDE, ['prot_repas']),
  food('rumsteck', 'Rumsteck de bœuf', 'viande', 22.5, 0, 4.0, VIANDE, ['prot_repas']),
  food('veau', 'Escalope de veau', 'viande', 22.0, 0, 2.5, VIANDE, ['prot_repas']),
  food('porc_filet', 'Filet mignon de porc', 'viande', 21.5, 0, 3.0, [...VIANDE, 'porc'], ['prot_repas']),
  food('jambon', 'Jambon blanc découenné dégraissé', 'viande', 20.5, 1.0, 3.0, [...VIANDE, 'porc', 'transforme'], ['prot_pdj_sale']),
  food('jambon_dinde', 'Blanc de dinde (tranches)', 'viande', 19.0, 1.5, 2.5, [...VIANDE, 'transforme'], ['prot_pdj_sale']),
  food('canard', 'Magret de canard sans peau', 'viande', 21.0, 0, 6.0, VIANDE, ['prot_repas']),
  // ---- Poissons / fruits de mer
  food('cabillaud', 'Cabillaud', 'poisson', 18.0, 0, 0.6, POISSON, ['prot_repas']),
  food('colin', 'Colin / lieu noir', 'poisson', 18.5, 0, 0.9, POISSON, ['prot_repas']),
  food('saumon', 'Saumon', 'poisson', 20.4, 0, 13.4, [...POISSON, AI], ['prot_repas']),
  food('truite', 'Truite', 'poisson', 20.0, 0, 4.0, [...POISSON, AI], ['prot_repas']),
  food('maquereau', 'Maquereau', 'poisson', 18.5, 0, 12.0, [...POISSON, AI], ['prot_repas']),
  food('sardine', "Sardines à l'huile égouttées", 'poisson', 25.0, 0, 11.0, [...POISSON, AI], ['prot_repas']),
  food('thon', 'Thon au naturel égoutté', 'poisson', 25.0, 0, 1.5, POISSON, ['prot_repas']),
  food('crevettes', 'Crevettes crues décortiquées', 'poisson', 18.0, 0, 1.0, ['animal', 'fruits_de_mer'], ['prot_repas']),
  food('saumon_fume', 'Saumon fumé', 'poisson', 22.0, 0, 9.0, [...POISSON, 'transforme'], ['prot_pdj_sale']),
  // ---- Œufs
  food('oeuf', 'Œuf entier', 'oeuf', 12.5, 0.5, 9.5, ['animal', 'oeuf'], ['prot_pdj_sale'], {
    unitWeight: 50,
    unitLabel: 'œuf',
    min: 1,
    max: 5,
  }),
  food('blanc_oeuf', "Blanc d'œuf", 'oeuf', 10.5, 0.7, 0.2, ['animal', 'oeuf'], ['blanc_oeuf'], { min: 0, max: 300 }),
  // ---- Laitages
  food('skyr', 'Skyr nature 0 %', 'laitage', 10.5, 4.0, 0.2, LAIT, ['prot_pdj', 'prot_collation']),
  food('fromage_blanc', 'Fromage blanc 0 %', 'laitage', 7.5, 4.0, 0.2, LAIT, ['prot_pdj', 'prot_collation']),
  food('yaourt_grec', 'Yaourt à la grecque 0 %', 'laitage', 10.0, 4.0, 0.4, LAIT, ['prot_pdj', 'prot_collation']),
  food('cottage', 'Cottage cheese', 'laitage', 11.0, 3.4, 4.3, LAIT, ['prot_collation']),
  food('skyr_sl', 'Skyr sans lactose 0 %', 'laitage', 10.0, 4.0, 0.2, ['animal', 'laitier'], ['prot_pdj', 'prot_collation']),
  food('lait_ecreme', 'Lait demi-écrémé', 'laitage', 3.3, 4.8, 1.6, LAIT, []),
  food('parmesan', 'Parmesan', 'laitage', 33.0, 0, 28.0, LAIT, []),
  food('mozza_light', 'Mozzarella light', 'laitage', 20.0, 1.5, 9.0, LAIT, []),
  food('creme_15', 'Crème fraîche légère 15 %', 'laitage', 3.0, 4.0, 15.0, LAIT, []),
  // ---- Protéines végétales
  food('tofu', 'Tofu ferme', 'proteine_vegetale', 13.0, 1.5, 7.5, ['soja'], ['prot_repas', 'prot_pdj_sale']),
  food('tempeh', 'Tempeh', 'proteine_vegetale', 19.0, 8.0, 11.0, ['soja'], ['prot_repas']),
  food('seitan', 'Seitan', 'proteine_vegetale', 25.0, 4.0, 2.0, ['gluten', 'transforme'], ['prot_repas']),
  food('yaourt_soja', 'Yaourt au soja nature', 'proteine_vegetale', 4.0, 2.5, 2.3, ['soja'], ['prot_collation']),
  food('boisson_soja', 'Boisson au soja nature', 'proteine_vegetale', 3.3, 1.0, 1.9, ['soja'], []),
  // ---- Compléments
  food('whey', 'Whey isolate', 'complement', 88.0, 2.0, 1.0, ['animal', 'laitier'], ['post_proteine', 'prot_pdj', 'prot_collation'], {
    min: 10,
    max: 60,
  }),
  food('prot_vegetale', 'Protéine végétale (pois / riz)', 'complement', 75.0, 6.0, 6.0, [], ['post_proteine', 'prot_pdj', 'prot_collation'], {
    min: 10,
    max: 60,
  }),
  food('prot_pois', 'Isolat de protéine de pois', 'complement', 80.0, 3.0, 6.0, [], ['post_proteine', 'prot_collation'], {
    min: 10,
    max: 60,
  }),
  // ---- Légumineuses (pesées sèches)
  food('lentilles', 'Lentilles corail sèches', 'legumineuse', 24.0, 48.0, 1.5, [], ['fec_repas']),
  food('lentilles_vertes', 'Lentilles vertes sèches', 'legumineuse', 24.5, 46.0, 1.5, [], ['fec_repas']),
  food('pois_chiches', 'Pois chiches secs', 'legumineuse', 20.5, 44.0, 5.5, [], ['fec_repas']),
  food('haricots_rouges', 'Haricots rouges secs', 'legumineuse', 22.0, 43.0, 1.2, [], ['fec_repas']),
  // ---- Féculents (pesés crus / secs)
  food('riz_basmati', 'Riz basmati (cru)', 'feculent', 8.0, 78.0, 0.8, [], ['fec_repas']),
  food('riz_complet', 'Riz complet (cru)', 'feculent', 8.0, 73.0, 2.5, [], ['fec_repas']),
  food('pates', 'Pâtes blanches (sèches)', 'feculent', 12.5, 71.0, 1.5, ['gluten'], ['fec_repas']),
  food('pates_completes', 'Pâtes complètes (sèches)', 'feculent', 13.0, 64.0, 2.5, ['gluten'], ['fec_repas']),
  food('pates_sg', 'Pâtes sans gluten riz / maïs (sèches)', 'feculent', 7.5, 77.0, 1.5, [], ['fec_repas']),
  food('quinoa', 'Quinoa (cru)', 'feculent', 13.5, 60.0, 6.0, [], ['fec_repas']),
  food('semoule', 'Semoule de blé (sèche)', 'feculent', 12.0, 72.0, 1.5, ['gluten'], ['fec_repas']),
  food('boulgour', 'Boulgour (sec)', 'feculent', 12.0, 69.0, 1.5, ['gluten'], ['fec_repas']),
  food('sarrasin', 'Sarrasin décortiqué (cru)', 'feculent', 12.0, 70.0, 3.0, [], ['fec_repas']),
  food('polenta', 'Polenta (sèche)', 'feculent', 8.0, 76.0, 1.5, [], ['fec_repas']),
  food('pdt', 'Pomme de terre (crue)', 'feculent', 2.0, 16.5, 0.1, [], ['fec_repas'], { min: 80, max: 700 }),
  food('patate_douce', 'Patate douce (crue)', 'feculent', 1.6, 17.0, 0.1, [AI], ['fec_repas'], { min: 80, max: 700 }),
  food('flocons', "Flocons d'avoine", 'feculent', 13.5, 58.7, 7.0, ['gluten'], ['gluc_pdj', 'gluc_collation']),
  food('flocons_sg', "Flocons d'avoine sans gluten", 'feculent', 13.5, 58.7, 7.0, [], ['gluc_pdj', 'gluc_collation']),
  food('creme_riz', 'Crème de riz (sèche)', 'feculent', 7.0, 80.0, 1.0, [], ['pre_creme_riz', 'gluc_pdj'], { min: 10, max: 120 }),
  food('pain_complet', 'Pain complet', 'feculent', 9.0, 42.0, 2.5, ['gluten'], ['gluc_pdj_sale']),
  food('pain_seigle', 'Pain de seigle', 'feculent', 7.5, 44.0, 1.5, ['gluten'], ['gluc_pdj_sale']),
  food('pain_mie', 'Pain de mie complet', 'feculent', 9.0, 44.0, 4.5, ['gluten', 'transforme'], ['gluc_pdj_sale']),
  food('pain_sg', 'Pain sans gluten', 'feculent', 4.0, 46.0, 5.0, ['transforme'], ['gluc_pdj_sale']),
  food('galettes_riz', 'Galettes de riz soufflé', 'feculent', 8.0, 80.0, 2.8, [], ['gluc_collation', 'gluc_pdj_sale'], { min: 10, max: 60 }),
  food('muesli', 'Muesli sans sucre ajouté', 'feculent', 10.0, 60.0, 7.0, ['gluten', 'fruit_a_coque'], []),
  // ---- Légumes
  food('brocoli', 'Brocoli', 'legume', 2.8, 4.0, 0.4, [AI], ['legume']),
  food('haricots_verts', 'Haricots verts', 'legume', 2.0, 3.5, 0.2, [], ['legume']),
  food('courgette', 'Courgette', 'legume', 1.3, 1.8, 0.3, [], ['legume']),
  food('epinards', 'Épinards', 'legume', 2.9, 1.5, 0.4, [AI], ['legume']),
  food('tomate', 'Tomate', 'legume', 0.9, 2.9, 0.2, [AI], ['legume']),
  food('carotte', 'Carotte', 'legume', 0.8, 7.5, 0.2, [], ['legume']),
  food('poivron', 'Poivron rouge', 'legume', 1.0, 5.0, 0.3, [AI], ['legume']),
  food('champignons', 'Champignons de Paris', 'legume', 3.0, 0.5, 0.3, [], ['legume']),
  food('chou_fleur', 'Chou-fleur', 'legume', 2.0, 3.0, 0.3, [AI], ['legume']),
  food('salade', 'Salade verte', 'legume', 1.2, 1.5, 0.2, [], ['legume']),
  food('concombre', 'Concombre', 'legume', 0.7, 2.5, 0.1, [], ['legume']),
  food('aubergine', 'Aubergine', 'legume', 1.0, 3.0, 0.2, [], ['legume']),
  food('poireau', 'Poireau', 'legume', 1.5, 4.5, 0.3, [], ['legume']),
  food('butternut', 'Courge butternut', 'legume', 1.0, 8.0, 0.1, [], ['legume']),
  food('asperges', 'Asperges vertes', 'legume', 2.2, 2.0, 0.2, [], ['legume']),
  food('fenouil', 'Fenouil', 'legume', 1.2, 3.0, 0.2, [], ['legume']),
  food('petits_pois', 'Petits pois', 'legume', 5.5, 9.5, 0.4, [], []),
  // ---- Fruits
  food('banane', 'Banane', 'fruit', 1.1, 20.0, 0.3, [], ['pre_banane', 'fruit_pdj'], {
    unitWeight: 120,
    unitLabel: 'banane',
    min: 1,
    max: 2,
  }),
  food('pomme', 'Pomme', 'fruit', 0.3, 11.5, 0.2, [], ['fruit_pdj'], { unitWeight: 150, unitLabel: 'pomme', min: 1, max: 2 }),
  food('poire', 'Poire', 'fruit', 0.4, 11.0, 0.2, [], ['fruit_pdj'], { unitWeight: 150, unitLabel: 'poire', min: 1, max: 2 }),
  food('orange', 'Orange', 'fruit', 0.9, 9.0, 0.2, [], ['fruit_pdj'], { unitWeight: 150, unitLabel: 'orange', min: 1, max: 2 }),
  food('kiwi', 'Kiwi', 'fruit', 1.0, 10.0, 0.5, [], ['fruit_pdj'], { unitWeight: 75, unitLabel: 'kiwi', min: 1, max: 3 }),
  food('clementine', 'Clémentine', 'fruit', 0.8, 10.0, 0.2, [], ['fruit_pdj'], { unitWeight: 70, unitLabel: 'clémentine', min: 1, max: 3 }),
  food('fruits_rouges', 'Fruits rouges (mélange)', 'fruit', 1.0, 7.0, 0.3, [AI], ['fruit_pdj', 'gluc_collation', 'gluc_keto']),
  food('fraises', 'Fraises', 'fruit', 0.7, 6.0, 0.3, [AI], ['gluc_collation', 'gluc_keto']),
  food('myrtilles', 'Myrtilles', 'fruit', 0.8, 10.0, 0.3, [AI], ['fruit_pdj', 'gluc_collation', 'gluc_keto']),
  food('mangue', 'Mangue', 'fruit', 0.6, 13.5, 0.3, [], ['gluc_collation']),
  food('ananas', 'Ananas', 'fruit', 0.5, 11.0, 0.2, [], ['gluc_collation']),
  food('compote', 'Compote sans sucre ajouté', 'fruit', 0.3, 12.5, 0.2, [], ['post_compote', 'gluc_collation'], { min: 50, max: 250 }),
  food('dattes', 'Dattes séchées', 'fruit', 2.5, 65.0, 0.4, [], ['gluc_collation'], { min: 10, max: 60 }),
  // ---- Huiles et matières grasses
  food('huile_olive', "Huile d'olive", 'huile', 0, 0, 100, [AI], ['mg_repas', 'mg_pdj_sale']),
  food('huile_colza', 'Huile de colza', 'huile', 0, 0, 100, [AI], ['mg_repas']),
  food('huile_noix', 'Huile de noix', 'huile', 0, 0, 100, ['fruit_a_coque', AI], ['mg_repas']),
  food('beurre', 'Beurre doux', 'matiere_grasse', 0.7, 0.7, 82.0, LAIT, ['mg_pdj_sale'], { max: 20 }),
  food('avocat', 'Avocat', 'matiere_grasse', 1.6, 1.0, 20.0, [AI], ['mg_repas', 'mg_pdj_sale'], { max: 150 }),
  food('chocolat_noir', 'Chocolat noir 85 %', 'matiere_grasse', 10.0, 19.0, 46.0, [], ['mg_collation'], { max: 30 }),
  // ---- Oléagineux (pesés au gramme)
  food('amandes', 'Amandes', 'oleagineux', 21.0, 6.5, 52.0, [...NOIX, AI], ['mg_pdj', 'mg_collation']),
  food('noix', 'Noix', 'oleagineux', 15.0, 7.0, 65.0, [...NOIX, AI], ['mg_pdj', 'mg_collation']),
  food('cajou', 'Noix de cajou', 'oleagineux', 18.0, 27.0, 46.0, NOIX, ['mg_collation']),
  food('noisettes', 'Noisettes', 'oleagineux', 15.0, 7.0, 61.0, NOIX, ['mg_pdj', 'mg_collation']),
  food('beurre_cacahuete', 'Beurre de cacahuète 100 %', 'oleagineux', 25.0, 13.0, 50.0, ['arachide'], ['mg_pdj', 'mg_collation']),
  food('puree_amande', "Purée d'amande complète", 'oleagineux', 22.0, 7.0, 55.0, NOIX, ['mg_pdj', 'mg_collation']),
  food('chia', 'Graines de chia', 'oleagineux', 17.0, 8.0, 31.0, [AI], ['mg_pdj'], { max: 30 }),
  food('graines_courge', 'Graines de courge', 'oleagineux', 30.0, 5.0, 46.0, [], ['mg_collation']),
  food('lait_amande', "Boisson à l'amande sans sucre", 'divers', 0.5, 0.3, 1.2, NOIX, []),
  food('miel', 'Miel', 'divers', 0.4, 80.0, 0, ['animal'], []),
];

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  viande: 'Viande',
  poisson: 'Poisson / fruits de mer',
  oeuf: 'Œufs',
  laitage: 'Laitage',
  proteine_vegetale: 'Protéine végétale',
  complement: 'Complément (whey…)',
  feculent: 'Féculent / céréale',
  legumineuse: 'Légumineuse',
  legume: 'Légume',
  fruit: 'Fruit',
  huile: 'Huile',
  oleagineux: 'Oléagineux',
  matiere_grasse: 'Matière grasse',
  divers: 'Divers',
};

export const TAG_LABELS: Record<FoodTag, string> = {
  lactose: 'Contient du lactose',
  gluten: 'Gluten',
  animal: "Origine animale",
  viande: 'Viande',
  porc: 'Porc',
  poisson: 'Poisson',
  fruits_de_mer: 'Fruits de mer',
  oeuf: 'Œuf',
  fruit_a_coque: 'Fruit à coque',
  arachide: 'Arachide',
  soja: 'Soja',
  laitier: 'Produit laitier',
  transforme: 'Produit transformé',
  anti_inflammatoire: 'Anti-inflammatoire',
};

export const ROLE_LABELS: Record<FoodRole, string> = {
  prot_repas: 'Protéine midi / soir',
  prot_pdj: 'Protéine petit-déj sucré',
  prot_pdj_sale: 'Protéine petit-déj salé',
  blanc_oeuf: "Complément blanc d'œuf",
  prot_collation: 'Protéine collation',
  fec_repas: 'Féculent midi / soir',
  gluc_pdj: 'Glucide petit-déj sucré',
  gluc_pdj_sale: 'Glucide petit-déj salé (pain…)',
  gluc_collation: 'Glucide collation',
  gluc_keto: 'Glucide cétogène (fruits rouges)',
  legume: 'Légume',
  fruit_pdj: 'Fruit petit-déj',
  mg_repas: 'Matière grasse midi / soir',
  mg_pdj: 'Matière grasse petit-déj sucré',
  mg_pdj_sale: 'Matière grasse petit-déj salé',
  mg_collation: 'Matière grasse collation',
  pre_creme_riz: 'Pré-training : crème de riz',
  pre_banane: 'Pré-training : banane',
  post_compote: 'Post-training : compote',
  post_proteine: 'Post-training : whey / protéine',
};
