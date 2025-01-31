import { permanentRedirect } from "next/navigation";

export default function Home() {
  return (
    permanentRedirect("https://poring.xyz")
  );
}
