"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "admin") {
      router.push("/dashboard/admin/users")
    } else {
      router.push("/dashboard")
    }
  }, [user, router])

  return <div>Redirecting...</div>
}
