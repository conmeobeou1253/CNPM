"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Clock, Save } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { debounce } from "@/lib/utils"

interface Assignment {
  id: number
  essay_id: number
  question: string
  teacher_id: number
  teacher_name: string
  deadline?: string
}

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

interface Draft {
  draft_id: number
  content: string
  last_saved: string
}

export default function StudentAssignmentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [gradingReasons, setGradingReasons] = useState<string[]>([])

  // Draft related states
  const [draft, setDraft] = useState<Draft | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [draftSaveError, setDraftSaveError] = useState("")

  // Reference to track if component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    // Set isMounted to true when component mounts
    isMounted.current = true

    // Set isMounted to false when component unmounts
    return () => {
      isMounted.current = false
    }
  }, [])

  // Function to save draft
  const saveDraft = async (draftContent: string) => {
    if (!user || !assignment || submission || !isMounted.current) return

    // Don't save if content is empty
    if (!draftContent.trim()) return

    try {
      setSavingDraft(true)
      setDraftSaveError("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays/${assignment.essay_id}/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: user.id,
          content: draftContent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save draft")
      }

      const data = await response.json()

      if (isMounted.current) {
        setDraft({
          draft_id: data.draft_id,
          content: draftContent,
          last_saved: data.last_saved,
        })
        setLastSaved(new Date(data.last_saved).toLocaleString())
      }
    } catch (err) {
      if (isMounted.current) {
        setDraftSaveError("Failed to save draft. Your work may not be saved.")
        console.error(err)
      }
    } finally {
      if (isMounted.current) {
        setSavingDraft(false)
      }
    }
  }

  // Create debounced version of saveDraft
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveDraft = useCallback(
    debounce((content: string) => saveDraft(content), 2000),
    [user, assignment, submission],
  )

  // Handle content change with auto-save
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    // Auto-save draft when content changes
    if (!submission) {
      debouncedSaveDraft(newContent)
    }
  }

  // Manual save draft function
  const handleManualSave = () => {
    saveDraft(content)
  }

  useEffect(() => {
    if (!user) return

    const fetchAssignmentAndSubmission = async () => {
      try {
        // Fetch assignment details
        const assignmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/assignments/for_student?student_id=${user.id}`,
        )

        if (!assignmentResponse.ok) {
          throw new Error("Failed to fetch assignments")
        }

        const assignments = await assignmentResponse.json()
        const currentAssignment = assignments.find((a: Assignment) => a.id === Number.parseInt(params.id))

        if (!currentAssignment) {
          throw new Error("Assignment not found")
        }

        setAssignment(currentAssignment)

        // Check if student has already submitted
        const submissionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/essays/${currentAssignment.essay_id}/submissions?student_id=${user.id}`,
        )

        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json()
          if (submissionData && submissionData.id) {
            setSubmission(submissionData)
            setContent(submissionData.content)

            // If there are reasons in the response, set them
            if (submissionData.reasons) {
              setGradingReasons(submissionData.reasons)
            }
          } else {
            // If no submission, check for draft
            await fetchDraft(currentAssignment.essay_id)
          }
        } else {
          // If submission check fails, check for draft
          await fetchDraft(currentAssignment.essay_id)
        }
      } catch (err) {
        setError("Failed to load assignment. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const fetchDraft = async (essayId: number) => {
      try {
        const draftResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/essays/${essayId}/drafts?student_id=${user.id}`,
        )

        if (draftResponse.ok) {
          const draftData = await draftResponse.json()
          if (draftData && draftData.draft_id) {
            setDraft(draftData)
            setContent(draftData.content)
            setLastSaved(new Date(draftData.last_saved).toLocaleString())
          }
        }
      } catch (err) {
        console.error("Failed to fetch draft:", err)
        // Don't set error state here to avoid confusing the user
      }
    }

    fetchAssignmentAndSubmission()
  }, [user, params.id])

  // Function to check if deadline has passed
  const isDeadlinePassed = (deadlineStr?: string) => {
    if (!deadlineStr) return false
    const deadline = new Date(deadlineStr)
    const now = new Date()
    return deadline < now
  }

  // Function to format deadline
  const formatDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr)
    return deadline.toLocaleString()
  }

  // Update the handleSubmit function to handle the automatic grading response and deadline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !assignment) return

    // Check if deadline has passed
    if (assignment.deadline && isDeadlinePassed(assignment.deadline)) {
      setError("The deadline for this assignment has passed. You cannot submit anymore.")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      // Only allow new submissions, not updates
      if (!submission) {
        // Create new submission - the backend now returns grading info directly
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays/${assignment.essay_id}/submissions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: user.id,
            content,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          if (errorData.error === "Submission is past the deadline") {
            throw new Error("The deadline for this assignment has passed. You cannot submit anymore.")
          } else {
            throw new Error("Failed to submit essay")
          }
        }

        // The response now includes the submission with grading info
        const submissionData = await response.json()

        // Update the local state with the new submission data
        if (submissionData) {
          setSubmission(submissionData)
          if (submissionData.reasons) {
            setGradingReasons(submissionData.reasons)
          }

          // Clear draft state since backend automatically deletes the draft
          setDraft(null)
          setLastSaved(null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit essay. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || user.role !== "student") {
    return <div>Access denied. You must be a student to view this page.</div>
  }

  if (loading) {
    return <div>Loading assignment...</div>
  }

  if (!assignment) {
    return <div>Assignment not found</div>
  }

  const deadlinePassed = assignment.deadline && isDeadlinePassed(assignment.deadline)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignment</h1>
          <p className="text-muted-foreground">View and submit your essay</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/student/assignments">
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

      {draftSaveError && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{draftSaveError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Essay Question</CardTitle>
          <CardDescription>Assigned by: {assignment.teacher_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="whitespace-pre-wrap">{assignment.question}</p>
          </div>

          {/* Display deadline if it exists */}
          {assignment.deadline && (
            <div className="mt-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Deadline: {formatDeadline(assignment.deadline)}</span>
              {deadlinePassed ? <Badge variant="destructive">Expired</Badge> : <Badge variant="outline">Active</Badge>}
            </div>
          )}
        </CardContent>
      </Card>

      {submission ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
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
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 font-medium">Your Essay:</h3>
              <div className="rounded-md bg-muted p-4">
                <p className="whitespace-pre-wrap">{submission.content}</p>
              </div>
            </div>
            {submission.suggested_score !== null && (
              <div>
                <h3 className="mb-2 font-medium">Suggested Score:</h3>
                <p>{submission.suggested_score} / 10</p>

                {/* Display auto-feedback if available */}
                {submission.auto_feedback && (
                  <div className="mt-2">
                    <h3 className="font-medium">Automatic Feedback:</h3>
                    <div className="rounded-md bg-muted p-4 mt-1">
                      <p className="text-sm">{submission.auto_feedback}</p>
                    </div>
                  </div>
                )}

                {/* Display reasons if available and no auto_feedback */}
                {!submission.auto_feedback && submission.reasons && submission.reasons.length > 0 && (
                  <div className="mt-2">
                    <h3 className="font-medium">Grading Feedback:</h3>
                    <ul className="ml-5 list-disc space-y-1">
                      {submission.reasons.map((reason, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {submission.final_score !== null && (
              <>
                <div>
                  <h3 className="mb-2 font-medium">Final Score:</h3>
                  <p>{submission.final_score} / 10</p>
                </div>
                <div>
                  <h3 className="mb-2 font-medium">Teacher Feedback:</h3>
                  <div className="rounded-md bg-muted p-4">
                    <p className="whitespace-pre-wrap">{submission.feedback || "No feedback provided."}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Essay</CardTitle>
              <CardDescription className="flex items-center justify-between">
                <Badge variant="outline">Not Submitted</Badge>
                {lastSaved && (
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Save className="h-3 w-3 mr-1" /> Last saved: {lastSaved}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your essay here..."
                value={content}
                onChange={handleContentChange}
                className="min-h-64"
                required
                disabled={deadlinePassed}
              />

              {deadlinePassed && (
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    The deadline for this assignment has passed. You cannot submit anymore.
                  </AlertDescription>
                </Alert>
              )}

              {!deadlinePassed && draft && (
                <div className="mt-4 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={handleManualSave} disabled={savingDraft}>
                    {savingDraft ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={submitting || deadlinePassed}>
                {submitting ? "Submitting..." : "Submit Essay"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  )
}
