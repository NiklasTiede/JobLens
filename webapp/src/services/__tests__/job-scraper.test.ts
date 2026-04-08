import { describe, it, expect } from 'vitest';
// @ts-ignore
import { readFileSync } from 'node:fs';
// @ts-ignore
import { join, dirname } from 'node:path';
// @ts-ignore
import { fileURLToPath } from 'node:url';
import { extractJsonLdDescription } from '../job-scraper';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, '../../../testdata/fixtures');

describe('extractJsonLdDescription', () => {
  it('extracts job description from a real jobs.ch detail page', () => {
    const html = readFileSync(
      join(FIXTURES, 'search-software-engineer/job-detail-sample.html'),
      'utf-8',
    );
    const expectedDesc = readFileSync(
      join(FIXTURES, 'search-software-engineer/expected-description.txt'),
      'utf-8',
    );

    const result = extractJsonLdDescription(html);

    expect(result).not.toBeNull();
    expect(result).toBe(expectedDesc);
  });

  it('returns null for HTML without JSON-LD', () => {
    const html = '<html><body><h1>No structured data here</h1></body></html>';
    expect(extractJsonLdDescription(html)).toBeNull();
  });

  it('returns null for JSON-LD without JobPosting type', () => {
    const html = `<html><script type="application/ld+json">[{"@type":"BreadcrumbList"}]</script></html>`;
    expect(extractJsonLdDescription(html)).toBeNull();
  });

  it('handles non-array JSON-LD (single object)', () => {
    const html = `<html><script type="application/ld+json">{"@context":"http://schema.org/","@type":"JobPosting","title":"Test","description":"<p>Hello World</p>"}</script></html>`;
    const result = extractJsonLdDescription(html);
    expect(result).toBe('Hello World');
  });

  it('handles malformed JSON gracefully', () => {
    const html = `<html><script type="application/ld+json">{broken json</script></html>`;
    expect(extractJsonLdDescription(html)).toBeNull();
  });
});
