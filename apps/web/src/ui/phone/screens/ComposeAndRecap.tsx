import { useNavigate } from 'react-router-dom';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { cartItemCount, cartTotals, describeLine } from '../../../domain/cart/cart';
import { formatNumber, formatPrice } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useComposer } from '../../hooks/useComposer';
import { BowlIllustration } from '../../shared/BowlIllustration';
import { Button } from '../../shared/Button';
import { NutritionBadge } from '../../shared/NutritionBadge';
import { PlateStepChoices } from '../../shared/PlateStepChoices';
import { QtyStepper } from '../../shared/QtyStepper';
import { PhoneLayout } from '../PhoneLayout';
import { usePhoneDraft } from '../phoneHooks';

/** Composition pas à pas : une étape par écran, une colonne, bouton principal en bas. */
export function PhoneCompose() {
  const { state, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const composer = useComposer();
  useStepBoundary(`compose:${composer.step}`);
  const stepLabel = t('compose.stepOf', {
    current: composer.index + 1,
    total: composer.steps.length,
  });
  const disabled = composer.isLast ? !composer.canFinish : !composer.canProceed;

  function advance() {
    if (!composer.isLast) return composer.next();
    composer.finish();
    navigate('/m/recap');
  }

  return (
    <PhoneLayout
      footer={
        <>
          <Button
            signal="back"
            onClick={() => (composer.index === 0 ? navigate('/m') : composer.previous())}
          >
            {t('common.back')}
          </Button>
          <Button variant="primary" grow disabled={disabled} onClick={advance}>
            {composer.isLast ? t('compose.finish') : t('phone.next')}
          </Button>
        </>
      }
    >
      <div className="p-stepper" aria-hidden="true">
        {composer.steps.map((step, index) => (
          <span key={step} data-on={index <= composer.index} />
        ))}
      </div>
      <p className="p-sub">{stepLabel}</p>
      <h1 className="p-title">{t(`compose.title.${composer.step}`)}</h1>
      {composer.step === 'review' ? (
        <section className="p-card" aria-label={t('compose.title.review')}>
          {composer.summary.map((line) => (
            <p key={line.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{line.label}</span>
              <b>{formatPrice(line.priceCents, state.language)}</b>
            </p>
          ))}
        </section>
      ) : (
        <PlateStepChoices
          step={composer.step}
          plate={composer.plate}
          catalog={catalog}
          config={config}
          onPatch={composer.patch}
          forceRows
        />
      )}
      <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <NutritionBadge kcal={composer.totals.kcal} proteinG={composer.totals.proteinG} />
        <b style={{ fontSize: 20 }}>{formatPrice(composer.totals.totalCents, state.language)}</b>
      </p>
    </PhoneLayout>
  );
}

/** Récapitulatif court : pas de paiement ici, le client obtient un QR code à présenter à la borne. */
export function PhoneRecap() {
  useStepBoundary('recap');
  const { state, dispatch, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const draft = usePhoneDraft();
  const totals = cartTotals(state.cart, catalog);

  return (
    <PhoneLayout
      footer={
        <>
          <Button signal="back" onClick={() => navigate('/m')}>
            {t('common.back')}
          </Button>
          <Button
            variant="primary"
            grow
            disabled={state.cart.length === 0 || draft.busy}
            onClick={() => void draft.save()}
          >
            {draft.busy ? t('phone.saving') : t('phone.generateQr')}
          </Button>
        </>
      }
    >
      <h1 className="p-title">{t('phone.recapTitle')}</h1>
      <div className="p-seg" role="group" aria-label={t('mode.question')}>
        {(['dine-in', 'takeaway'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={state.mode === mode}
            onClick={() => dispatch({ type: 'setMode', mode })}
          >
            {mode === 'dine-in' ? t('mode.dineIn') : t('mode.takeaway')}
          </button>
        ))}
      </div>
      {state.cart.length === 0 ? <p className="p-sub">{t('phone.emptyCart')}</p> : null}
      {state.cart.map((line) => {
        const label = describeLine(line, catalog);
        const lineTotals = cartTotals([line], catalog);
        return (
          <section key={line.id} className="p-row" aria-label={label.title}>
            <BowlIllustration productId={line.productId} size={48} />
            <span className="p-row__text">
              <span className="p-row__name">{label.title}</span>
              {label.details ? <span className="p-row__desc">{label.details}</span> : null}
              {config.content.showNutrition ? (
                <NutritionBadge kcal={lineTotals.kcal} proteinG={lineTotals.proteinG} />
              ) : null}
              <b>{formatPrice(lineTotals.totalCents, state.language)}</b>
            </span>
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
      <p
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800 }}
      >
        <span>
          {t('cart.total')} · {cartItemCount(state.cart)}
        </span>
        <span>{formatPrice(totals.totalCents, state.language)}</span>
      </p>
      {config.content.showNutrition ? (
        <p className="p-sub">
          {t('nutrition.totalOrder')} : {formatNumber(totals.kcal, state.language)} kcal ·{' '}
          {formatNumber(totals.proteinG, state.language)} g
        </p>
      ) : null}
      <p className="p-sub">{t('phone.payAtKiosk')}</p>
      {draft.error ? (
        <p role="alert" style={{ color: 'var(--red)', fontWeight: 800 }}>
          {draft.error}
        </p>
      ) : null}
    </PhoneLayout>
  );
}
