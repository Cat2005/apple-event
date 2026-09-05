import type { Metadata } from "next";
import { PhoneScreen } from "@/components/phone/PhoneScreen";

export const metadata: Metadata = { title: "Apple Watch Party | Vote" };

export default function Page() {
  return <PhoneScreen />;
}
