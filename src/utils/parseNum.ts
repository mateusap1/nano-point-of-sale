export default function (
  num: number,
  fractionDigits = 2,
  integerDigits = 1
): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    minimumIntegerDigits: integerDigits,
  });
}
