export function formatNumberInfinite(num: number): string {
  if (num < 1000) return num.toFixed(2).replace(/\.00$/, '');
  
  const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td"];
  const suffixNum = Math.floor(Math.log10(num) / 3);
  
  if (suffixNum < suffixes.length) {
    const shortValue = num / Math.pow(10, suffixNum * 3);
    return shortValue.toFixed(2).replace(/\.00$/, '') + suffixes[suffixNum];
  }
  
  return num.toExponential(2);
}
