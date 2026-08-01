import { useLocalSearchParams } from "expo-router";
import Index from "./index";
import { PortalRequiredScreen } from "../src/screens/PortalRequiredScreen";
import { isValidDefibJoinRequest } from "../src/services/staffAccess";

export default function JoinRoute() {
  const params = useLocalSearchParams<{
    sessionId?: string | string[];
    role?: string | string[];
  }>();
  if (!isValidDefibJoinRequest("/join", params.sessionId, params.role)) {
    return <PortalRequiredScreen />;
  }
  return <Index />;
}
