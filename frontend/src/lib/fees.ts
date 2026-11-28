// 낙찰 시 결제 금액을 미리 보여주기 위한 계산.
// 실제 청구액은 백엔드 AuctionClosingService(PREMIUM_RATE, SHIPPING_FEE)가 낙찰 시점에 정한다.
// 서버 값이 바뀌면 여기도 함께 바꿔야 하므로 화면에는 항상 "예상" 금액으로 표시한다.
export const BUYER_PREMIUM_RATE = 0.1;
export const SHIPPING_FEE = 30_000;

export function estimatePayment(bidPrice: number) {
  const premiumFee = Math.round(bidPrice * BUYER_PREMIUM_RATE);
  return {
    bidPrice,
    premiumFee,
    shippingFee: SHIPPING_FEE,
    total: bidPrice + premiumFee + SHIPPING_FEE,
  };
}
