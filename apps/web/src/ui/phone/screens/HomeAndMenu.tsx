import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductDto } from '@pastalavista/shared';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { cartItemCount, cartTotals, describeLine } from '../../../domain/cart/cart';
import { POPULAR_CATEGORY_ID, productsOfCategory } from '../../../domain/catalog/catalog';
import { DEMO_ACCOUNTS } from '../../../mock/demoAccounts';
import { formatPrice } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useCartActions } from '../../hooks/useCartActions';
import { BowlIllustration } from '../../shared/BowlIllustration';
import { Button } from '../../shared/Button';
import { LanguageGrid } from '../../shared/LanguageGrid';
import { NutritionBadge } from '../../shared/NutritionBadge';
import { PhoneLayout } from '../PhoneLayout';
import { useDemoLogin } from '../phoneHooks';

function ModeSwitch() {
  const { state, dispatch, t } = useSession();
  return (
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
  );
}

export function ProductRow({ product }: { product: ProductDto }) {
  const { state } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const { addProduct } = useCartActions();
  const totals = cartTotals(
    [{ id: 'p', productId: product.id, quantity: 1, extraXl: false, options: [] }],
    catalog,
  );
  return (
    <div className="p-row">
      <BowlIllustration productId={product.id} size={56} />
      <span className="p-row__text">
        <span className="p-row__name">{product.name}</span>
        <span className="p-row__desc">
          {config.content.showDescriptions || product.kind === 'composition'
            ? product.description
            : ''}
        </span>
        {config.content.showNutrition ? (
          <NutritionBadge kcal={totals.kcal} proteinG={totals.proteinG} />
        ) : null}
        <b>{formatPrice(product.priceCents, state.language)}</b>
      </span>
      <button
        type="button"
        className="p-add"
        aria-label={`+ ${product.name}`}
        onClick={() => addProduct(product)}
      >
        +
      </button>
    </div>
  );
}

/** Accueil réduit du smartphone : bonjour, sur place / à emporter, habituelle, plats populaires. */
export function PhoneHome() {
  useStepBoundary('home');
  const { state, dispatch, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const { addUsualOrder, startPlateFrom } = useCartActions();
  const { login, busy, error } = useDemoLogin();
  const usual = state.customer?.usualOrder?.lines[0];
  const populars = productsOfCategory(catalog, POPULAR_CATEGORY_ID);
  const count = cartItemCount(state.cart);

  return (
    <PhoneLayout
      footer={
        count > 0 ? (
          <Button variant="primary" block onClick={() => navigate('/m/recap')}>
            {t('phone.viewOrder')} · {count}
          </Button>
        ) : undefined
      }
    >
      <h1 className="p-title">
        {state.customer
          ? t('phone.helloName', { name: state.customer.displayName.split(' ')[0] ?? '' })
          : t('phone.hello')}
      </h1>
      <ModeSwitch />

      {config.content.showUsualFirst && usual ? (
        <section className="p-card" aria-label={t('home.usual')}>
          <h2 style={{ fontSize: 18 }}>{t('home.usual')}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BowlIllustration productId={usual.productId} size={56} />
            <div style={{ flex: 1 }}>
              <p className="p-row__name">{describeLine(usual, catalog).title}</p>
              <p className="p-row__desc">{describeLine(usual, catalog).details}</p>
            </div>
            <b>{formatPrice(cartTotals([usual], catalog).totalCents, state.language)}</b>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="primary"
              grow
              onClick={() => {
                addUsualOrder();
                navigate('/m/recap');
              }}
            >
              {t('home.usualOneTouch')}
            </Button>
            <Button
              onClick={() => {
                startPlateFrom(usual);
                navigate('/m/compose');
              }}
            >
              {t('home.modify')}
            </Button>
          </div>
        </section>
      ) : null}

      {config.dialogue.chatbotOffer ? (
        <Button block onClick={() => navigate('/m/chat')}>
          {t('phone.chatEntry')}
        </Button>
      ) : null}

      <h2 style={{ fontSize: 20 }}>{t('home.popular')}</h2>
      {populars.map((product) => (
        <ProductRow key={product.id} product={product} />
      ))}
      <Button block onClick={() => navigate('/m/compose')}>
        {t('menu.composeTile')}
      </Button>
      <Button block onClick={() => navigate('/m/menu')}>
        {t('phone.menu')}
      </Button>

      {state.customer ? (
        <Button block onClick={() => dispatch({ type: 'logout' })}>
          {t('phone.logout')}
        </Button>
      ) : (
        <section className="p-card" aria-label={t('phone.demoLogin')}>
          <h2 style={{ fontSize: 16 }}>{t('phone.demoLogin')}</h2>
          <p className="p-sub">{t('phone.demoLoginHint')}</p>
          {DEMO_ACCOUNTS.map((account) => (
            <Button key={account.id} disabled={busy} onClick={() => void login(account.id)}>
              {t('phone.loginAs', { name: account.firstName })}
            </Button>
          ))}
          {error ? <p role="alert">{error}</p> : null}
        </section>
      )}
      <LanguageGrid
        value={state.language}
        onChange={(language) => dispatch({ type: 'setLanguage', language })}
      />
    </PhoneLayout>
  );
}

/** Menu en une colonne : catégories en pastilles, produits en liste. */
export function PhoneMenu() {
  useStepBoundary('menu');
  const { state, t } = useSession();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [active, setActive] = useState(POPULAR_CATEGORY_ID);
  const count = cartItemCount(state.cart);
  const categories = catalog.categories.filter((category) => category.id !== 'cat-composer');
  const products = productsOfCategory(catalog, active);
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
            disabled={count === 0}
            onClick={() => navigate('/m/recap')}
          >
            {t('phone.viewOrder')} · {count}
          </Button>
        </>
      }
    >
      <div className="chips" style={{ padding: 0 }} role="group" aria-label={t('menu.categories')}>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="chip"
            aria-pressed={active === category.id}
            onClick={() => setActive(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
      {products.length === 0 ? (
        <p className="p-sub">{t('menu.empty')}</p>
      ) : (
        products.map((product) => <ProductRow key={product.id} product={product} />)
      )}
    </PhoneLayout>
  );
}
