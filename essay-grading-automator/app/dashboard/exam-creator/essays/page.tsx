"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Edit, Plus, Trash } from "lucide-react"
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

interface Criterion {
  type: string
  value: string
}

interface Essay {
  id: number
  question: string
  criteria: Criterion[]
  teacher_id: number
}

export default function EssaysPage() {
  const { user } = useAuth()
  const [essays, setEssays] = useState<Essay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteEssayId, setDeleteEssayId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchEssays = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays`)

        if (!response.ok) {
          throw new Error("Failed to fetch essays")
        }

        const data = await response.json()
        setEssays(data)
      } catch (err) {
        setError("Failed to load essays. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEssays()
  }, [user])

  const handleDeleteEssay = async () => {
    if (!deleteEssayId || !user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays/${deleteEssayId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete essay")
      }

      setEssays(essays.filter((essay) => essay.id !== deleteEssayId))
      setDeleteEssayId(null)
    } catch (err) {
      setError("Failed to delete essay. Please try again.")
      console.error(err)
    }
  }

  if (!user || user.role !== "exam_creator") {
    return <div>Access denied. You must be an exam creator to view this page.</div>
  }

  if (loading) {
    return <div>Loading essays...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Essays</h1>
          <p className="text-muted-foreground">Manage essay templates and grading criteria</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exam-creator/essays/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Essay
          </Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {essays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-center text-muted-foreground">No essays found. Create your first essay template.</p>
            <Button asChild>
              <Link href="/dashboard/exam-creator/essays/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Essay
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {essays.map((essay) => (
            <Card key={essay.id}>
              <CardHeader>
                <CardTitle className="line-clamp-2">{essay.question}</CardTitle>
                <CardDescription>{essay.criteria.length} grading criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Grading Criteria:</h4>
                  <ul className="list-inside list-disc space-y-1">
                    {essay.criteria.slice(0, 3).map((criterion, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {criterion.type}: {criterion.value}
                      </li>
                    ))}
                    {essay.criteria.length > 3 && (
                      <li className="text-sm text-muted-foreground">+{essay.criteria.length - 3} more</li>
                    )}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/exam-creator/essays/edit/${essay.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteEssayId(essay.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteEssayId !== null} onOpenChange={(open) => !open && setDeleteEssayId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this essay? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEssayId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEssay}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
