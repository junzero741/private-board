import { shouldAutoSave } from './draft';

describe('shouldAutoSave', () => {
  it('title과 content가 모두 비어 있으면 false를 반환한다', () => {
    expect(shouldAutoSave('', '')).toBe(false);
  });

  it('content가 TipTap 빈 값(<p></p>)이고 title도 비어 있으면 false를 반환한다', () => {
    expect(shouldAutoSave('', '<p></p>')).toBe(false);
  });

  it('title만 있으면 true를 반환한다', () => {
    expect(shouldAutoSave('제목', '')).toBe(true);
  });

  it('content만 있으면 true를 반환한다', () => {
    expect(shouldAutoSave('', '<p>내용</p>')).toBe(true);
  });

  it('title과 content가 모두 있으면 true를 반환한다', () => {
    expect(shouldAutoSave('제목', '<p>내용</p>')).toBe(true);
  });

  it('title이 공백만 있으면 비어 있는 것으로 처리한다', () => {
    expect(shouldAutoSave('   ', '')).toBe(false);
  });
});
