import type { OrderLine } from '@pastalavista/shared';
import type { Customer, Kiosk, Order, SavedPaymentMethod } from '../../domain/entities';

// Clients FICTIFS. « Jérémy » est un habitué (5 commandes), « Camille » ne l'est pas (1 commande) :
// ce second profil permet de tester le seuil de reconnaissance d'un habitué.

export const JEREMY_ID = 'cust-jeremy';
export const CAMILLE_ID = 'cust-camille';

export const KIOSK_SEED: Kiosk[] = [
  { id: 'kiosk-01', label: 'Borne 1', active: true },
  { id: 'kiosk-02', label: 'Borne 2', active: true },
];

export const CUSTOMER_SEED: Customer[] = [
  {
    id: JEREMY_ID,
    displayName: 'Jérémy Martin',
    locale: 'fr',
    usualOrderId: 'order-seed-jeremy-5',
  },
  { id: CAMILLE_ID, displayName: 'Camille Durand', locale: 'fr', usualOrderId: null },
];

export const SAVED_CARD_SEED: SavedPaymentMethod[] = [
  { id: 'card-jeremy', customerId: JEREMY_ID, brand: 'Visa', last4: '4242' },
];

/** Penne bolognaise + parmesan : 8,50 + 1,00 + 0,50 = 10,00 €. */
function usualLines(orderId: string): OrderLine[] {
  return [
    {
      id: `${orderId}-line`,
      productId: 'pasta-penne',
      quantity: 1,
      extraXl: false,
      options: [
        { productId: 'sauce-bolognaise', quantity: 1 },
        { productId: 'extra-parmesan', quantity: 1 },
      ],
    },
  ];
}

function pastOrder(id: string, number: number, customerId: string, createdAt: string): Order {
  return {
    id,
    number,
    draftId: null,
    customerId,
    mode: 'dine-in',
    locale: 'fr',
    lines: usualLines(id),
    totalCents: 1000,
    kcal: 710,
    proteinG: 32,
    status: 'completed',
    createdAt,
  };
}

const WEDNESDAYS = ['2026-10-14', '2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11'];

export const PAST_ORDER_SEED: Order[] = [
  ...WEDNESDAYS.map((day, index) =>
    pastOrder(`order-seed-jeremy-${index + 1}`, index + 1, JEREMY_ID, `${day}T12:10:00.000Z`),
  ),
  pastOrder('order-seed-camille-1', WEDNESDAYS.length + 1, CAMILLE_ID, '2026-11-12T12:40:00.000Z'),
];
