// Simule les webhooks Systeme.io « New sale » puis « Sale canceled » depuis un ordinateur (Node 18 ou plus).
//
//   WEBHOOK_URL="https://ubenkqedyjrdeyetzzet.supabase.co/functions/v1/webhook-systemeio?secret=TON-SECRET" \
//   OFFRE=123456 EMAIL="ton.adresse+test@gmail.com" node supabase/tests/simuler-webhooks.mjs
//
// Pendant l'essai, mets le secret SYSTEMEIO_FILTRE_IP à « non » (l'essai ne part pas des serveurs de Systeme.io).
const { WEBHOOK_URL, OFFRE = '123456', EMAIL = 'camille.test@exemple.fr' } = process.env;
if (!WEBHOOK_URL) {
  console.error('Indique WEBHOOK_URL (adresse complète du webhook, avec ?secret=…)');
  process.exit(1);
}

const client = { id: 11112222, email: EMAIL, fields: { first_name: 'Camille' } };
const offre = { id: Number(OFFRE) || OFFRE, name: 'Booty Flow App' };
const essais = [
  ['New sale', 'SALE_NEW', { type: 'SALE_NEW', data: { customer: client, offer_price_plan: offre, order: { id: 98765432, created_at: new Date().toISOString() } } }],
  ['New sale (même webhook une 2e fois : doublon attendu)', 'SALE_NEW', null],
  ['Sale canceled', 'SALE_CANCELED', { type: 'SALE_CANCELED', data: { customer: client, offer_price_plan: offre, order: { id: 98765432 } } }]
];

let precedent = null;
for (const [nom, evenement, corps] of essais) {
  const contenu = JSON.stringify(corps ?? precedent);
  precedent = corps ?? precedent;
  const r = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': evenement }, body: contenu });
  console.log(`\n▶ ${nom} → ${r.status}`);
  console.log(await r.text());
}
