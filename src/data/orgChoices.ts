export interface OrgChoice {
  id: string;
  label: string;
  role: string;
}

// This legacy screen is not part of the active route flow. Organisation data
// now comes from the authenticated user profile rather than a client-side list.
export const ORG_CHOICES: OrgChoice[] = [];
