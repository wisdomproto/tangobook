# 탱고북 저작도구 - Claude Code 프로젝트 가이드

## 프로젝트 개요
AI 기반 유아동 동화책 저작도구. Gemini AI로 스토리/이미지/TTS를 자동 생성.

## 기술 스택
- **Monorepo**: pnpm workspaces (`packages/client`, `packages/server`, `packages/shared`)
- **Frontend**: React 18 + TypeScript + Vite + TanStack Query v5 + Zustand v5 + TailwindCSS v3
- **Backend**: Express v5 + TypeScript + tsx (dev)
- **AI**: Google Gemini 2.5 Flash (텍스트), Gemini 3 Pro Image (이미지)
- **Storage**: Cloudflare R2 (S3 호환)

## 폴더 구조 요약
```
packages/
  shared/src/
    types/storybook.ts    # 핵심 도메인 타입 (Storybook, Character, Page 등)
    types/api.ts          # ApiResponse<T> 공통 응답 타입
    constants/index.ts    # 공유 상수 (ART_STYLES, TARGET_AGES 등)

  server/src/
    config/index.ts       # 환경변수 (requireEnv로 필수값 검증)
    routes/               # Express 라우터 (URL 매핑만)
    controllers/          # req 파싱 → 서비스 호출 → res 응답
    services/             # 비즈니스 로직 (핵심 레이어)
    repositories/r2.repository.ts  # R2 CRUD
    providers/            # 외부 API 클라이언트 (Gemini, R2)
    middleware/error.middleware.ts # 중앙 에러 핸들러

  client/src/
    lib/axios.ts          # apiGet/apiPost/apiDelete 헬퍼
    lib/query-client.ts   # TanStack Query 설정
    store/editor.store.ts # Zustand (UI 상태만)
    router/index.tsx      # React Router 라우트 정의
    pages/                # 라우트 페이지 (thin wrapper)
    features/             # 기능별 모듈 (아래 참조)
```

## 백엔드 레이어 규칙
```
Request → routes → controllers → services → repositories/providers
```
- **routes**: router.get/post/delete만. 로직 없음.
- **controllers**: req.body/params 파싱, try/catch, next(err) 패턴
- **services**: 비즈니스 로직. AppError 던지기.
- **repositories**: R2 데이터 접근만.
- **providers**: Gemini/R2 SDK 클라이언트. 싱글톤.

### API 응답 형식 (항상 통일)
```typescript
// 성공
res.json({ success: true, data: result });

// 실패 (errorMiddleware가 처리)
throw new AppError(404, '동화책을 찾을 수 없습니다.');
```

## 프론트엔드 상태관리 규칙
- **TanStack Query**: 서버 데이터 (storybooks 목록, 단일 storybook)
- **Zustand** (`store/editor.store.ts`): UI 상태만 (selectedStorybookId, activeTab, 모달)
- **절대 금지**: Zustand에 서버 데이터 저장 (중복/불일치 발생)

### API 호출 패턴
```typescript
// features/storybook/api/storybook.api.ts
import { apiGet, apiPost } from '@/lib/axios';

export const storybookApi = {
  list: () => apiGet<StorybookSummary[]>('/storybooks'),
  getById: (id: string) => apiGet<Storybook>(`/storybooks/${id}`),
};

// features/storybook/hooks/useStorybooks.ts
export function useStorybooks() {
  return useQuery({ queryKey: ['storybooks'], queryFn: storybookApi.list });
}
```

## Feature 모듈 구조 (각 기능별로 동일)
```
features/{feature}/
  components/   # UI 컴포넌트
  hooks/        # useQuery/useMutation 래퍼
  api/          # axios 호출 함수
  index.ts      # public exports
```

## 새 Feature 추가 방법
1. `features/{name}/api/{name}.api.ts` - API 함수 정의
2. `features/{name}/hooks/use{Name}.ts` - TanStack Query 훅
3. `features/{name}/components/` - UI 컴포넌트
4. `features/{name}/index.ts` - exports

## 주요 타입 위치
- `Storybook`, `Character`, `Page`, `KeyObject` → `@tangobook/shared`
- `ApiResponse<T>` → `@tangobook/shared`
- `AppError` → `packages/server/src/middleware/error.middleware.ts`

## 자주 쓰는 커맨드
```bash
# 개발 서버 (client + server 동시)
pnpm dev

# 타입체크 (모든 패키지)
pnpm typecheck

# 빌드
pnpm build

# 린트
pnpm lint

# 특정 패키지만
pnpm --filter server dev
pnpm --filter client dev
pnpm --filter shared build
```

## 환경변수
`packages/server/.env.example` 참고. `.env` 파일을 `packages/server/` 안에 생성.

## 기존 R2 데이터 호환성
- 기존 60권의 동화책이 R2에 저장되어 있음
- `shared/types/storybook.ts`의 `Storybook` 인터페이스가 기존 JSON 구조와 호환
- 새 필드 추가 시 `optional`로 선언하여 하위 호환성 유지

## 코딩 컨벤션
- 파일명: PascalCase (컴포넌트), camelCase (훅/유틸/API)
- 컴포넌트: named export (pages는 default export)
- 에러: AppError(status, message) 사용. console.error 대신 throw
- 주석: 자명한 코드에는 주석 불필요. 복잡한 로직에만 추가
- import: `@tangobook/shared`는 shared 타입, `@/`는 client 내부
