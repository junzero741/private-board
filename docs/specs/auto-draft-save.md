# 자동 임시저장 기능 명세서

## 개요

기존 수동 임시저장 버튼을 제거하고, 1분 간격으로 자동 임시저장되도록 변경한다.

## 동작 규칙

| 조건 | 동작 |
|------|------|
| `draftLoaded === false` | interval 미시작 (draft 복원 전 덮어쓰기 방지) |
| `step !== 'write'` | interval 중단 (완료 화면에서 불필요한 저장 방지) |
| `title`과 `content`가 모두 비어 있음 | 저장 스킵 |
| 위 조건 해당 없음 | IndexedDB에 저장, "임시 저장됨 HH:MM" 표시 |

## content 빈 값 기준

TipTap 에디터는 내용이 없을 때 `<p></p>`를 반환한다.
따라서 아래 두 조건이 모두 충족될 때 비어 있다고 판단한다:
- `title.trim() === ''`
- `content === ''` 또는 `content === '<p></p>'`

## UI 변경

- 수동 임시저장 버튼 제거
- 저장 성공 시 에디터 하단에 "임시 저장됨 HH:MM" 표시 유지

## 구현 범위

### 변경 파일
- `apps/frontend/src/app/page.tsx`

### 추출할 순수 함수
```typescript
// apps/frontend/src/lib/draft.ts
export function shouldAutoSave(title: string, content: string): boolean
```

### 제거
- `saving` state
- `handleSaveDraft` 함수
- 수동 임시저장 버튼 UI

### 추가
- `shouldAutoSave` 순수 함수 (`src/lib/draft.ts`)
- `autoSaveRef` + 60초 interval useEffect
