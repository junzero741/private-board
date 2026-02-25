# Technical Design

## 데이터 모델

```typescript
interface Post {
  id: string;            // 내부 관리용 ID
  slug: string;          // URL용 고유 식별자 (예: a1b2c3d4e5f6)
  title: string;         // 게시글 제목
  content: string;       // 에디터에서 생성된 HTML 스트링
  passwordHash: string;  // 해싱된 비밀번호
  createdAt: Date;
  updatedAt: Date;
}
```

## 보안 설계

- **content는 비밀번호 검증이 서버에서 완료된 후에만 응답에 포함한다.**
- 비밀번호 검증 API와 본문 반환을 분리하지 않고 하나의 엔드포인트에서 처리한다.
- 비밀번호는 bcrypt로 해싱하여 DB에 저장한다.
- slug는 nanoid 등으로 추측 불가능하게 생성한다.

## 이미지 업로드 플로우

에디터 작성 중에는 이미지를 로컬 blob URL로 미리보기하고, 저장 시점에만 R2에 업로드한다.

```
1. 에디터에서 이미지 삽입 → blob URL로 로컬 렌더링 (R2 업로드 없음)
2. 저장 버튼 클릭
   → content HTML에서 blob URL 추출
   → 각 blob을 R2에 업로드 후 R2 URL 수신
   → content HTML 내 blob URL → R2 URL 교체
3. 최종 HTML을 서버에 POST하여 DB 저장
```

저장 전에 에디터에서 삭제된 이미지는 content HTML에 blob URL이 없으므로 R2에 업로드되지 않는다.

## 인프라

| 항목 | 결정 | 이유 |
|------|------|------|
| 이미지 스토리지 | Cloudflare R2 | Egress 비용 없음, 무료 티어 10GB |
