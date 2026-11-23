import type {
  CustomerProfileDto,
  DraftProblem,
  HelpAnswer,
  Locale,
  OrderDraftDto,
  OrderLine,
  OrderMode,
  PayDraftResponse,
} from '@pastalavista/shared';
import { addLine, addOptionToLine, replaceLine, setLineQuantity } from '../cart/cart';
import {
  EMPTY_PLATE,
  lineToPlate,
  plateToLine,
  type ComposeStep,
  type PlateDraft,
} from '../cart/plate';
import type { Catalog } from '../catalog/catalog';

export interface DraftRef {
  id: string;
  code: string;
  token: string;
  expiresAt: string;
}

/**
 * État de la commande en cours. Il vit AU-DESSUS de l'IHM adaptative : changer de profil ou de
 * disposition ré-injecte le même état (panier, étape, assiette en cours, aide).
 */
export interface SessionState {
  language: Locale;
  mode: OrderMode;
  customer: CustomerProfileDto | null;
  sessionToken: string | null;
  cart: OrderLine[];
  plate: PlateDraft;
  plateStep: ComposeStep;
  editingLineId: string | null;
  draft: DraftRef | null;
  retrievedFromPhone: boolean;
  draftProblem: DraftProblem;
  order: PayDraftResponse | null;
  helpAnswer: HelpAnswer;
  helpRequested: boolean;
  highContrast: boolean;
  staffCalled: boolean;
}

export const INITIAL_SESSION: SessionState = {
  language: 'fr',
  mode: 'dine-in',
  customer: null,
  sessionToken: null,
  cart: [],
  plate: EMPTY_PLATE,
  plateStep: 'pasta',
  editingLineId: null,
  draft: null,
  retrievedFromPhone: false,
  draftProblem: 'none',
  order: null,
  helpAnswer: 'none',
  helpRequested: false,
  highContrast: false,
  staffCalled: false,
};

export type SessionAction =
  | { type: 'setLanguage'; language: Locale }
  | { type: 'setMode'; mode: OrderMode }
  | { type: 'login'; customer: CustomerProfileDto; sessionToken: string | null }
  | { type: 'logout' }
  | { type: 'addLine'; line: OrderLine }
  | { type: 'setLineQuantity'; lineId: string; quantity: number }
  | { type: 'addOption'; lineId: string; productId: string }
  | { type: 'replaceCart'; cart: OrderLine[] }
  | { type: 'patchPlate'; patch: Partial<PlateDraft> }
  | { type: 'setPlateStep'; step: ComposeStep }
  | { type: 'editLine'; lineId: string; catalog: Catalog }
  | { type: 'startPlateFromLine'; line: OrderLine; catalog: Catalog }
  | { type: 'finishPlate'; lineId: string }
  | { type: 'resetPlate' }
  | { type: 'setDraft'; draft: DraftRef | null }
  | {
      type: 'receiveDraft';
      draft: OrderDraftDto;
      token: string;
      customer: CustomerProfileDto | null;
    }
  | { type: 'setDraftProblem'; problem: DraftProblem }
  | { type: 'setOrder'; order: PayDraftResponse }
  | { type: 'answerHelp'; answer: HelpAnswer }
  | { type: 'requestHelp'; requested: boolean }
  | { type: 'setHighContrast'; enabled: boolean }
  | { type: 'callStaff'; called: boolean }
  | { type: 'reset' }
  | { type: 'hydrate'; state: SessionState };

function draftRef(draft: OrderDraftDto, token: string): DraftRef {
  return { id: draft.id, code: draft.code, token, expiresAt: draft.expiresAt };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'setLanguage':
      return { ...state, language: action.language };
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'login':
      return { ...state, customer: action.customer, sessionToken: action.sessionToken };
    case 'logout':
      return { ...state, customer: null, sessionToken: null };
    case 'addLine':
      return { ...state, cart: addLine(state.cart, action.line) };
    case 'setLineQuantity':
      return { ...state, cart: setLineQuantity(state.cart, action.lineId, action.quantity) };
    case 'addOption':
      return { ...state, cart: addOptionToLine(state.cart, action.lineId, action.productId) };
    case 'replaceCart':
      return { ...state, cart: action.cart };
    case 'patchPlate':
      return { ...state, plate: { ...state.plate, ...action.patch } };
    case 'setPlateStep':
      return { ...state, plateStep: action.step };
    case 'editLine': {
      const line = state.cart.find((candidate) => candidate.id === action.lineId);
      if (!line) return state;
      return {
        ...state,
        plate: lineToPlate(line, action.catalog),
        plateStep: 'pasta',
        editingLineId: line.id,
      };
    }
    case 'startPlateFromLine':
      return {
        ...state,
        plate: lineToPlate(action.line, action.catalog),
        plateStep: 'pasta',
        editingLineId: null,
      };
    case 'finishPlate': {
      const line = plateToLine(state.plate, action.lineId);
      if (!line) return state;
      const cart = state.editingLineId
        ? replaceLine(state.cart, state.editingLineId, { ...line, id: state.editingLineId })
        : addLine(state.cart, line);
      return { ...state, cart, plate: EMPTY_PLATE, plateStep: 'pasta', editingLineId: null };
    }
    case 'resetPlate':
      return { ...state, plate: EMPTY_PLATE, plateStep: 'pasta', editingLineId: null };
    case 'setDraft':
      return { ...state, draft: action.draft };
    case 'receiveDraft':
      // La commande préparée sur le smartphone remplace le panier de la borne, langue et client compris
      return {
        ...state,
        cart: action.draft.lines,
        mode: action.draft.mode,
        language: action.draft.locale,
        customer: action.customer ?? state.customer,
        draft: draftRef(action.draft, action.token),
        retrievedFromPhone: true,
        draftProblem: 'none',
      };
    case 'setDraftProblem':
      return { ...state, draftProblem: action.problem };
    case 'setOrder':
      return { ...state, order: action.order };
    case 'answerHelp':
      return { ...state, helpAnswer: action.answer, helpRequested: false };
    case 'requestHelp':
      return { ...state, helpRequested: action.requested };
    case 'setHighContrast':
      return { ...state, highContrast: action.enabled };
    case 'callStaff':
      return { ...state, staffCalled: action.called };
    case 'reset':
      // Fin de session : on ne garde rien (écran public), pas même le contraste ni la langue
      return INITIAL_SESSION;
    case 'hydrate':
      return action.state;
  }
}
