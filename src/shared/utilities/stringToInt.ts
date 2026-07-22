export default (str?: string) => {
  const num = str != null ? parseInt(str, 10) : NaN;
  return isNaN(num) ? undefined : num;
}
