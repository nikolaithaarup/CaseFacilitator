import { useRouter } from "expo-router";
import { ProfileScreen } from "../src/screens/ProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();

  return (
    <ProfileScreen
      onBack={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
      }}
      // Remove until you create /profile-edit
      // onEdit={() => router.push("/profile-edit")}
    />
  );
}
