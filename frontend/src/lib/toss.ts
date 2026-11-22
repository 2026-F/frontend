// 토스페이먼츠 결제창(API 개별 연동, SDK v2)을 띄운다.
//
// npm 패키지를 설치하지 않고, 토스 공식 스크립트를 결제할 때 한 번만 불러온다.
// 결제창이 성공하면 successUrl(/payments/success)로, 취소·실패하면 failUrl(/payments/fail)로 이동한다.
// 환경(PC 팝업 등)에 따라 이동 대신 Promise가 에러로 끝날 수도 있어서, 호출하는 쪽에서 catch도 처리해야 한다.

const SDK_URL = 'https://js.tosspayments.com/v2/standard';

interface TossPaymentRequest {
  method: 'CARD';
  amount: { currency: 'KRW'; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
}

interface TossPaymentsInstance {
  payment: (options: { customerKey: string }) => {
    requestPayment: (request: TossPaymentRequest) => Promise<unknown>;
  };
}

interface TossPaymentsSdk {
  (clientKey: string): TossPaymentsInstance;
  /** 비회원 결제용 customerKey */
  ANONYMOUS: string;
}

declare global {
  interface Window {
    TossPayments?: TossPaymentsSdk;
  }
}

let sdkLoading: Promise<TossPaymentsSdk> | null = null;

// 스크립트를 한 번만 넣는다. 실패하면 다음 시도에서 다시 불러올 수 있게 초기화한다.
function loadSdk(): Promise<TossPaymentsSdk> {
  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  if (!sdkLoading) {
    sdkLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.onload = () =>
        window.TossPayments
          ? resolve(window.TossPayments)
          : reject(new Error('토스 결제 모듈을 불러오지 못했습니다.'));
      script.onerror = () => {
        sdkLoading = null;
        reject(new Error('토스 결제 모듈을 불러오지 못했습니다. 네트워크를 확인해 주세요.'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkLoading;
}

/** 토스 클라이언트 키가 설정돼 있는지. 없으면 결제 요청을 만들기 전에 막는다. */
export function isTossConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
}

/** 토스 SDK가 던진 에러면 code(예: USER_CANCEL)를 꺼낸다. */
export function tossErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

export async function openTossCheckout(params: {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
}): Promise<void> {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error('결제 설정(토스 클라이언트 키)이 없습니다. 관리자에게 문의해 주세요.');
  }
  const TossPayments = await loadSdk();
  const payment = TossPayments(clientKey).payment({ customerKey: TossPayments.ANONYMOUS });
  await payment.requestPayment({
    method: 'CARD',
    // 금액은 서버가 결제 요청을 만들 때 정한 값을 그대로 쓴다. 승인할 때도 서버가 DB 금액으로 다시 검사한다.
    amount: { currency: 'KRW', value: params.amount },
    orderId: params.orderId,
    orderName: params.orderName.slice(0, 100), // 토스 주문명 최대 100자
    successUrl: `${window.location.origin}/payments/success`,
    failUrl: `${window.location.origin}/payments/fail`,
    customerEmail: params.customerEmail,
    customerName: params.customerName,
  });
}
