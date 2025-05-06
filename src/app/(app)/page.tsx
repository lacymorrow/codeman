import RepoBrowser from "@/components/RepoBrowser";
import { Space_Grotesk } from "next/font/google";

const font = Space_Grotesk({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export default function Page() {
  return <RepoBrowser />;
}
