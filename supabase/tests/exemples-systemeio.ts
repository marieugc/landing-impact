// Exemples de webhooks Systeme.io utilisés par les tests et par le script de simulation.
// ⚠️ Structure supposée : la vraie structure est visible dans la table webhooks_systemeio après le premier achat réel.
// Remplace 123456 par l'identifiant de ton offre (SYSTEMEIO_OFFER_ID) pour simuler avec ton vrai réglage.

export const venteApp = {
  evenement: 'SALE_NEW',
  corps: {
    type: 'SALE_NEW',
    data: {
      customer: {
        id: 11112222,
        email: 'camille.test@exemple.fr',
        fields: { first_name: 'Camille', surname: 'Test' }
      },
      offer_price_plan: { id: 123456, name: 'Booty Flow App', type: 'recurring', amount: 4900, currency: 'eur' },
      order: { id: 98765432, created_at: '2026-11-18T09:58:00Z' }
    }
  }
};

export const annulationApp = {
  evenement: 'SALE_CANCELED',
  corps: {
    type: 'SALE_CANCELED',
    data: {
      customer: { id: 11112222, email: 'camille.test@exemple.fr', fields: { first_name: 'Camille' } },
      offer_price_plan: { id: 123456, name: 'Booty Flow App' },
      order: { id: 98765432 }
    }
  }
};

export const venteAutreOffre = {
  evenement: 'SALE_NEW',
  corps: {
    type: 'SALE_NEW',
    data: {
      customer: { id: 33334444, email: 'autre.cliente@exemple.fr', fields: { first_name: 'Lou' } },
      offer_price_plan: { id: 999999, name: 'Ebook recettes' },
      order: { id: 11110000, created_at: '2026-11-18T09:58:00Z' }
    }
  }
};
