const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function uploadImage(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob);

  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다.');
  const { url } = await res.json();
  return url;
}

export async function replaceBlobsWithUrls(html: string): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = Array.from(doc.querySelectorAll('img[src^="blob:"]'));

  await Promise.all(
    images.map(async (img) => {
      const src = (img as HTMLImageElement).src;
      const res = await fetch(src);
      const blob = await res.blob();
      const url = await uploadImage(blob);
      img.setAttribute('src', url);
    })
  );

  return doc.body.innerHTML;
}
