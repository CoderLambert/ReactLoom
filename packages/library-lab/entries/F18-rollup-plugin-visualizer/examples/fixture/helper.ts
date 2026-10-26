export function summarize(values: number[]) {
  return {
    count: values.length,
    sum: values.reduce((total, current) => total + current, 0),
  };
}
