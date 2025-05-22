"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow dark:bg-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Essay Grading Automator</h1>
          <div className="space-x-4">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Automated Essay Grading System</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              A comprehensive platform for creating, assigning, submitting, and grading essays with automated feedback.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6 shadow-sm dark:border-gray-700">
              <h3 className="text-xl font-bold">For Exam Creators</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Create essay templates and define grading criteria for automated assessment.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm dark:border-gray-700">
              <h3 className="text-xl font-bold">For Teachers</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Assign essays to students, review automated grades, and provide feedback.
              </p>
            </div>
            <div className="rounded-lg border p-6 shadow-sm dark:border-gray-700">
              <h3 className="text-xl font-bold">For Students</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Submit essays, receive automated grades, and view teacher feedback.
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-50 py-6 dark:bg-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
          <p>© 2023 Essay Grading Automator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
