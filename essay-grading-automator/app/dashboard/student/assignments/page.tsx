"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface Assignment {
  id: number
  essay_id: number
  question: string
  teacher_id: number
  teacher_name: string
  deadline?: string
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return

    const fetchAssignments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments/for_student?student_id=${user.id}`)

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

  // Function to calculate time remaining until deadline
  const getTimeRemaining = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr)
    const now = new Date()

    if (deadline <= now) {
      return "Expired"
    }

    const diffMs = deadline.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ${diffHours} hour${diffHours !== 1 ? "s" : ""} remaining`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} remaining`
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} remaining`
    }
  }

  if (!user || user.role !== "student") {
    return <div>Access denied. You must be a student to view this page.</div>
  }

  if (loading) {
    return <div>Loading assignments...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
        <p className="text-muted-foreground">View and complete your assigned essays</p>
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
            <p className="text-center text-muted-foreground">
              No assignments found. Your teacher will assign essays to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{assignment.question}</CardTitle>
                <CardDescription>Assigned by: {assignment.teacher_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Assignment ID: {assignment.id}</p>

                {/* Display deadline if it exists */}
                {assignment.deadline && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Deadline:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{formatDeadline(assignment.deadline)}</p>
                      {isDeadlinePassed(assignment.deadline) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge className="bg-green-500">{getTimeRemaining(assignment.deadline)}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/dashboard/student/assignments/${assignment.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Assignment
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
