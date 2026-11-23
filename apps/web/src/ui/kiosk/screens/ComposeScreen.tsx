import { useNavigate } from 'react-router-dom';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { formatNumber, formatPrice } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useComposer } from '../../hooks/useComposer';
import { Button } from '../../shared/Button';
import { NutritionBadge } from '../../shared/NutritionBadge';
import { PlateStepChoices } from '../../shared/PlateStepChoices';
import { KioskLayout } from '../KioskLayout';
import { CartDock, CategoryRail } from '../KioskParts';

/**
 * Composition de l'assiette sur la borne : tuiles en IHM standard, lignes larges avec kcal,
 * protéines et quantités en mode guidé. Même écran, même ossature, même état.
 */
export function ComposeScreen() {
  const { state, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const composer = useComposer();
  useStepBoundary(`compose:${composer.step}`);

  const entries = composer.steps.map((step, index) => ({
    id: step,
    label: t(`compose.step.${step}`),
    number: index + 1,
    done: index < composer.index,
  }));

  function advance() {
    if (!composer.isLast) {
      composer.next();
      return;
    }
    composer.finish();
    // Parcours guidé ou express : on enchaîne vers la vérification de la commande et le paiement
    navigate(config.dialogue.journey === 'free' ? '/kiosk/menu' : '/kiosk/pay');
  }

  function back() {
    if (composer.index === 0) navigate('/kiosk/menu');
    else composer.previous();
  }

  const lines = composer.summary.map((line) => ({
    id: line.id,
    label: line.label,
    priceLabel: formatPrice(line.priceCents, state.language),
  }));
  const stepProgress = t('compose.stepOf', {
    current: composer.index + 1,
    total: composer.steps.length,
  });
  const advanceDisabled = composer.isLast ? !composer.canFinish : !composer.canProceed;

  return (
    <KioskLayout
      step="choose"
      rail={
        <CategoryRail
          entries={entries}
          activeId={composer.step}
          ariaLabel={stepProgress}
          onSelect={(id) => composer.goTo(id as typeof composer.step)}
        />
      }
      dock={
        <CartDock
          variant="cart"
          title={t('cart.plate')}
          subtitle={
            config.content.showNutrition ? (
              <NutritionBadge kcal={composer.totals.kcal} proteinG={composer.totals.proteinG} />
            ) : (
              <span style={{ fontSize: 24, color: 'var(--muted)' }}>{stepProgress}</span>
            )
          }
          lines={lines}
          totalLabel={t('cart.plateTotal')}
          totalValue={formatPrice(composer.totals.totalCents, state.language)}
        >
          <Button signal="back" onClick={back}>
            {t('common.back')}
          </Button>
          <Button
            variant="primary"
            className="k-dock__cta"
            disabled={advanceDisabled}
            onClick={advance}
          >
            {composer.isLast ? t('compose.finish') : t('compose.next')}
          </Button>
        </CartDock>
      }
    >
      <div>
        <h1
          className="k-title"
          style={config.presentation.density === 'comfortable' ? { fontSize: 40 } : undefined}
        >
          {t(`compose.title.${composer.step}`)}
        </h1>
        {config.content.showDescriptions &&
        composer.step !== 'review' &&
        composer.step !== 'pasta' &&
        composer.step !== 'sauce' ? (
          <p className="k-subtitle">{t('compose.multi')}</p>
        ) : null}
      </div>
      {composer.step === 'review' ? (
        <section
          className="card"
          style={{ padding: '6px 24px' }}
          aria-label={t('compose.title.review')}
        >
          {lines.map((line) => (
            <div key={line.id} className="k-dock__line">
              <span>{line.label}</span>
              <b>{line.priceLabel}</b>
            </div>
          ))}
          <p style={{ padding: '16px 0', fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>
            {t('nutrition.total')} :{' '}
            {t('nutrition.line', {
              kcal: formatNumber(composer.totals.kcal, state.language),
              protein: formatNumber(composer.totals.proteinG, state.language),
            })}
          </p>
        </section>
      ) : (
        <PlateStepChoices
          step={composer.step}
          plate={composer.plate}
          catalog={catalog}
          config={config}
          onPatch={composer.patch}
        />
      )}
    </KioskLayout>
  );
}
