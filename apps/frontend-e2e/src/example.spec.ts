import { test, expect } from '@playwright/test';

test.describe('홈 페이지 - 글 작성', () => {
  test('페이지 제목이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('새 글 작성');
  });

  test('글 작성 폼이 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[placeholder="제목"]')).toBeVisible();
    await expect(page.locator('input[placeholder="비밀번호"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('저장');
  });

  test('에디터 툴바가 렌더링된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'B' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'H2' })).toBeVisible();
    await expect(page.getByRole('button', { name: '이미지' })).toBeVisible();
  });

  test('제목 없이 제출하면 에러가 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=제목을 입력해주세요.')).toBeVisible();
  });

  test('제목만 입력하고 제출하면 내용 에러가 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="제목"]').fill('테스트 제목');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=내용을 입력해주세요.')).toBeVisible();
  });

  test('제목과 내용 입력 후 비밀번호 없이 제출하면 에러가 표시된다', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="제목"]').fill('테스트 제목');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('테스트 내용');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=비밀번호를 입력해주세요.')).toBeVisible();
  });

  test('API 성공 시 링크 생성 화면으로 이동한다', async ({ page }) => {
    await page.route('**/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slug: 'test-slug-123' }),
      });
    });

    await page.goto('/');
    await page.locator('input[placeholder="제목"]').fill('테스트 제목');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('테스트 내용');
    await page.locator('input[placeholder="비밀번호"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('h1')).toHaveText('링크가 생성되었습니다');
    await expect(page.locator('input[readonly]')).toHaveValue(/test-slug-123/);
  });

  test('링크 생성 후 새 글 작성 버튼으로 초기화된다', async ({ page }) => {
    await page.route('**/posts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slug: 'test-slug-456' }),
      });
    });

    await page.goto('/');
    await page.locator('input[placeholder="제목"]').fill('테스트 제목');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('테스트 내용');
    await page.locator('input[placeholder="비밀번호"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('h1')).toHaveText('링크가 생성되었습니다');
    await page.getByRole('button', { name: '새 글 작성' }).click();
    await expect(page.locator('h1')).toHaveText('새 글 작성');
    await expect(page.locator('input[placeholder="제목"]')).toHaveValue('');
  });

  test('API 실패 시 에러 메시지가 표시된다', async ({ page }) => {
    await page.route('**/posts', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/');
    await page.locator('input[placeholder="제목"]').fill('테스트 제목');
    await page.locator('.ProseMirror').click();
    await page.keyboard.type('테스트 내용');
    await page.locator('input[placeholder="비밀번호"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=게시글 저장에 실패했습니다.')).toBeVisible();
  });
});

test.describe('게시글 페이지 - 비밀번호 인증', () => {
  test('비밀번호 입력 화면이 표시된다', async ({ page }) => {
    await page.goto('/some-slug');
    await expect(page.locator('h1')).toHaveText('비밀번호를 입력하세요');
    await expect(page.locator('input[placeholder="비밀번호"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('확인');
  });

  test('잘못된 비밀번호로 제출하면 에러가 표시된다', async ({ page }) => {
    await page.route('**/posts/some-slug/unlock', async (route) => {
      await route.fulfill({ status: 401 });
    });

    await page.goto('/some-slug');
    await page.locator('input[placeholder="비밀번호"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=비밀번호가 올바르지 않습니다.')).toBeVisible();
  });

  test('올바른 비밀번호로 제출하면 게시글이 표시된다', async ({ page }) => {
    await page.route('**/posts/some-slug/unlock', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ title: '테스트 게시글', content: '<p>내용입니다</p>' }),
      });
    });

    await page.goto('/some-slug');
    await page.locator('input[placeholder="비밀번호"]').fill('correctpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('h1')).toHaveText('테스트 게시글');
    await expect(page.locator('.prose')).toContainText('내용입니다');
  });

  test('존재하지 않는 게시글 접근 시 에러가 표시된다', async ({ page }) => {
    await page.route('**/posts/nonexistent/unlock', async (route) => {
      await route.fulfill({ status: 404 });
    });

    await page.goto('/nonexistent');
    await page.locator('input[placeholder="비밀번호"]').fill('anypassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=존재하지 않는 게시글입니다.')).toBeVisible();
  });
});
