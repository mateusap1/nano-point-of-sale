export default function (num: number): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    minimumIntegerDigits: 2,
  });
}
