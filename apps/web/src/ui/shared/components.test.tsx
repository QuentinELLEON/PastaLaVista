import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { alexeiContext, makeContext } from '../../../test/factories';
import { catalog } from '../../../test/catalogFixture';
import { renderWithSession } from '../../../test/render';
import { StaticRulesEngine } from '../../adaptation/engine/engine';
import { EMPTY_PLATE } from '../../domain/cart/plate';
import { HelpPrompt } from './HelpPrompt';
import { LanguageGrid } from './LanguageGrid';
import { NutritionBadge } from './NutritionBadge';
import { OrderCodeInput } from './OrderCodeInput';
import { PlateStepChoices } from './PlateStepChoices';
import { QtyStepper } from './QtyStepper';

const engine = new StaticRulesEngine();
const standard = engine.decide(makeContext());
const guided = engine.decide(alexeiContext());

describe('QtyStepper', () => {
  it('modifie la quantité par pas de 1 avec des boutons nommés', () => {
    const onChange = vi.fn();
    renderWithSession(
      <QtyStepper value={2} onChange={onChange} decreaseLabel="moins" increaseLabel="plus" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'plus' }));
    fireEvent.click(screen.getByRole('button', { name: 'moins' }));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });

  it('désactive « moins » au minimum', () => {
    renderWithSession(
      <QtyStepper
        value={0}
        onChange={() => undefined}
        decreaseLabel="moins"
        increaseLabel="plus"
      />,
    );
    expect((screen.getByRole('button', { name: 'moins' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe('NutritionBadge', () => {
  it('affiche kcal et protéines dans la langue de la session, sucres lents en texte', () => {
    renderWithSession(<NutritionBadge kcal={1300} proteinG={104} slowCarbs />, { language: 'ru' });
    expect(screen.getByText(/ккал/).textContent).toContain('104 г белка');
    expect(screen.queryByText(/Медленные углеводы/)).not.toBeNull();
  });
});

describe('HelpPrompt', () => {
  const handlers = () => ({
    onAccept: vi.fn(),
    onDecline: vi.fn(),
    onCallStaff: vi.fn(),
    onClose: vi.fn(),
  });

  it('l’offre propose d’accepter, d’appeler un employé ou de refuser', () => {
    const h = handlers();
    renderWithSession(<HelpPrompt offered active={false} {...h} />, { language: 'ru' });
    fireEvent.click(screen.getByRole('button', { name: 'Да, подсказки' }));
    fireEvent.click(screen.getByRole('button', { name: 'Позвать сотрудника' }));
    fireEvent.click(screen.getByRole('button', { name: 'Нет, спасибо' }));
    expect(h.onAccept).toHaveBeenCalledOnce();
    expect(h.onCallStaff).toHaveBeenCalledOnce();
    expect(h.onDecline).toHaveBeenCalledOnce();
  });

  it('aide active : on peut la désactiver (adaptation réversible), pas l’accepter de nouveau', () => {
    const h = handlers();
    renderWithSession(<HelpPrompt offered={false} active {...h} />);
    expect(screen.queryByRole('button', { name: 'Oui, des conseils' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver l’aide' }));
    expect(h.onDecline).toHaveBeenCalledOnce();
  });

  it('demande d’aide sans offre : proposer l’appel d’un employé et fermer', () => {
    const h = handlers();
    renderWithSession(<HelpPrompt offered={false} active={false} {...h} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(h.onClose).toHaveBeenCalledOnce();
  });
});

describe('OrderCodeInput', () => {
  it('refuse un code mal formé avec un message accessible, sans soumettre', () => {
    const onSubmit = vi.fn();
    renderWithSession(<OrderCodeInput onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Code de commande'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByRole('alert').textContent).toContain('PL-1234');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('normalise le code saisi (pl4821 -> PL-4821)', () => {
    const onSubmit = vi.fn();
    renderWithSession(<OrderCodeInput onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Code de commande'), { target: { value: ' pl4821 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onSubmit).toHaveBeenCalledWith('PL-4821');
  });

  it('affiche l’erreur renvoyée par le serveur (code expiré...)', () => {
    renderWithSession(
      <OrderCodeInput onSubmit={() => undefined} error="Cette commande a expiré." />,
    );
    expect(screen.getByRole('alert').textContent).toContain('expiré');
  });
});

describe('LanguageGrid', () => {
  it('marque la langue courante et notifie le choix (jamais par la couleur seule : aria-pressed)', () => {
    const onChange = vi.fn();
    renderWithSession(<LanguageGrid value="fr" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Français' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Русский' }));
    expect(onChange).toHaveBeenCalledWith('ru');
  });
});

describe('PlateStepChoices : variantes standard et guidée', () => {
  it('IHM standard : tuiles sans kcal ni description ; une garniture se bascule 0/1', () => {
    const onPatch = vi.fn();
    renderWithSession(
      <PlateStepChoices
        step="toppings"
        plate={EMPTY_PLATE}
        catalog={catalog}
        config={standard}
        onPatch={onPatch}
      />,
    );
    expect(screen.queryByText(/kcal/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Poulet grillé/ }));
    expect(onPatch).toHaveBeenCalledWith({ toppings: { 'top-poulet': 1 } });
  });

  it('mode guidé : lignes larges avec kcal, protéines et quantité (RU5)', () => {
    const onPatch = vi.fn();
    renderWithSession(
      <PlateStepChoices
        step="toppings"
        plate={{ ...EMPTY_PLATE, toppings: { 'top-poulet': 2 } }}
        catalog={catalog}
        config={guided}
        onPatch={onPatch}
      />,
      { language: 'ru' },
    );
    expect(screen.getAllByText(/ккал/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить порцию: Poulet grillé' }));
    expect(onPatch).toHaveBeenCalledWith({ toppings: { 'top-poulet': 3 } });
  });

  it('les pâtes complètes affichent « sucres lents » en mode guidé et le choix XL est disponible', () => {
    const onPatch = vi.fn();
    renderWithSession(
      <PlateStepChoices
        step="pasta"
        plate={EMPTY_PLATE}
        catalog={catalog}
        config={guided}
        onPatch={onPatch}
      />,
      { language: 'ru' },
    );
    expect(screen.queryByText(/Медленные углеводы/)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Порция XL/ }));
    expect(onPatch).toHaveBeenCalledWith({ extraXl: true });
  });

  it('le smartphone force la liste en colonne même avec la configuration standard', () => {
    renderWithSession(
      <PlateStepChoices
        step="sauce"
        plate={EMPTY_PLATE}
        catalog={catalog}
        config={standard}
        onPatch={() => undefined}
        forceRows
      />,
    );
    expect(screen.getAllByText(/kcal/).length).toBeGreaterThan(0);
  });
});
