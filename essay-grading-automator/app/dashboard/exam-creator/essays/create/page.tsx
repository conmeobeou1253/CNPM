"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Criterion {
  type: string
  value: string
  deduct?: number
}

export default function CreateEssayPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [criteria, setCriteria] = useState<Criterion[]>([{ type: "contains", value: "", deduct: 0.5 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!user || user.role !== "exam_creator") {
    return <div>Access denied. You must be an exam creator to view this page.</div>
  }

  // Update the handleAddCriterion function to check for existing min_words criterion
  const handleAddCriterion = () => {
    // Check if we already have a min_words criterion and the new one is also min_words
    const hasMinWords = criteria.some((c) => c.type === "min_words")
    const newCriterionType = hasMinWords ? "contains" : "contains" // Default to contains if min_words exists
    setCriteria([...criteria, { type: newCriterionType, value: "", deduct: 0.5 }])
  }

  // Update the handleCriterionTypeChange function to prevent multiple min_words
  const handleCriterionTypeChange = (value: string, index: number) => {
    // If changing to min_words, check if one already exists
    if (value === "min_words") {
      const hasMinWords = criteria.some((c, i) => i !== index && c.type === "min_words")
      if (hasMinWords) {
        setError("Only one 'Minimum Words' criterion is allowed")
        return
      }
    }

    const newCriteria = [...criteria]
    newCriteria[index].type = value
    setCriteria(newCriteria)
    setError("") // Clear any error when making a valid change
  }

  const handleRemoveCriterion = (index: number) => {
    const newCriteria = [...criteria]
    newCriteria.splice(index, 1)
    setCriteria(newCriteria)
  }

  const handleCriterionValueChange = (value: string, index: number) => {
    const newCriteria = [...criteria]
    newCriteria[index].value = value
    setCriteria(newCriteria)
  }

  const handleCriterionDeductChange = (deduct: string, index: number) => {
    const newCriteria = [...criteria]
    newCriteria[index].deduct = parseFloat(deduct) || 0.5
    setCriteria(newCriteria)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!question.trim()) {
      setError("Essay question is required")
      return
    }

    if (criteria.some((c) => !c.value.trim())) {
      setError("All criteria must have a value")
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/essays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          question,
          criteria,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create essay")
      }

      router.push("/dashboard/exam-creator/essays")
    } catch (err) {
      setError("Failed to create essay. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Essay</h1>
        <p className="text-muted-foreground">Create a new essay template with grading criteria</p>
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
            <CardTitle>Essay Details</CardTitle>
            <CardDescription>Enter the essay question and grading criteria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Essay Question</Label>
              <Textarea
                id="question"
                placeholder="Enter the essay question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-32"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Grading Criteria</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCriterion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Criterion
                </Button>
              </div>

              {criteria.map((criterion, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-1/3">
                    <Label htmlFor={`criterion-type-${index}`} className="mb-2 block">
                      Type
                    </Label>
                    <Select value={criterion.type} onValueChange={(value) => handleCriterionTypeChange(value, index)}>
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
                      onChange={(e) => handleCriterionValueChange(e.target.value, index)}
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`criterion-deduct-${index}`}>Deduct (points)</Label>
                    <Input
                      id={`criterion-deduct-${index}`}
                      type="number"
                      min={0}
                      step={0.1}
                      value={criterion.deduct ?? 0.5}
                      onChange={e => handleCriterionDeductChange(e.target.value, index)}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="mt-8"
                    onClick={() => handleRemoveCriterion(index)}
                    disabled={criteria.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/exam-creator/essays")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Essay"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
