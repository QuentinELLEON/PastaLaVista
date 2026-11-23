import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaymentMethod } from '@pastalavista/shared';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { cartTotals, describeLine } from '../../../domain/cart/cart';
import { pickUpsell } from '../../../domain/cart/upsell';
import { formatNumber, formatPrice, formatSurcharge } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useCartActions } from '../../hooks/useCartActions';
import { BowlIllustration } from '../../shared/BowlIllustration';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { NutritionBadge } from '../../shared/NutritionBadge';
import { QtyStepper } from '../../shared/QtyStepper';
import { KioskLayout } from '../KioskLayout';
import { CartDock } from '../KioskParts';
import { useCheckout } from '../kioskHooks';

const METHODS: Array<{
  id: PaymentMethod;
  labelKey: 'pay.card' | 'pay.mobile' | 'pay.cash';
  icon: 'card' | 'phone' | 'cash';
}> = [
  { id: 'card', labelKey: 'pay.card', icon: 'card' },
  { id: 'mobile', labelKey: 'pay.mobile', icon: 'phone' },
  { id: 'cash', labelKey: 'pay.cash', icon: 'cash' },
];

/**
 * Récapitulatif et paiement. Une seule structure, plusieurs contenus :
 * standard (choix libre), habitué (carte enregistrée, une suggestion), guidé (où payer, kcal, besoin).
 */
export function PayScreen() {
  useStepBoundary('pay');
  const { state, dispatch, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const { addProduct } = useCartActions();
  const checkout = useCheckout();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [useOtherMethod, setUseOtherMethod] = useState(false);

  const totals = cartTotals(state.cart, catalog);
  const savedCard = state.customer?.savedCard ?? null;
  const savedMode =
    config.dialogue.defaultPayment === 'saved-card' && savedCard !== null && !useOtherMethod;
  const upsell = pickUpsell(config.content.upsell, catalog, state.cart);
  const retrieved = config.content.showRetrievedBanner && state.retrievedFromPhone && state.draft;

  const dock = (
    <CartDock
      variant="checkout"
      title={t('pay.totalDue')}
      totalLabel={t('pay.totalDue')}
      totalValue={formatPrice(totals.totalCents, state.language)}
    >
      <Button signal="back" onClick={() => navigate('/kiosk/menu')}>
        {t('common.back')}
      </Button>
      <Button
        variant="primary"
        style={{ width: 340 }}
        disabled={state.cart.length === 0 || checkout.busy}
        onClick={() => void checkout.pay(savedMode ? 'card' : method, savedMode)}
      >
        {checkout.busy ? t('pay.processing') : t('pay.confirm')}
      </Button>
    </CartDock>
  );

  return (
    <KioskLayout step="pay" dock={dock} terminalActive variant="wide">
      {retrieved && state.draft ? (
        <section
          className="banner-success"
          aria-label={t('pay.retrievedBanner', { code: state.draft.code })}
        >
          <BowlIllustration art="generic" size={92} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 40, lineHeight: 1.08, color: 'var(--green)' }}>
              {t('pay.retrievedBanner', { code: state.draft.code })}
            </h1>
            <p style={{ fontSize: 26 }}>{t('pay.retrievedSub')}</p>
          </div>
        </section>
      ) : (
        <h1 className="k-title">{t('pay.title')}</h1>
      )}

      {config.dialogue.journey === 'guided' ? (
        <div className="k-grid" role="group" aria-label={t('mode.question')}>
          {(['dine-in', 'takeaway'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className="k-choice"
              style={{ height: 110, flexDirection: 'row', fontSize: 34 }}
              aria-pressed={state.mode === mode}
              onClick={() => dispatch({ type: 'setMode', mode })}
            >
              <Icon name={mode === 'dine-in' ? 'plate' : 'bag'} size={52} />
              {mode === 'dine-in' ? t('mode.dineIn') : t('mode.takeaway')}
            </button>
          ))}
        </div>
      ) : null}

      <div className="k-stack" role="list">
        {state.cart.map((line) => {
          const label = describeLine(line, catalog);
          const lineTotals = cartTotals([line], catalog);
          return (
            <section
              key={line.id}
              role="listitem"
              className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '16px 24px' }}
            >
              <BowlIllustration productId={line.productId} size={84} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800 }}>{label.title}</h2>
                {label.details ? (
                  <p style={{ fontSize: 22, color: 'var(--muted)' }}>{label.details}</p>
                ) : null}
                <b style={{ fontSize: 26 }}>{formatPrice(lineTotals.totalCents, state.language)}</b>
                {config.content.showNutrition ? (
                  <NutritionBadge kcal={lineTotals.kcal} proteinG={lineTotals.proteinG} />
                ) : null}
              </div>
              <QtyStepper
                value={line.quantity}
                onChange={(next) =>
                  dispatch({ type: 'setLineQuantity', lineId: line.id, quantity: next })
                }
                decreaseLabel={t('cart.remove')}
                increaseLabel={t('cart.add')}
              />
            </section>
          );
        })}
      </div>

      {config.content.showNutrition ? (
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--green)',
            background: 'var(--green-soft)',
            border: '3px solid var(--green)',
            borderRadius: 22,
            padding: '14px 24px',
          }}
        >
          {t('nutrition.totalOrder')} :{' '}
          {t('nutrition.line', {
            kcal: formatNumber(totals.kcal, state.language),
            protein: formatNumber(totals.proteinG, state.language),
          })}
        </p>
      ) : null}

      {upsell ? (
        <section
          aria-label={upsell.kind === 'drink' ? t('pay.drinkTitle') : t('pay.needTitle')}
          className="k-stack"
        >
          <h2 className="k-title" style={{ fontSize: 30 }}>
            {upsell.kind === 'drink' ? t('pay.drinkTitle') : t('pay.needTitle')}
          </h2>
          <div
            className="k-grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(upsell.products.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {upsell.products.map((product) => (
              <button
                key={product.id}
                type="button"
                className="k-mini"
                onClick={() =>
                  upsell.kind === 'drink'
                    ? addProduct(product)
                    : dispatch({
                        type: 'addOption',
                        lineId: upsell.targetLineId ?? '',
                        productId: product.id,
                      })
                }
              >
                {product.name}
                <small>
                  {formatSurcharge(product.priceCents, state.language)}
                  {upsell.kind === 'protein'
                    ? ` · ${t('nutrition.line', { kcal: product.kcal, protein: product.proteinG })}`
                    : ''}
                </small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {savedMode && savedCard ? (
        <section className="k-stack" aria-label={t('pay.method')}>
          <button
            type="button"
            className="card k-pay"
            style={{
              height: 140,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              padding: '0 24px',
              gap: 22,
            }}
            aria-pressed="true"
          >
            <Icon name="card" size={64} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: 32 }}>
                {t('pay.savedCard', { last4: savedCard.last4 })}
              </span>
              <span style={{ fontSize: 24, color: 'var(--muted)', fontWeight: 700 }}>
                {t('pay.savedCardHint')}
              </span>
            </span>
            <Icon name="check" size={52} strokeWidth={5} />
          </button>
          <Button onClick={() => setUseOtherMethod(true)}>{t('pay.otherMethod')}</Button>
        </section>
      ) : (
        <section className="k-stack" aria-label={t('pay.method')}>
          <h2 className="k-title" style={{ fontSize: 30 }}>
            {t('pay.method')}
          </h2>
          <div
            className="k-grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}
          >
            {METHODS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="k-pay"
                aria-pressed={method === option.id}
                onClick={() => setMethod(option.id)}
              >
                <Icon name={option.icon} size={64} />
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </section>
      )}

      {config.content.showWherePayGuide ? (
        <section className="card k-where" aria-label={t('pay.whereTitle')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ color: 'var(--green)' }}>
              <Icon name="arrowDown" size={76} strokeWidth={3.5} />
            </span>
            <h2 style={{ flex: 1, fontSize: 32, lineHeight: 1.12, fontWeight: 800 }}>
              {t('pay.whereTitle')}
            </h2>
          </div>
          {(['pay.where1', 'pay.where2', 'pay.where3'] as const).map((key, index) => (
            <div key={key} className="k-where__step">
              <i>{index + 1}</i>
              {t(key)}
            </div>
          ))}
        </section>
      ) : null}

      {checkout.error ? (
        <p role="alert" style={{ color: 'var(--red)', fontSize: 26, fontWeight: 800 }}>
          {checkout.error}
        </p>
      ) : null}

      {config.dialogue.codeEntryFallback ? (
        <Button onClick={() => navigate('/kiosk/retrieve')} style={{ height: 72, fontSize: 24 }}>
          {t('pay.otherOrder')}
        </Button>
      ) : null}
    </KioskLayout>
  );
}
