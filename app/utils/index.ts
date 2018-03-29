
export function sleep(timeout: number = 0) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

export function fetchImage(url: string) {
  const img = new Image();
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = e => resolve(img);
    img.onerror = e => reject(e);
    img.src = url;
  });
}