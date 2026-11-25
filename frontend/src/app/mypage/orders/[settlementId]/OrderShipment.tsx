'use client';

import axios from 'axios';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { fetchShipment, saveShippingAddress } from '@/lib/api';
import type { Shipment, ShippingAddressRequest, Settlement } from '@/types';
import {
  buyerOrderFailure,
  isCurrentOrderSession,
  OrderNotice,
  type OrderFailure,
  type OrderSession,
} from '../OrderView';

const phonePattern = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
const zipPattern = /^\d{5}$/;

const addressFields = [
  { name: 'recipientName', label: '수령인', maxLength: 50, autoComplete: 'shipping name' },
  {
    name: 'recipientPhone',
    label: '연락처',
    maxLength: 13,
    autoComplete: 'shipping tel-national',
    inputMode: 'tel',
  },
  {
    name: 'zipCode',
    label: '우편번호',
    maxLength: 5,
    autoComplete: 'shipping postal-code',
    inputMode: 'numeric',
  },
  { name: 'address', label: '기본 주소', maxLength: 200, autoComplete: 'shipping address-line1' },
  {
    name: 'addressDetail',
    label: '상세 주소',
    maxLength: 200,
    autoComplete: 'shipping address-line2',
    optional: true,
  },
  { name: 'requestMemo', label: '배송 메모', maxLength: 200, autoComplete: 'off', optional: true },
] as const;

const shipmentLabels = {
  READY: '발송 대기',
  SHIPPED: '발송 완료',
  DELIVERED: '수령 완료',
};

type ShipmentLoad =
  | { status: 'loading' }
  | { status: 'loaded'; shipment: Shipment | null }
  | { status: 'failed'; failure: OrderFailure };

export default function OrderShipment({
  order,
  session: { accessToken, memberId },
  onAccessLost,
  onOrderStateChanged,
}: {
  order: Settlement;
  session: OrderSession;
  onAccessLost: (failure: OrderFailure) => void;
  onOrderStateChanged: () => void;
}) {
  const { id, paymentStatus } = order;
  const [load, setLoad] = useState<ShipmentLoad>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const pendingSave = useRef<AbortController | null>(null);

  function reload() {
    setLoad({ status: 'loading' });
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const isCurrent = () =>
      !controller.signal.aborted && isCurrentOrderSession({ memberId, accessToken });

    fetchShipment(id, { accessToken, signal: controller.signal })
      .then((shipment) => {
        if (isCurrent()) setLoad({ status: 'loaded', shipment });
      })
      .catch((error: unknown) => {
        if (!isCurrent()) return;
        const response = axios.isAxiosError<{ code: string }>(error) ? error.response : undefined;
        if (response?.status === 404 && response.data?.code === 'SHIPMENT_NOT_FOUND') {
          setLoad({ status: 'loaded', shipment: null });
          return;
        }
        const failure = buyerOrderFailure(error, '배송 정보를 불러오지 못했습니다.');
        if (response?.status === 401 || response?.status === 403) {
          onAccessLost(failure);
          return;
        }
        setLoad({ status: 'failed', failure });
      });

    return () => controller.abort();
  }, [id, memberId, accessToken, attempt, onAccessLost]);

  useEffect(() => () => pendingSave.current?.abort(), []);

  const shipment = load.status === 'loaded' ? load.shipment : null;
  const canEdit =
    load.status === 'loaded' &&
    (paymentStatus === 'PENDING' || paymentStatus === 'PAID') &&
    (!shipment || shipment.status === 'READY');

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      pendingSave.current ||
      saveBlocked ||
      !canEdit ||
      !isCurrentOrderSession({ memberId, accessToken })
    )
      return;

    const fields = new FormData(event.currentTarget);
    const value = (name: keyof ShippingAddressRequest) => String(fields.get(name) ?? '').trim();
    const address: ShippingAddressRequest = {
      recipientName: value('recipientName'),
      recipientPhone: value('recipientPhone'),
      zipCode: value('zipCode'),
      address: value('address'),
      addressDetail: value('addressDetail'),
      requestMemo: value('requestMemo'),
    };
    const invalidField = addressFields.find(
      ({ name, maxLength, ...field }) =>
        (!('optional' in field) && !address[name]) || address[name].length > maxLength,
    );

    setNotice('');
    if (invalidField) {
      setSaveError(`${invalidField.label} 값을 확인해 주세요.`);
      return;
    }
    if (!phonePattern.test(address.recipientPhone)) {
      setSaveError('연락처를 국내 전화번호 형식으로 입력해 주세요.');
      return;
    }
    if (!zipPattern.test(address.zipCode)) {
      setSaveError('우편번호는 숫자 5자리로 입력해 주세요.');
      return;
    }

    const controller = new AbortController();
    const isCurrent = () =>
      !controller.signal.aborted && isCurrentOrderSession({ memberId, accessToken });
    pendingSave.current = controller;
    setSaving(true);
    setSaveError('');

    try {
      const updated = await saveShippingAddress(id, address, {
        accessToken,
        signal: controller.signal,
      });
      if (!isCurrent()) return;
      setLoad({ status: 'loaded', shipment: updated });
      setNotice('배송지를 저장했습니다.');
    } catch (error) {
      if (!isCurrent()) return;
      const response = axios.isAxiosError<{ code: string }>(error) ? error.response : undefined;
      const failure = buyerOrderFailure(
        error,
        '배송지를 저장하지 못했습니다. 입력을 확인하고 다시 시도해 주세요.',
      );
      if (response?.status === 401 || response?.status === 403) {
        onAccessLost(failure);
      } else if (response?.data?.code === 'SHIPMENT_ALREADY_SHIPPED') {
        setNotice('발송 상태가 바뀌었습니다.');
        reload();
      } else if (response?.data?.code === 'SETTLEMENT_NOT_SHIPPABLE') {
        setSaveBlocked(true);
        setSaveError('주문 상태가 바뀌어 배송지를 저장할 수 없습니다.');
        onOrderStateChanged();
      } else {
        setSaveError(failure.message);
      }
    } finally {
      pendingSave.current = null;
      if (isCurrent()) setSaving(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-[#e6e7e2] p-4">
      <h2 className="mb-3 text-lg font-extrabold">배송 정보</h2>
      {notice && (
        <p role="status" className="mb-3 text-sm text-[#576e2e]">
          {notice}
        </p>
      )}
      {saveError && (
        <p role="alert" className="mb-3 text-sm text-[#a32b21]">
          {saveError}
        </p>
      )}
      {load.status === 'loading' && (
        <p role="status" className="text-sm">
          배송 정보를 불러오는 중…
        </p>
      )}
      {load.status === 'failed' && <OrderNotice failure={load.failure} onRetry={reload} />}
      {load.status === 'loaded' && (
        <p className="mb-3 text-sm font-bold">
          {shipment ? shipmentLabels[shipment.status] : '배송지 미등록'}
        </p>
      )}
      {canEdit && (
        <form key={shipment?.updatedAt ?? 'new'} onSubmit={saveAddress} noValidate>
          <fieldset disabled={saving || saveBlocked} className="space-y-3 disabled:opacity-60">
            <legend className="sr-only">배송지 입력</legend>
            {addressFields.map(({ name, label, maxLength, autoComplete, ...field }) => (
              <label key={name} className="block text-sm font-semibold">
                {label}
                {'optional' in field && ' (선택)'}
                <input
                  name={name}
                  type="text"
                  inputMode={'inputMode' in field ? field.inputMode : undefined}
                  autoComplete={autoComplete}
                  required={!('optional' in field)}
                  maxLength={maxLength}
                  defaultValue={shipment?.[name] ?? ''}
                  className="mt-1 block min-h-11 w-full rounded-lg border border-[#d9dcd2] px-3 text-base font-normal"
                />
              </label>
            ))}
            <button
              type="submit"
              className="min-h-11 w-full rounded-xl bg-[#a8ff00] px-4 text-sm font-extrabold"
            >
              {saving ? '저장하는 중…' : '배송지 저장'}
            </button>
          </fieldset>
        </form>
      )}
      {shipment && !canEdit && (
        <dl className="space-y-2 text-sm">
          {shipment.status !== 'READY' && (
            <>
              <div>
                <dt className="font-bold">택배사</dt>
                <dd className="break-words">{shipment.carrier || '—'}</dd>
              </div>
              <div>
                <dt className="font-bold">운송장 번호</dt>
                <dd className="break-words">{shipment.trackingNumber || '—'}</dd>
              </div>
            </>
          )}
          {addressFields.map(
            ({ name, label }) =>
              shipment[name] && (
                <div key={name}>
                  <dt className="font-bold">{label}</dt>
                  <dd className="break-words">{shipment[name]}</dd>
                </div>
              ),
          )}
        </dl>
      )}
    </section>
  );
}
