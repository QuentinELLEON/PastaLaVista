import {
  DRAFT_TOKEN_HEADER,
  type CategoryDto,
  type ChatReplyDto,
  type CreateDraftRequest,
  type CustomerProfileDto,
  type DraftWithTokenResponse,
  type KioskLoginSessionDto,
  type Locale,
  type MockLoginResponse,
  type OrderDraftDto,
  type PayDraftRequest,
  type PayDraftResponse,
  type ProductDto,
  type RetrieveDraftRequest,
  type UpdateDraftRequest,
} from '@pastalavista/shared';
import { request } from './apiClient';

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const draftHeader = (token: string) => ({ [DRAFT_TOKEN_HEADER]: token });

export const catalogApi = {
  categories: (locale: Locale) =>
    request<{ categories: CategoryDto[] }>(`/catalog/categories?locale=${locale}`).then(
      (r) => r.categories,
    ),
  products: (locale: Locale) =>
    request<{ products: ProductDto[] }>(`/catalog/products?locale=${locale}`).then(
      (r) => r.products,
    ),
};

export const authApi = {
  mockLogin: (customerId: string) =>
    request<MockLoginResponse>('/auth/mock-login', { method: 'POST', body: { customerId } }),
  me: (sessionToken: string) =>
    request<{ customer: CustomerProfileDto }>('/auth/me', { headers: bearer(sessionToken) }).then(
      (r) => r.customer,
    ),
  createKioskLoginSession: (kioskId: string) =>
    request<{ session: KioskLoginSessionDto }>('/kiosk-login/sessions', {
      method: 'POST',
      body: { kioskId },
    }).then((r) => r.session),
  getKioskLoginSession: (id: string) =>
    request<{ session: KioskLoginSessionDto }>(`/kiosk-login/sessions/${id}`).then(
      (r) => r.session,
    ),
  confirmKioskLogin: (id: string, sessionToken: string) =>
    request<{ session: KioskLoginSessionDto }>(`/kiosk-login/sessions/${id}/confirm`, {
      method: 'POST',
      headers: bearer(sessionToken),
    }).then((r) => r.session),
};

export const orderApi = {
  createDraft: (body: CreateDraftRequest) =>
    request<DraftWithTokenResponse>('/order-drafts', { method: 'POST', body }),
  updateDraft: (id: string, token: string, body: UpdateDraftRequest) =>
    request<{ draft: OrderDraftDto }>(`/order-drafts/${id}`, {
      method: 'PUT',
      body,
      headers: draftHeader(token),
    }).then((r) => r.draft),
  retrieveDraft: (body: RetrieveDraftRequest) =>
    request<DraftWithTokenResponse>('/order-drafts/retrieve', { method: 'POST', body }),
  pay: (id: string, token: string, body: PayDraftRequest) =>
    request<PayDraftResponse>(`/order-drafts/${id}/pay`, {
      method: 'POST',
      body,
      headers: draftHeader(token),
    }),
};

export const chatApi = {
  reply: (message: string, locale: Locale) =>
    request<ChatReplyDto>('/chat', { method: 'POST', body: { message, locale } }),
};
