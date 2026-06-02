import { redirect } from "next/navigation";

export default function LegacySubmitRedirectPage() {
  redirect("/complaints/new");
}
