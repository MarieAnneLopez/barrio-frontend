import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8');
const runnerCss = read('bar-runner.css');

describe('la Mini Marie de la barra, en su sitio', () => {
  // Auditoría MM-06: como la grande, se apoyaba sobre el hueco del interlineado (~9 px más arriba).
  it('de pie sobre la barra: sin hueco de interlineado bajo ella', () => {
    expect(runnerCss).toMatch(/\.bar-runner \{[^}]*line-height: 0;/);
  });
});
