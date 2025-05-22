"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Submission {
  id: number
  essay_id: number
  assignment_id: number
  question: string
  content: string
  suggested_score: number | null
  final_score: number | null
  feedback: string | null
}

export default function StudentSubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return

    const fetchSubmissions = async () => {
      try {
        // First get all assignments for the student
        const assignmentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/assignments/for_student?student_id=${user.id}`,
        )

        if (!assignmentsResponse.ok) {
          throw new Error("Failed to fetch assignments")
        }

        const assignments = await assignmentsResponse.json()

        // For each assignment, check if there's a submission
        const submissionsPromises = assignments.map(async (assignment: any) => {
          const submissionResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/essays/${assignment.essay_id}/submissions?student_id=${user.id}`,
          )

          if (submissionResponse.ok) {
            const submission = await submissionResponse.json()
            if (submission && submission.id) {
              return {
                ...submission,
                assignment_id: assignment.id,
                question: assignment.question,
              }
            }
          }
          return null
        })

        const submissionsResults = await Promise.all(submissionsPromises)
        setSubmissions(submissionsResults.filter(Boolean))
      } catch (err) {
        setError("Failed to load submissions. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user])

  if (!user || user.role !== "student") {
    return <div>Access denied. You must be a student to view this page.</div>
  }

  if (loading) {
    return <div>Loading submissions...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
        <p className="text-muted-foreground">View your submitted essays and grades</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-muted-foreground">
              No submissions found. Complete your assignments to see them here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/student/assignments">View Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{submission.question}</CardTitle>
                <CardDescription>
                  {submission.final_score !== null ? (
                    <Badge className="bg-green-500">Graded</Badge>
                  ) : submission.suggested_score !== null ? (
                    <Badge className="bg-yellow-500">Auto-graded</Badge>
                  ) : (
                    <Badge variant="outline">Submitted</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {submission.final_score !== null && (
                  <div>
                    <p className="text-sm font-medium">Final Score:</p>
                    <p className="text-sm text-muted-foreground">{submission.final_score} / 10</p>
                  </div>
                )}
                {submission.suggested_score !== null && submission.final_score === null && (
                  <div>
                    <p className="text-sm font-medium">Suggested Score:</p>
                    <p className="text-sm text-muted-foreground">{submission.suggested_score} / 10</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Submission ID:</p>
                  <p className="text-sm text-muted-foreground">{submission.id}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/student/assignments/${submission.assignment_id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
