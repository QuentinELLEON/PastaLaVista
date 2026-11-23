import { useNavigate } from 'react-router-dom';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { describeLine } from '../../../domain/cart/cart';
import { cartTotals } from '../../../domain/cart/cart';
import { DevOnly } from '../../../dev/Simulators';
import { formatPrice } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useCartActions } from '../../hooks/useCartActions';
import { BowlIllustration } from '../../shared/BowlIllustration';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { LanguageGrid } from '../../shared/LanguageGrid';
import { QrCode } from '../../shared/QrCode';
import { KioskLayout } from '../KioskLayout';
import { useKioskLogin } from '../kioskHooks';

/** Accueil. Même ossature pour tous : le bloc du haut devient « Votre habituelle » pour un habitué (RU1). */
export function HomeScreen() {
  useStepBoundary('home');
  const { state, dispatch, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const { addUsualOrder, startPlateFrom } = useCartActions();
  const login = useKioskLogin(!state.customer);
  const usual = state.customer?.usualOrder;
  const showUsual = config.content.showUsualFirst && usual;

  function chooseMode(mode: 'dine-in' | 'takeaway') {
    dispatch({ type: 'setMode', mode });
    navigate('/kiosk/menu');
  }

  const usualLine = usual?.lines[0];
  const usualLabel = usualLine ? describeLine(usualLine, catalog) : null;
  const usualTotal = usual
    ? formatPrice(cartTotals(usual.lines, catalog).totalCents, state.language)
    : '';

  return (
    <KioskLayout variant="bare">
      {showUsual && usualLine && usualLabel ? (
        <section className="k-hero k-hero--usual" aria-label={t('home.usual')}>
          <h1>{t('home.hello', { name: state.customer?.displayName.split(' ')[0] ?? '' })}</h1>
          <div className="k-usual">
            <h2>{t('home.usual')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <BowlIllustration productId={usualLine.productId} size={110} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 32, fontWeight: 800 }}>{usualLabel.title}</p>
                <p style={{ fontSize: 24, color: 'var(--muted)' }}>{usualLabel.details}</p>
              </div>
              <b style={{ fontSize: 36 }}>{usualTotal}</b>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button
                variant="primary"
                grow
                onClick={() => {
                  addUsualOrder();
                  navigate('/kiosk/pay');
                }}
              >
                {t('home.usualOneTouch')}
              </Button>
              <Button
                onClick={() => {
                  startPlateFrom(usualLine);
                  navigate('/kiosk/compose');
                }}
              >
                {t('home.modify')}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="k-hero" aria-label={t('app.name')}>
          <BowlIllustration art="classique" size={290} />
          <h1 className="pre-line">{t('home.tagline')}</h1>
          <p>{t('home.touch')}</p>
        </section>
      )}

      <section className="k-home" aria-label={t('mode.question')}>
        <h2 className="k-title" style={{ fontSize: 36 }}>
          {t('mode.question')}
        </h2>
        <div className="k-grid" style={{ gap: 20 }}>
          <button
            type="button"
            className="k-choice"
            aria-pressed={state.mode === 'dine-in' && state.cart.length > 0}
            onClick={() => chooseMode('dine-in')}
          >
            <Icon name="plate" size={84} />
            {t('mode.dineIn')}
          </button>
          <button
            type="button"
            className="k-choice"
            aria-pressed={state.mode === 'takeaway' && state.cart.length > 0}
            onClick={() => chooseMode('takeaway')}
          >
            <Icon name="bag" size={84} />
            {t('mode.takeaway')}
          </button>
        </div>
        {config.dialogue.codeEntryFallback ? (
          <Button block onClick={() => navigate('/kiosk/retrieve')}>
            <Icon name="phone" size={40} />
            {t('home.retrieve')}
          </Button>
        ) : null}
        <div className="k-bottom-row">
          {state.customer ? null : (
            <div className="k-login">
              {login.qrValue ? (
                <QrCode value={login.qrValue} size={130} label={t('home.alreadyCustomer')} />
              ) : null}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h3 style={{ fontSize: 30, fontWeight: 800 }}>{t('home.alreadyCustomer')}</h3>
                <p style={{ fontSize: 22, color: 'var(--muted)' }}>{t('home.scanHint')}</p>
                <DevOnly>
                  <Button
                    variant="success"
                    onClick={() => void login.simulatePhoneScan()}
                    style={{ height: 'auto', minHeight: 56, fontSize: 18, padding: '8px 12px' }}
                  >
                    {t('home.simulateScan')}
                  </Button>
                </DevOnly>
              </div>
            </div>
          )}
          <div style={{ width: 290, alignSelf: 'center', marginLeft: 'auto' }}>
            <LanguageGrid
              value={state.language}
              onChange={(language) => dispatch({ type: 'setLanguage', language })}
            />
          </div>
        </div>
      </section>
    </KioskLayout>
  );
}
