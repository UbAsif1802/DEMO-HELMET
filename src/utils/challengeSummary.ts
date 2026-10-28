export type ChallengeSummaryInput = {
  problem: string;
  affected: string;
  solution: string;
  features: string;
  assumptions: string;
};

export function validateChallengeSummaryInputs(input: ChallengeSummaryInput) {
  const missing = [
    ['problem', input.problem],
    ['affected', input.affected],
    ['solution', input.solution],
    ['features', input.features],
    ['assumptions', input.assumptions],
  ]
    .filter(([, value]) => !String(value).trim())
    .map(([field]) => field);

  if (missing.length > 0) {
    return {
      valid: false,
      message: `Please provide the required challenge details for: ${missing.join(', ')}.`,
    };
  }

  return { valid: true, message: null as string | null };
}

export function buildChallengeSummary(input: ChallengeSummaryInput): string {
  const parts = [
    'Problem or challenge',
    String(input.problem).trim(),
    '',
    'Who is affected and why it matters',
    String(input.affected).trim(),
    '',
    'Proposed MOOS solution',
    String(input.solution).trim(),
    '',
    'Key features and intended impact',
    String(input.features).trim(),
    '',
    'Assumptions, limitations, and what still needs validation',
    String(input.assumptions).trim(),
  ];

  return parts.join('\n\n');
}
