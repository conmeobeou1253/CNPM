"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Assignment {
  id: number
  essay_id: number
  question: string
  teacher_id: number
  teacher_name: string
  deadline?: string
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments?user_id=${user.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch assignments")
        }

        const data = await response.json()
        setAssignments(data)
      } catch (err) {
        setError("Failed to load assignments. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
  }, [user])

  const handleDeleteAssignment = async () => {
    if (!deleteAssignmentId || !user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/${deleteAssignmentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete assignment")
      }

      setAssignments(assignments.filter((assignment) => assignment.id !== deleteAssignmentId))
      setDeleteAssignmentId(null)
    } catch (err) {
      setError("Failed to delete assignment. Please try again.")
      console.error(err)
    }
  }

  // Function to format deadline
  const formatDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr)
    return deadline.toLocaleString()
  }

  // Function to check if deadline has passed
  const isDeadlinePassed = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr)
    const now = new Date()
    return deadline < now
  }

  if (!user || user.role !== "teacher") {
    return <div>Access denied. You must be a teacher to view this page.</div>
  }

  if (loading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">Manage assignments for students</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/assignments/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-center text-muted-foreground">
              No assignments found. Create your first assignment.
            </p>
            <Button asChild>
              <Link href="/dashboard/teacher/assignments/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Assignment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{assignment.question}</CardTitle>
                <CardDescription>Assignment ID: {assignment.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Essay ID: {assignment.essay_id}</p>

                {/* Display deadline if it exists */}
                {assignment.deadline && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Deadline:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{formatDeadline(assignment.deadline)}</p>
                      {isDeadlinePassed(assignment.deadline) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/teacher/assignments/${assignment.id}/submissions`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Submissions
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteAssignmentId(assignment.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteAssignmentId !== null} onOpenChange={(open) => !open && setDeleteAssignmentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAssignmentId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssignment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
