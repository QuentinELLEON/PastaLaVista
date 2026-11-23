import { XL_SURCHARGE_CENTS, type ProductDto, type UiConfig } from '@pastalavista/shared';
import type { Catalog } from '../../domain/catalog/catalog';
import { productsOfKind } from '../../domain/catalog/catalog';
import { setQuantity, type PlateDraft, type PlateStep } from '../../domain/cart/plate';
import { formatPrice, formatSurcharge } from '../../shared/format';
import { useSession } from '../../state/SessionProvider';
import { BowlIllustration } from './BowlIllustration';
import { NutritionBadge } from './NutritionBadge';
import { OptionRow } from './OptionRow';
import { ProductTile } from './ProductTile';

interface Props {
  step: PlateStep;
  plate: PlateDraft;
  catalog: Catalog;
  config: UiConfig;
  onPatch: (patch: Partial<PlateDraft>) => void;
  /** Force la liste en colonne (smartphone) quelle que soit la configuration. */
  forceRows?: boolean;
}

const KIND_BY_STEP = {
  pasta: 'pasta',
  sauce: 'sauce',
  toppings: 'topping',
  extras: 'extra',
} as const;
const ART_SIZE_ROW = 76;
const ART_SIZE_TILE = 120;

function XlOption({ plate, onPatch }: Pick<Props, 'plate' | 'onPatch'>) {
  const { state, t } = useSession();
  return (
    <OptionRow
      name={t('compose.xl')}
      priceLabel={t('compose.xlHint', {
        price: formatSurcharge(XL_SURCHARGE_CENTS, state.language),
      })}
      art={<BowlIllustration art="generic" size={ART_SIZE_ROW} />}
      selected={plate.extraXl}
      onSelect={() => onPatch({ extraXl: !plate.extraXl })}
    />
  );
}

/**
 * Choix d'une étape de composition, partagé par la borne et le smartphone.
 * Tuiles (IHM standard de la borne) ou lignes larges avec quantité et nutrition (guidé, smartphone).
 */
export function PlateStepChoices({ step, plate, catalog, config, onPatch, forceRows }: Props) {
  const { state, t } = useSession();
  const locale = state.language;
  const products = productsOfKind(catalog, KIND_BY_STEP[step]);
  const asRows = forceRows || config.presentation.optionStyle === 'rows';
  const isMulti = step === 'toppings' || step === 'extras';
  const showNutrition = config.content.showNutrition || Boolean(forceRows);
  const showDescription = config.content.showDescriptions || Boolean(forceRows);

  const quantityOf = (product: ProductDto): number =>
    (step === 'toppings' ? plate.toppings : plate.extras)[product.id] ?? 0;

  function choose(product: ProductDto, next?: number) {
    if (step === 'pasta') onPatch({ pastaId: product.id });
    else if (step === 'sauce') onPatch({ sauceId: product.id });
    else {
      const wanted = next ?? (quantityOf(product) > 0 ? 0 : 1);
      if (step === 'toppings')
        onPatch({ toppings: setQuantity(plate.toppings, product.id, wanted) });
      else onPatch({ extras: setQuantity(plate.extras, product.id, wanted) });
    }
  }

  const isSelected = (product: ProductDto): boolean =>
    step === 'pasta'
      ? plate.pastaId === product.id
      : step === 'sauce'
        ? plate.sauceId === product.id
        : quantityOf(product) > 0;

  // Les pâtes affichent leur prix de base, les autres choix un supplément
  const priceLabel = (product: ProductDto): string =>
    step === 'pasta'
      ? formatPrice(product.priceCents, locale)
      : formatSurcharge(product.priceCents, locale);

  if (asRows) {
    return (
      <div className="k-stack" role="group">
        {products.map((product) => (
          <OptionRow
            key={product.id}
            name={product.name}
            description={showDescription ? product.description : undefined}
            priceLabel={priceLabel(product)}
            art={<BowlIllustration productId={product.id} size={ART_SIZE_ROW} />}
            selected={isSelected(product)}
            nutrition={
              showNutrition
                ? { kcal: product.kcal, proteinG: product.proteinG, slowCarbs: product.isSlowCarb }
                : undefined
            }
            onSelect={isMulti ? undefined : () => choose(product)}
            quantity={isMulti ? quantityOf(product) : undefined}
            onQuantityChange={isMulti ? (next) => choose(product, next) : undefined}
            decreaseLabel={t('compose.qtyMinus', { name: product.name })}
            increaseLabel={t('compose.qtyPlus', { name: product.name })}
          />
        ))}
        {step === 'pasta' ? <XlOption plate={plate} onPatch={onPatch} /> : null}
      </div>
    );
  }

  return (
    <>
      <div className="k-grid k-grid--compact" role="group">
        {products.map((product) => (
          <ProductTile
            key={product.id}
            name={product.name}
            description={showDescription ? product.description : undefined}
            priceLabel={priceLabel(product)}
            art={<BowlIllustration productId={product.id} size={ART_SIZE_TILE} />}
            selected={isSelected(product)}
            extra={
              showNutrition ? (
                <NutritionBadge
                  kcal={product.kcal}
                  proteinG={product.proteinG}
                  slowCarbs={product.isSlowCarb}
                />
              ) : null
            }
            onClick={() => choose(product)}
          />
        ))}
      </div>
      {step === 'pasta' ? <XlOption plate={plate} onPatch={onPatch} /> : null}
    </>
  );
}
