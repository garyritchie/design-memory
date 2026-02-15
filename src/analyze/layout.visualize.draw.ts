export function drawBox(
  grid: string[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string
): void {
  const width = x2 - x1;
  const height = y2 - y1;

  if (width < 2 || height < 2) return;

  for (let x = x1 + 1; x < x2; x++) {
    if (y1 >= 0 && y1 < grid.length && x >= 0 && x < grid[0]!.length) {
      grid[y1]![x] = '─';
    }
    if (y2 >= 0 && y2 < grid.length && x >= 0 && x < grid[0]!.length) {
      grid[y2]![x] = '─';
    }
  }

  for (let y = y1 + 1; y < y2; y++) {
    if (y >= 0 && y < grid.length) {
      if (x1 >= 0 && x1 < grid[0]!.length) grid[y]![x1] = '│';
      if (x2 >= 0 && x2 < grid[0]!.length) grid[y]![x2] = '│';
    }
  }

  if (x1 >= 0 && x1 < grid[0]!.length && y1 >= 0 && y1 < grid.length) grid[y1]![x1] = '┌';
  if (x2 >= 0 && x2 < grid[0]!.length && y1 >= 0 && y1 < grid.length) grid[y1]![x2] = '┐';
  if (x1 >= 0 && x1 < grid[0]!.length && y2 >= 0 && y2 < grid.length) grid[y2]![x1] = '└';
  if (x2 >= 0 && x2 < grid[0]!.length && y2 >= 0 && y2 < grid.length) grid[y2]![x2] = '┘';

  if (label && width > 4 && height > 2) {
    const labelY = y1 + 1;
    const labelText = label.slice(0, width - 2);
    if (labelY >= 0 && labelY < grid.length) {
      for (let i = 0; i < labelText.length && x1 + 1 + i < x2; i++) {
        if (x1 + 1 + i >= 0 && x1 + 1 + i < grid[0]!.length) {
          grid[labelY]![x1 + 1 + i] = labelText[i] ?? ' ';
        }
      }
    }
  }
}

export function getLabel(selector: string): string {
  return selector.slice(0, 20);
}
