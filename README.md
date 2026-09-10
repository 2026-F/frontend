# ArtBid Frontend

## 서비스 소개

ArtBid는 작가·소규모 갤러리가 작품을 위탁 등록하면, 사전 관람(프리뷰) 기간을 거쳐
정해진 시각에 실시간 온라인 경매가 열리는 서비스입니다. 마감 30초 전 입찰이 들어오면
마감 시각이 자동 연장되는 **안티 스나이핑**이 핵심 규칙이고, 여기에 라이브 스트리밍과
3D/AR 작품 감상까지 웹앱 하나에서 제공합니다. (자세한 서비스 설명은 백엔드 레포 README 참고)

이 레포는 그중 **프론트엔드(웹앱)** 를 담당합니다. Next.js(App Router) 기반으로,
백엔드 API를 붙여서 구매자/판매자/관리자 화면을 구현합니다.

## 폴더 구조

```
frontend(repo)/
├── .github/
│   └── workflows/
│       └── ci.yml        # PR/main 푸시 시 lint + build 자동 체크
├── README.md
└── frontend/              # Next.js 앱 본체
```

```
frontend/
├── src/
│   ├── app/               # App Router 라우트・페이지
│   ├── lib/                # axios 인스턴스 등 공통 유틸 (api.ts)
│   └── types/               # 백엔드 ERD 기준 타입 정의 (Member, Artwork, AuctionEvent ...)
│       # components/, features/ 는 화면 작업 시작하면서 채워질 예정 (tailwind content 경로에 미리 잡아둠)
├── .env.local.example      # NEXT_PUBLIC_API_BASE_URL 등 환경변수 예시
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

`backend`가 도메인(기능) 기준으로 나뉘듯, 프론트도 화면/기능 단위로 `components/`,
`features/` 아래를 나눠갈 예정입니다. 지금은 초기 세팅만 된 상태입니다.

## 협업 규칙

백엔드 레포와 동일한 컨벤션을 사용합니다.

### 브랜치 전략

- `main` : 배포 가능한 상태만 유지. 직접 커밋 금지, PR로만 병합.
- `develop` : 기능들을 모으는 통합 브랜치. 스프린트 데모 전 여기서 통합 테스트.
- `feature/{화면 또는 기능}/{작업 내용}` : 실제 작업 브랜치.
  예) `feature/auction/lot-list-page`, `feature/auth/login-form`, `feature/mypage/wishlist`
- `fix/{작업 내용}` : 버그 수정 브랜치.

작업 순서: `develop`에서 `feature/...` 분기 → 작업 → PR로 `develop`에 병합 → 스프린트
마지막에 `develop` → `main` 병합.

### 커밋 컨벤션

Conventional Commits 형식을 사용합니다: `type: 내용 (한글 가능)`

- `feat` : 새 기능/화면 추가
- `fix` : 버그 수정
- `refactor` : 동작 변화 없는 코드 개선
- `style` : 포맷팅 등 코드 스타일 변경(로직 변화 없음)
- `docs` : 문서(README, 주석) 변경
- `chore` : 빌드 설정, 의존성 등 잡일

예) `feat: 경매 LOT 목록 페이지 구현`, `fix: 입찰가 유효성 검사 오류 수정`

### PR 규칙

- PR 제목도 커밋 컨벤션과 동일한 형식을 따릅니다.
- PR 본문에는 변경 내용, 관련 이슈/노션 문서 링크, 스크린샷(화면 작업인 경우)을 간단히 적습니다.
- 최대한 팀장이 PR을 확인한 후 병합합니다. 셀프 머지는 지양합니다.
- `main`, `develop`에는 강제 푸시(force push)를 하지 않습니다.

## 아직 안 채운 부분 (TODO)

- `src/components/`, `src/features/` — 실제 화면 컴포넌트 (Tailwind content 경로에는 미리 잡아둠)
- 로그인/인증 흐름 — `src/lib/api.ts`에 토큰 인터셉터 자리만 있고, 실제 로그인 폼/토큰 저장 로직 없음
- 경매 목록/상세, 입찰 폼 등 핵심 화면
- API 에러 공통 처리 (401 리다이렉트 등) — `src/lib/api.ts`의 response 인터셉터에 TODO로 표시됨
- 실시간 입찰가 갱신(SSE/WebSocket) 연동 지점
- 백엔드와 ID 타입(Long vs UUID) 합의 후 `src/types/index.ts` 재조정

## 로컬 실행

1. 저장소를 클론한 뒤 `frontend/` 폴더로 이동합니다.
   ```
   cd frontend
   ```
2. 환경변수 파일을 만듭니다.
   ```
   cp .env.local.example .env.local
   ```
   `NEXT_PUBLIC_API_BASE_URL`은 로컬에서 백엔드를 `localhost:8080`으로 띄운 경우 기본값 그대로 두면 됩니다.
3. 의존성 설치 후 개발 서버 실행
   ```
   npm install
   npm run dev
   ```
4. `localhost:3000` 접속

## 다음 단계

- IA(정보 구조)와 화면별 와이어프레임 우선순위는 노션/피그잼 문서에 정리되어 있습니다.
- 지금 이 커밋으로 완료된 건 Next.js 프로젝트 뼈대 + CI 설정뿐입니다.
- 다음부터는 화면 단위로 `feature/...` 브랜치를 따서 `components/`, `features/`를 채워나가면 됩니다.
