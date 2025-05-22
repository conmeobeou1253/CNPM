"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Essay {
  id: number
  question: string
}

interface Criterion {
  type: string
  value: string
}

export default function CreateAssignmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [essays, setEssays] = useState<Essay[]>([])
  const [selectedEssayId, setSelectedEssayId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Add state for custom essay creation
  const [isCustomEssay, setIsCustomEssay] = useState(false)
  const [customQuestion, setCustomQuestion] = useState("")
  const [customCriteria, setCustomCriteria] = useState<Criterion[]>([{ type: "contains", value: "" }])

  // Add state for deadline
  const [deadline, setDeadline] = useState("")
  const [hasDeadline, setHasDeadline] = useState(false)

  // Add the handleAddCustomCriterion function
  const handleAddCustomCriterion = () => {
    // Check if we already have a min_words criterion
    const hasMinWords = customCriteria.some((c) => c.type === "min_words")
    const newCriterionType = hasMinWords ? "contains" : "contains" // Default to contains if min_words exists
    setCustomCriteria([...customCriteria, { type: newCriterionType, value: "" }])
  }

  // Add the handleRemoveCustomCriterion function
  const handleRemoveCustomCriterion = (index: number) => {
    const newCriteria = [...customCriteria]
    newCriteria.splice(index, 1)
    setCustomCriteria(newCriteria)
  }

  // Add the handleCustomCriterionTypeChange function
  const handleCustomCriterionTypeChange = (value: string, index: number) => {
    // If changing to min_words, check if one already exists
    if (value === "min_words") {
      const hasMinWords = customCriteria.some((c, i) => i !== index && c.type === "min_words")
      if (hasMinWords) {
        setError("Only one 'Minimum Words' criterion is allowed")
        return
      }
    }

    const newCriteria = [...customCriteria]
    newCriteria[index].type = value
    setCustomCriteria(newCriteria)
    setError("") // Clear any error when making a valid change
  }

  // Add the handleCustomCriterionValueChange function
  const handleCustomCriterionValueChange = (value: string, index: number) => {
    const newCriteria = [...customCriteria]
    newCriteria[index].value = value
    setCustomCriteria(newCriteria)
  }

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

  if (!user || user.role !== "teacher") {
    return <div>Access denied. You must be a teacher to view this page.</div>
  }

  if (loading) {
    return <div>Loading essays...</div>
  }

  // Update the handleSubmit function to handle custom essays and deadline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isCustomEssay) {
      // Validate custom essay
      if (!customQuestion.trim()) {
        setError("Please enter a question for your custom essay")
        return
      }

      if (customCriteria.length === 0) {
        setError("Please add at least one grading criterion")
        return
      }

      if (customCriteria.some((c) => !c.value.trim())) {
        setError("All criteria must have a value")
        return
      }
    } else {
      // Validate template selection
      if (!selectedEssayId) {
        setError("Please select an essay")
        return
      }
    }

    try {
      setSaving(true)

      let essayId

      if (isCustomEssay) {
        // First create the custom essay
        const createEssayResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            question: customQuestion,
            criteria: customCriteria,
          }),
        })

        if (!createEssayResponse.ok) {
          throw new Error("Failed to create custom essay")
        }

        const essayData = await createEssayResponse.json()
        essayId = essayData.essay_id
      } else {
        essayId = Number.parseInt(selectedEssayId)
      }

      // Prepare the assignment request body
      const assignmentBody: any = {
        user_id: user.id,
        essay_id: essayId,
      }

      // Add deadline if specified
      if (hasDeadline && deadline) {
        assignmentBody.deadline = deadline
      }

      // Then create the assignment with the essay ID and optional deadline
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentBody),
      })

      if (!response.ok) {
        throw new Error("Failed to create assignment")
      }

      router.push("/dashboard/teacher/assignments")
    } catch (err) {
      setError("Failed to create assignment. Please try again.")
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
        <p className="text-muted-foreground">Assign an essay to students</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Select an essay to assign to students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6 space-y-2">
              <Label>Assignment Type</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={isCustomEssay ? "outline" : "default"}
                  onClick={() => setIsCustomEssay(false)}
                >
                  Use Template
                </Button>
                <Button
                  type="button"
                  variant={isCustomEssay ? "default" : "outline"}
                  onClick={() => setIsCustomEssay(true)}
                >
                  Create Custom
                </Button>
              </div>
            </div>

            {isCustomEssay ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="custom-question">Essay Question</Label>
                  <Textarea
                    id="custom-question"
                    placeholder="Enter your custom essay question..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="min-h-32"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Grading Criteria</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCustomCriterion}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Criterion
                    </Button>
                  </div>

                  {customCriteria.map((criterion, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="w-1/3">
                        <Label htmlFor={`criterion-type-${index}`} className="mb-2 block">
                          Type
                        </Label>
                        <Select
                          value={criterion.type}
                          onValueChange={(value) => handleCustomCriterionTypeChange(value, index)}
                        >
                          <SelectTrigger id={`criterion-type-${index}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="min_words">Minimum Words</SelectItem>
                            <SelectItem value="has_calculation">Has Calculation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`criterion-value-${index}`} className="mb-2 block">
                          Value
                        </Label>
                        <Input
                          id={`criterion-value-${index}`}
                          placeholder={
                            criterion.type === "contains"
                              ? "Required text or phrase"
                              : criterion.type === "min_words"
                                ? "Minimum word count"
                                : "Required calculation pattern"
                          }
                          value={criterion.value}
                          onChange={(e) => handleCustomCriterionValueChange(e.target.value, index)}
                          required
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="mt-8"
                        onClick={() => handleRemoveCustomCriterion(index)}
                        disabled={customCriteria.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // The existing template selection UI goes here
              <div className="space-y-2">
                <Label htmlFor="essay">Select Essay</Label>
                <Select value={selectedEssayId} onValueChange={setSelectedEssayId} required>
                  <SelectTrigger id="essay">
                    <SelectValue placeholder="Select an essay" />
                  </SelectTrigger>
                  <SelectContent>
                    {essays.map((essay) => (
                      <SelectItem key={essay.id} value={essay.id.toString()}>
                        {essay.question.length > 50 ? `${essay.question.substring(0, 50)}...` : essay.question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isCustomEssay && selectedEssayId && (
              <div className="rounded-md bg-muted p-4">
                <h3 className="mb-2 font-medium">Selected Essay:</h3>
                <p className="text-sm text-muted-foreground">
                  {essays.find((e) => e.id.toString() === selectedEssayId)?.question}
                </p>
              </div>
            )}

            {/* Add deadline section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has-deadline"
                  checked={hasDeadline}
                  onChange={(e) => setHasDeadline(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="has-deadline">Set a deadline for submission</Label>
              </div>

              {hasDeadline && (
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (date and time)</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required={hasDeadline}
                  />
                  <p className="text-sm text-muted-foreground">
                    Students will not be able to submit after this deadline.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/teacher/assignments")}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                saving ||
                (isCustomEssay
                  ? !customQuestion.trim() || customCriteria.some((c) => !c.value.trim())
                  : !selectedEssayId) ||
                (hasDeadline && !deadline)
              }
            >
              {saving ? "Creating..." : "Create Assignment"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
