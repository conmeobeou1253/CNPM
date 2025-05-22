"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function TeacherPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "teacher") {
      router.push("/dashboard/teacher/assignments")
    } else {
      router.push("/dashboard")
    }
  }, [user, router])

  return <div>Redirecting...</div>
}
