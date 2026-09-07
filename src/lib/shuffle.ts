/** Fisher-Yates shuffle. */
export function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex--) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    const temp = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex] as T;
    shuffled[randomIndex] = temp as T;
  }
  return shuffled;
}
