"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface Submission {
  id: number
  essay_id: number
  student_id: number
  student_name: string
  content: string
  suggested_score: number | null
  final_score: number | null
  feedback: string | null
  auto_feedback?: string | null
  reasons?: string[] | null
}

interface GradeResponse {
  suggested_score: number
  reasons: string[]
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [finalScore, setFinalScore] = useState("")
  const [feedback, setFeedback] = useState("")
  const [gradeResponse, setGradeResponse] = useState<GradeResponse | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchSubmission = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch submission")
        }

        const data = await response.json()
        setSubmission(data)
        if (data.final_score !== null) {
          setFinalScore(data.final_score.toString())
        } else if (data.suggested_score !== null) {
          setFinalScore(data.suggested_score.toString())
        }
        if (data.feedback !== null) {
          setFeedback(data.feedback)
        }
      } catch (err) {
        setError("Failed to load submission. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmission()
  }, [user, params.id])

  const handleAutoGrade = async () => {
    if (!submission) return

    try {
      setGrading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${submission.id}/grade`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to auto-grade submission")
      }

      const data = await response.json()
      setGradeResponse(data)
      setFinalScore(data.suggested_score.toString())

      // Update the submission with the suggested score
      setSubmission({
        ...submission,
        suggested_score: data.suggested_score,
        reasons: data.reasons,
      })
    } catch (err) {
      setError("Failed to auto-grade submission. Please try again.")
      console.error(err)
    } finally {
      setGrading(false)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submission) return

    try {
      setSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/submissions/${submission.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          final_score: Number.parseFloat(finalScore),
          feedback,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      // Update the submission with the final score and feedback
      setSubmission({
        ...submission,
        final_score: Number.parseFloat(finalScore),
        feedback,
      })

      // Show success message or redirect
      router.push(`/dashboard/teacher/assignments/${submission.essay_id}/submissions`)
    } catch (err) {
      setError("Failed to submit feedback. Please try again.")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "teacher") {
    return <div>Access denied. You must be a teacher to view this page.</div>
  }

  if (loading) {
    return <div>Loading submission...</div>
  }

  if (!submission) {
    return <div>Submission not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submission Detail</h1>
          <p className="text-muted-foreground">View and grade student submission</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/teacher/assignments/${submission.essay_id}/submissions`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Student Submission</CardTitle>
            <CardDescription>
              Submitted by {submission.student_name} (ID: {submission.student_id})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-muted p-4">
              <p className="whitespace-pre-wrap">{submission.content}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
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
            {submission.final_score === null && (
              <Button onClick={handleAutoGrade} disabled={grading}>
                {grading ? "Grading..." : "Auto-Grade"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading & Feedback</CardTitle>
            <CardDescription>Provide a final score and feedback for the student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.suggested_score !== null && (
              <div className="rounded-md bg-muted p-4">
                <p className="font-medium">Suggested Score: {submission.suggested_score}</p>

                {/* Display auto-feedback if available */}
                {submission.auto_feedback && (
                  <div className="mt-2">
                    <p className="font-medium">Automatic Feedback:</p>
                    <p className="text-sm text-muted-foreground">{submission.auto_feedback}</p>
                  </div>
                )}

                {/* Display reasons if available and no auto_feedback */}
                {!submission.auto_feedback && (gradeResponse?.reasons || submission.reasons) && (
                  <div className="mt-2">
                    <p className="font-medium">Reasons:</p>
                    <ul className="ml-5 list-disc space-y-1">
                      {(gradeResponse?.reasons || submission.reasons || []).map((reason, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="final-score">Final Score</Label>
                <Input
                  id="final-score"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={finalScore}
                  onChange={(e) => setFinalScore(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
