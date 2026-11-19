// Tests du traitement des webhooks Systeme.io, sans réseau ni base réelle.
// Lancer : node --test supabase/tests/webhook-systemeio.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traiter, lireEvenement, lireEmail, lireOffres, lirePrenom, plusUnMois, type Base, type Profil } from '../functions/webhook-systemeio/traitement.ts';
import { venteApp, annulationApp, venteAutreOffre } from './exemples-systemeio.ts';

const OFFRE = '123456';
const MAINTENANT = new Date('2026-11-18T10:00:00Z');

function fausseBase(profils: Profil[] = []) {
  const invitations: string[] = [];
  const base: Base = {
    async trouverProfil(email) { return profils.find((p) => p.email === email) ?? null; },
    async inviter(email, prenom) {
      invitations.push(email);
      const p: Profil = { id: `u${profils.length + 1}`, email, prenom, role: 'eleve', formule: 'personnalise', statut_abonnement: 'actif', compte_valide: false };
      profils.push(p);
      return p.id;
    },
    async majProfil(id, patch) { Object.assign(profils.find((p) => p.id === id)!, patch); }
  };
  return { base, profils, invitations };
}
const options = { offresApp: [OFFRE], maintenant: MAINTENANT };

test('lecture des données Systeme.io', () => {
  assert.equal(lireEvenement({ 'x-webhook-event': 'SALE_NEW' }, {}), 'vente');
  assert.equal(lireEvenement({}, { type: 'sale.canceled' }), 'annulation');
  assert.equal(lireEvenement({}, { event: 'New sale' }), 'vente');
  assert.equal(lireEvenement({}, { type: 'CONTACT_CREATED' }), 'inconnu');
  assert.equal(lireEmail(venteApp.corps), 'camille.test@exemple.fr');
  assert.equal(lirePrenom(venteApp.corps), 'Camille');
  assert.ok(lireOffres(venteApp.corps).includes(OFFRE));
  assert.equal(plusUnMois(new Date('2027-01-31T10:00:00Z')).toISOString().slice(0, 10), '2027-02-28');
  assert.equal(plusUnMois(new Date('2026-11-18T10:00:00Z')).toISOString().slice(0, 10), '2026-12-18');
});

test('New sale : nouveau compte App + e-mail de bienvenue', async () => {
  const { base, profils, invitations } = fausseBase();
  const r = await traiter('vente', venteApp.corps, base, options);
  assert.equal(r.statut, 'traite');
  assert.deepEqual(invitations, ['camille.test@exemple.fr']);
  const p = profils[0];
  assert.equal(p.formule, 'app');
  assert.equal(p.statut_abonnement, 'actif');
  assert.equal(p.compte_valide, true);
  assert.equal(p.fin_acces!.slice(0, 10), '2026-12-18');
});

test('New sale reçue deux fois : aucun doublon, même date de fin', async () => {
  const { base, profils, invitations } = fausseBase();
  await traiter('vente', venteApp.corps, base, options);
  const fin = profils[0].fin_acces;
  await traiter('vente', venteApp.corps, base, options);
  assert.equal(invitations.length, 1);
  assert.equal(profils.length, 1);
  assert.equal(profils[0].fin_acces, fin);
});

test('New sale le mois suivant : renouvellement +1 mois', async () => {
  const { base, profils } = fausseBase();
  await traiter('vente', venteApp.corps, base, options);
  const corps = structuredClone(venteApp.corps);
  corps.data.order.created_at = '2026-12-18T09:00:00Z';
  await traiter('vente', corps, base, { ...options, maintenant: new Date('2026-12-18T09:05:00Z') });
  assert.equal(profils[0].fin_acces!.slice(0, 10), '2027-01-18');
  assert.equal(profils[0].statut_abonnement, 'actif');
});

test('New sale : abonnée expirée réactivée', async () => {
  const { base, profils, invitations } = fausseBase([{ id: 'a', email: 'camille.test@exemple.fr', role: 'eleve', formule: 'app', statut_abonnement: 'expire', compte_valide: true, fin_acces: '2026-09-01T00:00:00Z' }]);
  const r = await traiter('vente', venteApp.corps, base, options);
  assert.equal(r.statut, 'traite');
  assert.equal(invitations.length, 0);
  assert.equal(profils[0].statut_abonnement, 'actif');
  assert.equal(profils[0].fin_acces!.slice(0, 10), '2026-12-18');
});

test('New sale : une élève Personnalisé ou Autonomie n\'est JAMAIS rétrogradée', async () => {
  for (const formule of ['personnalise', 'autonomie'] as const) {
    const { base, profils } = fausseBase([{ id: 's', email: 'camille.test@exemple.fr', role: 'eleve', formule, statut_abonnement: 'actif', compte_valide: true }]);
    const r = await traiter('vente', venteApp.corps, base, options);
    assert.equal(r.statut, 'traite');
    assert.equal(profils[0].formule, formule);
    assert.equal(profils[0].statut_abonnement, 'actif');
  }
});

test('New sale : compte en attente de validation → ouvert en App', async () => {
  const { base, profils } = fausseBase([{ id: 'z', email: 'camille.test@exemple.fr', role: 'eleve', formule: 'personnalise', statut_abonnement: 'actif', compte_valide: false }]);
  await traiter('vente', venteApp.corps, base, options);
  assert.equal(profils[0].formule, 'app');
  assert.equal(profils[0].compte_valide, true);
});

test('New sale d\'une autre offre : ignorée', async () => {
  const { base, profils, invitations } = fausseBase();
  const r = await traiter('vente', venteAutreOffre.corps, base, options);
  assert.equal(r.statut, 'ignore');
  assert.equal(invitations.length, 0);
  assert.equal(profils.length, 0);
});

test('Sale canceled : résiliée, accès ouvert jusqu\'à la fin payée', async () => {
  const { base, profils } = fausseBase();
  await traiter('vente', venteApp.corps, base, options);
  const r = await traiter('annulation', annulationApp.corps, base, { ...options, maintenant: new Date('2026-11-25T10:00:00Z') });
  assert.equal(r.statut, 'traite');
  assert.equal(profils[0].statut_abonnement, 'resilie');
  assert.equal(profils[0].fin_acces!.slice(0, 10), '2026-12-18');
  // Reçue une deuxième fois : rien ne change
  await traiter('annulation', annulationApp.corps, base, { ...options, maintenant: new Date('2026-11-25T10:00:00Z') });
  assert.equal(profils[0].statut_abonnement, 'resilie');
});

test('Sale canceled après la fin de la période : expiré', async () => {
  const { base, profils } = fausseBase([{ id: 'a', email: 'camille.test@exemple.fr', role: 'eleve', formule: 'app', statut_abonnement: 'actif', compte_valide: true, fin_acces: '2026-11-10T00:00:00Z' }]);
  await traiter('annulation', annulationApp.corps, base, options);
  assert.equal(profils[0].statut_abonnement, 'expire');
});

test('Sale canceled d\'une élève coaching : rien ne change', async () => {
  const { base, profils } = fausseBase([{ id: 's', email: 'camille.test@exemple.fr', role: 'eleve', formule: 'personnalise', statut_abonnement: 'actif', compte_valide: true }]);
  const r = await traiter('annulation', annulationApp.corps, base, options);
  assert.equal(r.statut, 'ignore');
  assert.equal(profils[0].statut_abonnement, 'actif');
});

test('Webhook sans e-mail : erreur notée', async () => {
  const { base } = fausseBase();
  const r = await traiter('vente', { offer_price_plan: { id: OFFRE } }, base, options);
  assert.equal(r.statut, 'erreur');
});
