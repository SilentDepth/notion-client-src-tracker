export function extractVersion (input: string): string | undefined {
  return /\d+(\.\d+)+/.exec(input)?.[0]
}

export function compareVersion (a: string, b: string): number {
  const aNums = a.split('.').map(Number)
  const bNums = b.split('.').map(Number)
  for (const [idx, _a] of aNums.entries()) {
    const _b = bNums[idx]
    if (_b) {
      if (_a === _b) continue
      return Math.sign(_a - _b)
    } else {
      return 1
    }
  }
  return 0
}
