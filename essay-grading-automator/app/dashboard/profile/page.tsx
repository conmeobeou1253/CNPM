"use client"

import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">View and manage your account information</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Username</h3>
            <p className="text-muted-foreground">{user.username}</p>
          </div>
          <div>
            <h3 className="font-medium">User ID</h3>
            <p className="text-muted-foreground">{user.id}</p>
          </div>
          <div>
            <h3 className="font-medium">Role</h3>
            <p className="text-muted-foreground capitalize">{user.role.replace("_", " ")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
