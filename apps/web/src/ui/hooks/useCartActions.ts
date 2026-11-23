import { useCallback } from 'react';
import type { OrderLine, OrderLineInput, ProductDto } from '@pastalavista/shared';
import { useCatalog } from '../../state/CatalogProvider';
import { useSession } from '../../state/SessionProvider';

export function newLineId(): string {
  return crypto.randomUUID();
}

/** Actions de panier communes à la borne et au smartphone (aucune règle d'adaptation ici). */
export function useCartActions() {
  const { state, dispatch } = useSession();
  const catalog = useCatalog();

  const addInputLines = useCallback(
    (lines: OrderLineInput[]) =>
      lines.forEach((line) => dispatch({ type: 'addLine', line: { ...line, id: newLineId() } })),
    [dispatch],
  );

  /** Produit prêt à commander (composition populaire ou boisson) : une portion. */
  const addProduct = useCallback(
    (product: ProductDto) =>
      dispatch({
        type: 'addLine',
        line: { id: newLineId(), productId: product.id, quantity: 1, extraXl: false, options: [] },
      }),
    [dispatch],
  );

  /** Commande habituelle du client reconnu : ses lignes sont copiées dans le panier. */
  const addUsualOrder = useCallback((): OrderLine[] => {
    const usual = state.customer?.usualOrder;
    if (!usual) return [];
    const lines = usual.lines.map((line) => ({ ...line, id: newLineId() }));
    lines.forEach((line) => dispatch({ type: 'addLine', line }));
    dispatch({ type: 'setMode', mode: usual.mode });
    return lines;
  }, [dispatch, state.customer]);

  /** Démarre la composition d'une assiette pré-remplie (modifier une habituelle ou une suggestion). */
  const startPlateFrom = useCallback(
    (line: OrderLineInput) =>
      dispatch({ type: 'startPlateFromLine', line: { ...line, id: newLineId() }, catalog }),
    [dispatch, catalog],
  );

  return { addInputLines, addProduct, addUsualOrder, startPlateFrom };
}
