import type { Metadata } from "next";
import { PresenterScreen } from "@/components/presenter/PresenterScreen";

export const metadata: Metadata = { title: "Apple Watch Party | Present" };

export default function Page() {
  return <PresenterScreen />;
}
