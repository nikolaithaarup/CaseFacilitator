// src/screens/HlrCaseScreen.tsx
import type { CaseScenario } from "../domain/cases/types";
import CaseListScreen from "./CaseListScreen";

type UserProfile = {
  uid: string;
  displayName?: string;
  role?: string;
  orgId?: string;
};

export function HlrCaseScreen(props: {
  profile: UserProfile | null;
  allCases: CaseScenario[];
  loadingCases: boolean;
  onBack: () => void;
  onPickCase: (c: CaseScenario) => void;
}) {
  return (
    <CaseListScreen
      title="HLR"
      profile={props.profile}
      allCases={props.allCases}
      loadingCases={props.loadingCases}
      onBack={props.onBack}
      onPickCase={props.onPickCase}
    />
  );
}

export default HlrCaseScreen;
