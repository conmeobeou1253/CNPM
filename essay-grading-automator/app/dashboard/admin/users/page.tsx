"use client"

import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Edit, Plus, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: number
  username: string
  role: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)

  // State for create/edit user dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?user_id=${user.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data)
      } catch (err) {
        setError("Failed to load users. Please try again later.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user])

  const handleDeleteUser = async () => {
    if (!deleteUserId || !user) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${deleteUserId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      setUsers(users.filter((u) => u.id !== deleteUserId))
      setDeleteUserId(null)
    } catch (err) {
      setError("Failed to delete user. Please try again.")
      console.error(err)
    }
  }

  const handleCreateUser = async () => {
    if (!user) return

    try {
      setIsSaving(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          username,
          password,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create user")
      }

      const data = await response.json()

      // Refresh the user list
      const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?user_id=${user.id}`)
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        setUsers(updatedData)
      }

      // Close the dialog and reset form
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      setError("Failed to create user. Please try again.")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!user || !editUserId) return

    try {
      setIsSaving(true)

      // Create the request body with only the fields that have values
      const requestBody: any = { user_id: user.id }
      if (username) requestBody.username = username
      if (password) requestBody.password = password
      if (role) requestBody.role = role

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${editUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error("Failed to update user")
      }

      // Refresh the user list
      const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?user_id=${user.id}`)
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        setUsers(updatedData)
      }

      // Close the dialog and reset form
      setIsDialogOpen(false)
      resetForm()
    } catch (err) {
      setError("Failed to update user. Please try again.")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditClick = (userId: number) => {
    const userToEdit = users.find((u) => u.id === userId)
    if (userToEdit) {
      setEditUserId(userId)
      setUsername(userToEdit.username)
      setRole(userToEdit.role)
      setPassword("") // Don't populate password for security reasons
      setIsEditing(true)
      setIsDialogOpen(true)
    }
  }

  const handleCreateClick = () => {
    resetForm()
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setUsername("")
    setPassword("")
    setRole("student")
    setEditUserId(null)
  }

  if (!user || user.role !== "admin") {
    return <div>Access denied. You must be an admin to view this page.</div>
  }

  if (loading) {
    return <div>Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users in the system</p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell className="capitalize">{u.role.replace("_", " ")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(u.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteUserId(u.id)}
                        disabled={u.id === user.id}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setIsDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update user information" : "Enter details for the new user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password{" "}
                {isEditing && <span className="text-sm text-muted-foreground">(Leave blank to keep current)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
                required={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="exam_creator">Exam Creator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleUpdateUser : handleCreateUser}
              disabled={isSaving || (!isEditing && (!username || !password))}
            >
              {isSaving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
