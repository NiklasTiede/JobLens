export const EXTRACT_PROFILE_SYSTEM_PROMPT = `You receive the text of a LinkedIn profile exported as PDF.
Extract all relevant information as JSON with the following schema:
{
  "name": string,
  "location": string,
  "title": string,
  "summary": string,
  "skills": string[],
  "experience": [{ "company": string, "role": string, "duration": string, "description": string, "technologies": string[] }],
  "education": [{ "institution": string, "degree": string, "grade": string | null }],
  "years_of_experience": number,
  "certifications": string[],
  "languages": string[]
}

Rules:
- Infer technologies from descriptions even if not explicitly listed as skills.
- years_of_experience: SUM the duration of ALL jobs listed. E.g. Job A "May 2022 - Mar 2024" (1.8y) + Job B "May 2024 - Apr 2026" (1.9y) = 3.7, round to 4. Do NOT use only the most recent job.
- Reply ONLY with valid JSON, no markdown, no explanation.`;

export function buildExtractProfileUserMessage(pdfText: string): string {
  return `LinkedIn Profile Text:\n\n${pdfText}`;
}
