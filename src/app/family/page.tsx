import { redirect } from "next/navigation";

// The family/household view now lives inside the Dashboard, switched via the
// Personal | Family toggle. Keep this route as a redirect for old links/bookmarks.
export default function FamilyPage() {
  redirect("/");
}
