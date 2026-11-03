# FE #52 실제 데이터 연결과 개발 환경 준비

- 작성일: 2026-11-03
- 관련 이슈: [FE #52](https://github.com/2026-F/frontend/issues/52), [BE #98](https://github.com/2026-F/Artbid/issues/98), [BE #99](https://github.com/2026-F/Artbid/issues/99)
- 브랜치: `fix/52-real-artwork-data`. 작업 브랜치에서 구현하고 배포 전 검증을 진행했다.

## 목적

팀원과 멘토가 보는 개발·시연 서비스에서 실제 API 데이터와 미제공 기능을 구분한다.

## 핵심 요청

요약: 승인한 1~4단계를 구현한다. 로컬 DB의 실제 작품과 경매로 검증하며 자동 목데이터 대체와 가상 경매를 제거한다. 로그인 입찰/입찰 이력/SSE/폴링 개선인 #53은 제외한다. 이후 사용자가 커밋과 PR 생성을 요청했고, 기록의 목적과 핵심 요청은 템플릿대로 분리하도록 요청했다.

> #52는 로컬 검증 결과를 남기되 배포 검증 전에는 닫지 않는다.

## 선택과 이유

작품과 경매는 서로 다른 자료다. 작품은 경매 없이도 존재할 수 있다. 경매 URL의 숫자는 경매 ID다. 예를 들어 검증 데이터에서는 경매 12가 작품 17을 가리켰다.

1. 목록은 작품 페이지를 가져온다. 각 작품의 auctionId가 있을 때만 해당 경매를 조회한다.
2. 경매 상세는 경매 → 응답의 artworkId → 작품 순서로 가져온다.
3. 작품 상세는 작품 → 응답의 auctionId → 경매 순서로 가져온다. 쿼리의 auctionId는 신뢰하지 않는다.
4. 연결 경매가 없으면 작품 프리뷰와 시작가만 보여주고 입찰을 제공하지 않는다. 조회 실패는 경매 없음으로 처리하지 않고 오류/재시도를 표시한다.

경매 선택은 기존 목록 규칙인 가장 큰 경매 ID다. 종료는 낙찰의 증거가 아니므로 가격은 '최종 표시가'로 표시한다. 낙찰/유찰 판정은 후속 거래 검증에 남긴다. 상태 필터는 서버의 현재 작품 페이지 안에서 동작한다는 설명을 표시한다.

프로모션 문구/배너는 편집 콘텐츠다. 현재 출품 연결은 모두 비워 두고 준비 중으로 표시한다. `mock.ts`는 실행 화면에서 참조하지 않으며 기존 참고 데이터의 타입 호환 필드만 추가했다. 새 `dev-artwork.svg`는 명시적으로 생성한 로컬 준비 작품의 이미지다. API 장애 시 이 이미지나 작품을 대체 표시하지 않는다.

## 반영 내용

### 1단계 검토 결과

배포 사이트 `https://artbid-chi.vercel.app`는 조회만 했다. 홈의 실제 작품과 고정 LIVE 편성, `/live/1`의 시청자 128명 등 고정 표시를 브라우저로 확인했다. 그 외 경로의 데이터 출처와 계약은 로컬 소스로 검토했다. 배포 데이터는 수정하지 않았다. Notion 발표 자료는 이번 구현의 확인 근거로 사용하지 않았다.

| 위치 | 기존 문제 | 반영 방향 |
| --- | --- | --- |
| `lib/lots.ts`, 홈/목록/카테고리 | 조회 실패/빈 데이터에서 목데이터 또는 가상 경매 조립. 페이지 정보 소실 | API 실패를 전파하고 nullable 경매와 페이지 메타데이터 유지 |
| 경매 상세 | 작품 목록에서 ID를 찾는 구조로 작품/경매 ID 혼동 | 경매 ID로 조회한 응답의 artworkId로 상세 조회 |
| 작품 상세 | 연결 경매 계약이 없어 쿼리스트링이나 추정 연결에 의존 | BE의 nullable auctionId만 사용. 임의 쿼리 무시 |
| 목록/상세 이미지 | 목록 imageUrl과 상세 PHOTO 미디어 우선순위가 다름 | BE가 같은 대표 이미지를 반환 |
| 프로모션/LIVE | 샘플 작품/방송을 실제 서비스처럼 연결 | 편집 콘텐츠 유지, 실제 출품 미연결은 준비 중 |
| 3D/공간 미리보기 | API 실패 시 샘플 작품/모델 대체 | 실제 모델 또는 실제 사진을 입힌 평면 모델만 사용 |
| 회원 통계/관심/알림 | 고정 숫자와 미동작 동작 표시 | 위치를 유지하며 준비 중/비활성화 |
| API 환경변수 | 서버 렌더링과 브라우저 주소 혼용 | 서버 BACKEND_ORIGIN, 브라우저 NEXT_PUBLIC_API_BASE_URL |

### 변경 파일과 코드 리뷰 순서

| 순서 | 주요 경로 | 확인할 점 |
| --- | --- | --- |
| 1 | `frontend/src/types/index.ts`, `frontend/src/lib/api.ts` | 상세 auctionId, nullable CatalogItem, 페이지 응답, 서버/브라우저 주소 |
| 2 | `frontend/src/lib/lots.ts` | 작품과 경매 결합, 잘못된 연결 거절, 조회 실패 유지 |
| 3 | `frontend/src/lib/catalogDisplay.ts`, `frontend/src/components/AuctionCard.tsx`, `ArtworkImage.tsx` | 가격/상태/이미지와 상세 링크의 공통 규칙 |
| 4 | `frontend/src/app/auctions/[id]/page.tsx`, `frontend/src/app/artworks/[id]/page.tsx` | 경매 ID와 작품 ID의 조회 순서, 입찰 제공 조건 |
| 5 | `frontend/src/app/auctions/page.tsx`, `frontend/src/app/categories/page.tsx`, `PageNavigation.tsx`, `AuctionListClient.tsx` | 페이지 이동, 현재 페이지 필터, 빈 목록 |
| 6 | `frontend/src/lib/requestFailure.ts`, `DataNotice.tsx`, `frontend/src/app/not-found.tsx` | 404/403/통신 장애 구분과 재시도 |
| 7 | `frontend/src/lib/artworkModel.ts`, 작품 `viewer/page.tsx`, `preview/page.tsx`, `ArtworkModelViewer.tsx`, `SpacePreview.tsx` | 샘플 대체 제거, 실제 사진 평면 모델, 미디어 오류 |
| 8 | 홈, 프로모션, LIVE, 마이페이지, 검색/알림 페이지, `NotifyButton.tsx`, `PromotionCarousel.tsx`, `promotions.ts` | 실제 미제공 기능의 준비 중 표시 |
| 9 | `frontend/src/components/BidPanel.tsx` | 목 입찰 로그 제거와 가격 표시 호환 수정만 수행. 로그인 입찰/이력/SSE는 #53 |

혼합매체의 표시 이름도 `frontend/src/lib/categories.ts`에서 회화와 구분했다.

추가 파일: `frontend/.env.local.example`, `frontend/public/dev-artwork.svg`, 본 기록 및 `docs/screenshots/issue52-2026-11-03/`.

### 실행

프론트 저장소 내부 `frontend/`에서 실행한다.

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

로컬 `.env.local`의 브라우저 주소는 `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`, 서버 주소는 `BACKEND_ORIGIN=http://localhost:8080`으로 설정한다. 서버 주소에는 서버에서 실제 도달 가능한 주소를 사용한다. NEXT_PUBLIC 값은 빌드에 포함되므로 배포 환경 변경 시 다시 빌드해야 한다. 실제 환경 파일은 커밋하지 않는다.

백엔드 저장소 루트의 `npm run dev:seed`, `dev:auction:new`, `dev:auction:closing`, `dev:cleanup` 사용법은 상대 저장소의 `docs/local-dev-data.md`에 기록했다. 화면에 임의 데이터를 만드는 방식이 아니라 실제 로컬 API를 거쳐 DB에 넣는 도구다.

## 검증

| 구분 | 항목 | 결과 |
| --- | --- | --- |
| 정적 검사/빌드 | lint, TypeScript, Next 프로덕션 빌드 | 통과. img 최적화와 기존 폰트 경고는 남아 있다. |
| 실제 로컬 API/SSR | 작품 17 ↔ 경매 12 등 다른 ID | 동일 제목과 가격, 올바른 작품 상세 링크 확인 |
| 실제 로컬 API/브라우저 | 경매 없는 작품 14, 직접 진입과 잘못된 auctionId 쿼리 | 작품 프리뷰 유지, 입찰 링크 없음 |
| 실제 로컬 API/SSR | size=2로 모든 페이지 순회 | 중복 없이 전체 작품 접근. 목록/상세 auctionId와 imageUrl 일치 |
| 실제 API/브라우저 | 관리자/판매자 회귀 | 실제 로그인 후 관리자 작품·경매 목록, 판매자 프로필 등록 폼과 작품 등록 폼 표시 확인. 제출/거래는 수행하지 않음 |
| 실제 로컬 API/브라우저 | 카테고리 다음 페이지 | category와 size 유지, 진행/시작 전 작품 표시 |
| 실제 API/브라우저 | 없는 작품, 잘못된 경매 URL | 404 안내. 목데이터 없음 |
| 실제 API/브라우저 | 사진 있는 작품의 3D | 실제 사진이 평면 모델에 표시됨 |
| 실제 API/브라우저 | 이미지 없는 작품의 공간 미리보기 | 미디어 없음 안내, 샘플 모델 없음 |
| 응답 주입 | 별도 localhost:18080 API와 3001 프론트에서 empty/403/404/500/연결 끊김 | 빈 목록/권한/없는 정보/서버 오류/통신 장애 안내. 가짜 카드 링크 없음 |
| 응답 주입/브라우저 | 연결 장애 → 빈 정상 응답으로 변경 후 다시 시도 | 오류 화면에서 빈 목록으로 복구 |
| 준비 도구 | seed 반복, 새 경매, 2분 경매, 정리 | 실제 API 실행 성공. 준비 데이터만 삭제하고 이전 작품 보존 |

검증 스크립트와 결과는 작업 공간 `D:/team-f/tmp/issue52-verify.mjs`, `issue52-error-api.mjs`, `issue52-verification.json`에 남겼다. 자동 브라우저 E2E 테스트를 추가한 것은 아니다. 스크립트의 실제 데이터 검증은 manifest를 사용하므로 정리 전 데이터를 기준으로 실행한다. 스크린샷의 데이터는 검증 후 정리했다.

## 남은 작업

- 빈 **실제 DB**는 초기화하지 않았다. 빈 목록은 별도 응답 서버로 검증했다. 403도 주입 검증이며 BE 권한 보안 검증 완료를 의미하지 않는다.
- 실제 미디어 업로드, 모바일 실기기, 카메라 허용/거절, 사진 합성 저장과 외부 이미지 CORS는 미검증이다. 평면 모델 렌더링과 미디어 없는 화면만 확인했다.
- #53의 로그인 기반 입찰, 서버 입찰 이력, SSE 재연결/폴링은 미구현이다. 기존 데모 입찰자 ID 입력과 실시간 로그 동작은 남아 있다.
- BE #94~96의 인증/권한/거래 처리는 수정하지 않았다. 관리자와 판매자 화면의 UI 진입 검증을 서버 보안 검증으로 해석하지 않는다.
- 목록의 경매 정보는 현재 연결 경매별 API 호출을 사용한다. BE 미디어 N+1은 해소했지만 FE 경매 일괄 조회 API는 이번 범위에 없다.
- 기존 백엔드 전체 통합 테스트가 로컬 DB에 남긴 데이터와 첫 manifest는 보존했다. 정확한 상태는 BE `docs/local-dev-data.md`에 기록했다.
- 배포 후 FE/BE 응답 계약과 환경변수, 실제 이미지 URL을 함께 검증해야 한다. #52는 닫지 않는다.

### 이슈와 작업 상태

BE #98과 #99를 생성하고 FE #52에 연결했다. 1단계 검토는 이 기록에 포함했으며 별도 이슈를 만들지 않았다. 기존 미커밋 기록과 파일은 보존했다. GitHub에 관련 이슈를 생성하고 연결했다.

최종 확인: 관리자/판매자 검증 계정·작품·경매도 정리했다. 다른 테스트 작품이 참조하는 작가 3은 보존했으며 별도 manifest에 기록했다. 실제 FE localhost:3000와 BE localhost:8080는 실행 상태로 두었고 오류 주입용 3001/18080 서버는 종료했다. FE는 검증한 프로덕션 빌드의 `next start`로 실행 중이다. 코드 수정 시 개발 서버로 다시 실행한다.
