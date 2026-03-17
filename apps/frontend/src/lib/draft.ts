export function shouldAutoSave(title: string, content: string): boolean {
  const emptyContent = content === '' || content === '<p></p>';
  return title.trim() !== '' || !emptyContent;
}
