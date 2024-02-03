export default function formatNumber(
  value: number,
  fractionDigits = 2
): number {
  return Number(value.toFixed(fractionDigits));
}
