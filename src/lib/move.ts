/** Ro'yxat elementini bir pog'ona yuqoriga (-1) yoki pastga (+1) suradi; chetdan chiqmaydi */
export function moveInList<T>(list: T[], index: number, delta: -1 | 1): void {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}
