import { AdminScreen } from "@/components/admin/AdminScreen";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AdminScreen token={token} />;
}
