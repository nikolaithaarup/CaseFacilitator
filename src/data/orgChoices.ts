export type OrgChoice = {
  id: string;
  label: string;
  role: "student" | "school" | "enterprise";
};

export const ORG_CHOICES: OrgChoice[] = [
  { id: "student", label: "Elev", role: "student" },
  { id: "unord_hillerod", label: "U/Nord Hillerød", role: "school" },
  { id: "unord_esbjerg", label: "U/Nord Esbjerg", role: "school" },
  { id: "akutberedskabet", label: "Akutberedskabet", role: "enterprise" },
  { id: "falck", label: "Falck", role: "enterprise" },
];
