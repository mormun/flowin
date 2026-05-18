import { redirect } from "next/navigation"

// Redirige la raíz "/" al login automáticamente
export default function Home() {
  redirect("/login")
}