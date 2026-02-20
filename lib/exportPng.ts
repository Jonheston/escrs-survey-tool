import { toPng } from "html-to-image";

export async function exportChartPng(el: HTMLElement, filename: string) {
  const dataUrl = await toPng(el, {
    cacheBust: true,
    pixelRatio: 2
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
