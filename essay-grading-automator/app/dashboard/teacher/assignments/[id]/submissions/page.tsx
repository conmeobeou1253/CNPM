"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Submission {
  id: number
  student_id: number
  student_name: string
  content: string
  suggested_score: number | null
  final_score: number | null
  feedback: string | null
}

export default function SubmissionsPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return

    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays/${params.id}/submissions`)

        if (!response.ok) {
          throw new Error("Failed to fetch submissions")
        }

        const data = await response.json()
        setSubmissions(data)
      } catch (err) {
        setError("Failed to load submissions. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [user, params.id])

  if (!user || user.role !== "teacher") {
    return <div>Access denied. You must be a teacher to view this page.</div>
  }

  if (loading) {
    return <div>Loading submissions...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground">View and grade student submissions for this assignment</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/teacher/assignments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assignments
          </Link>
        </Button>
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
            <p className="text-center text-muted-foreground">No submissions found for this assignment yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>{submission.student_name}</CardTitle>
                <CardDescription>Submission ID: {submission.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  {submission.final_score !== null ? (
                    <Badge className="bg-green-500">Graded</Badge>
                  ) : submission.suggested_score !== null ? (
                    <Badge className="bg-yellow-500">Auto-graded</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
                {submission.suggested_score !== null && (
                  <div>
                    <p className="text-sm font-medium">Suggested Score:</p>
                    <p className="text-sm text-muted-foreground">{submission.suggested_score}</p>
                  </div>
                )}
                {submission.final_score !== null && (
                  <div>
                    <p className="text-sm font-medium">Final Score:</p>
                    <p className="text-sm text-muted-foreground">{submission.final_score}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/teacher/submissions/${submission.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View & Grade
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
