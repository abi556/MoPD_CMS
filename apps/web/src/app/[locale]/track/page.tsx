import { redirect } from "next/navigation";

export default function LegacyTrackRedirectPage() {
  redirect("/complaints/track");
}
