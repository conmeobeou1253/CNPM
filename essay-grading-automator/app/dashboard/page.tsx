"use client"

import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClipboardList, FileText, Users } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in to access the dashboard</div>
  }

  const roleBasedContent = () => {
    switch (user.role) {
      case "exam_creator":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Essays</CardTitle>
                <CardDescription>Manage essay templates and grading criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/exam-creator/essays">
                    <FileText className="mr-2 h-4 w-4" />
                    View Essays
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Create New Essay</CardTitle>
                <CardDescription>Add a new essay template to the bank</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/exam-creator/essays/create">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Essay
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case "teacher":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>Manage assignments for students</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/teacher/assignments">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Assignments
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Create Assignment</CardTitle>
                <CardDescription>Assign an essay to students</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/teacher/assignments/create">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Link>
                </Button>
              </CardContent>
            </Card>
            {/* Removed the Submissions card as requested */}
          </div>
        )
      case "student":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>View your assigned essays</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/student/assignments">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    View Assignments
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
                <CardDescription>View your submitted essays and grades</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/student/submissions">
                    <FileText className="mr-2 h-4 w-4" />
                    View Submissions
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      case "admin":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return <div>Unknown role</div>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.username}! You are logged in as {user.role.replace("_", " ")}.
        </p>
      </div>
      {roleBasedContent()}
    </div>
  )
}
