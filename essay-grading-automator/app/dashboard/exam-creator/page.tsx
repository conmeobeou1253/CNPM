"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ExamCreatorPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "exam_creator") {
      router.push("/dashboard/exam-creator/essays")
    } else {
      router.push("/dashboard")
    }
  }, [user, router])

  return <div>Redirecting...</div>
}
