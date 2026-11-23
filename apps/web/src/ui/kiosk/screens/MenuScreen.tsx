import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProductDto } from '@pastalavista/shared';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { cartItemCount, cartTotals, describeLine } from '../../../domain/cart/cart';
import {
  COMPOSE_CATEGORY_ID,
  DRINKS_CATEGORY_ID,
  POPULAR_CATEGORY_ID,
  productsOfCategory,
} from '../../../domain/catalog/catalog';
import { formatPrice } from '../../../shared/format';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useCartActions } from '../../hooks/useCartActions';
import { useEndSession } from '../../hooks/useEndSession';
import { BowlIllustration } from '../../shared/BowlIllustration';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { NutritionBadge } from '../../shared/NutritionBadge';
import { ProductTile } from '../../shared/ProductTile';
import { KioskLayout } from '../KioskLayout';
import { CartDock, CategoryRail, type RailEntry } from '../KioskParts';

const FAVORITES_ID = 'favorites';
const ICON_BY_CATEGORY = {
  'cat-composer': 'plus',
  'cat-populaires': 'star',
  'cat-boissons': 'drink',
  'cat-desserts': 'dessert',
  'cat-menus': 'menus',
} as const;

/** Barre de panier commune au menu (permanente, mêmes boutons au même endroit). */
export function useCartDockProps() {
  const { state, t } = useSession();
  const catalog = useCatalog();
  const totals = cartTotals(state.cart, catalog);
  return {
    title: `${t('cart.title')} · ${t('cart.count', { count: cartItemCount(state.cart) })}`,
    subtitle: (
      <span style={{ fontSize: 24, color: 'var(--muted)' }}>
        {state.mode === 'dine-in' ? t('mode.dineIn') : t('mode.takeaway')}
      </span>
    ),
    lines: state.cart.map((line) => {
      const label = describeLine(line, catalog);
      return {
        id: line.id,
        label: [label.title, label.details].filter(Boolean).join(' · '),
        priceLabel: formatPrice(cartTotals([line], catalog).totalCents, state.language),
      };
    }),
    totalLabel: t('cart.total'),
    totalValue: formatPrice(totals.totalCents, state.language),
  };
}

export function MenuScreen() {
  useStepBoundary('menu');
  const { state, t } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const { addProduct, addUsualOrder, startPlateFrom } = useCartActions();
  const dock = useCartDockProps();
  const endSession = useEndSession();
  const usual = state.customer?.usualOrder?.lines[0];
  const showFavorites = config.content.showUsualFirst && Boolean(usual);
  const [active, setActive] = useState(showFavorites ? FAVORITES_ID : POPULAR_CATEGORY_ID);

  const entries: RailEntry[] = [
    ...(showFavorites ? [{ id: FAVORITES_ID, label: t('home.usual'), icon: 'star' as const }] : []),
    ...catalog.categories.map((category) => ({
      id: category.id,
      label: category.name,
      icon: ICON_BY_CATEGORY[category.id as keyof typeof ICON_BY_CATEGORY] ?? ('menus' as const),
    })),
  ];

  function select(id: string) {
    if (id === COMPOSE_CATEGORY_ID) navigate('/kiosk/compose');
    else setActive(id);
  }

  const tile = (product: ProductDto) => {
    const totals = cartTotals(
      [{ id: 'p', productId: product.id, quantity: 1, extraXl: false, options: [] }],
      catalog,
    );
    return (
      <ProductTile
        key={product.id}
        name={product.name}
        description={product.description}
        priceLabel={formatPrice(product.priceCents, state.language)}
        art={<BowlIllustration productId={product.id} size={112} />}
        extra={
          config.content.showNutrition ? (
            <NutritionBadge kcal={totals.kcal} proteinG={totals.proteinG} />
          ) : null
        }
        showAdd
        onClick={() => addProduct(product)}
      />
    );
  };

  const products = productsOfCategory(catalog, active);
  const activeName =
    catalog.categories.find((category) => category.id === active)?.name ?? t('home.usual');

  return (
    <KioskLayout
      step="choose"
      rail={
        <CategoryRail
          entries={entries}
          activeId={active}
          ariaLabel={t('menu.categories')}
          onSelect={select}
        />
      }
      dock={
        <CartDock
          variant="cart"
          title={dock.title}
          subtitle={dock.subtitle}
          lines={dock.lines}
          totalLabel={dock.totalLabel}
          totalValue={dock.totalValue}
        >
          <Button variant="danger" onClick={() => endSession()}>
            {t('cart.cancel')}
          </Button>
          <Button
            variant="primary"
            className="k-dock__cta"
            disabled={state.cart.length === 0}
            onClick={() => navigate('/kiosk/pay')}
          >
            {t('cart.pay')}
          </Button>
        </CartDock>
      }
    >
      <h1 className="k-title">{active === FAVORITES_ID ? t('home.usual') : activeName}</h1>
      {active === FAVORITES_ID && usual ? (
        <div className="k-grid">
          <ProductTile
            name={t('home.usual')}
            description={describeLine(usual, catalog).details}
            priceLabel={formatPrice(cartTotals([usual], catalog).totalCents, state.language)}
            art={<BowlIllustration productId={usual.productId} size={112} />}
            showAdd
            onClick={() => addUsualOrder()}
          />
          <ProductTile
            name={t('home.modify')}
            art={<Icon name="plus" size={96} />}
            dashed
            onClick={() => {
              startPlateFrom(usual);
              navigate('/kiosk/compose');
            }}
          />
        </div>
      ) : (
        <div className="k-grid">
          {products.map(tile)}
          {active === POPULAR_CATEGORY_ID ? (
            <ProductTile
              name={t('menu.composeTile')}
              description={t('menu.composeHint')}
              art={<Icon name="plus" size={96} strokeWidth={2.5} />}
              dashed
              onClick={() => navigate('/kiosk/compose')}
            />
          ) : null}
          {products.length === 0 &&
          active !== POPULAR_CATEGORY_ID &&
          active !== DRINKS_CATEGORY_ID ? (
            <p className="k-subtitle">{t('menu.empty')}</p>
          ) : null}
        </div>
      )}
    </KioskLayout>
  );
}
