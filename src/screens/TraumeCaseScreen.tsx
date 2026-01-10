// src/screens/TraumeCaseScreen.tsx
import type { CaseScenario } from "../domain/cases/types";
import CaseListScreen from "./CaseListScreen";

type UserProfile = {
  uid: string;
  displayName?: string;
  role?: string;
  orgId?: string;
};

export function TraumeCaseScreen(props: {
  profile: UserProfile | null;
  allCases: CaseScenario[];
  loadingCases: boolean;
  onBack: () => void;
  onPickCase: (c: CaseScenario) => void;
}) {
  return (
    <CaseListScreen
      title="Traumatiske cases"
      profile={props.profile}
      allCases={props.allCases}
      loadingCases={props.loadingCases}
      onBack={props.onBack}
      onPickCase={props.onPickCase}
    />
  );
}

export default TraumeCaseScreen;
