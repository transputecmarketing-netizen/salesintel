import { redirect } from "next/navigation";

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Redirect target detail to the company page for a unified experience
  redirect(`/company/${id}`);
}
