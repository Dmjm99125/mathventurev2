export function getBoundedAdditionOperands(): [number, number] {
  const first = Math.floor(Math.random() * 5) + 1;
  const second = Math.floor(Math.random() * 5) + 1;
  return [first, second];
}

export function getBoundedSubtractionOperands(): [number, number] {
  const first = Math.floor(Math.random() * 11);
  const second = Math.floor(Math.random() * (first + 1));
  return [first, second];
}
