"use client"

import type React from "react"

import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClipboardList, FileText, Home, LogOut, Menu, User, Users, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = () => setSidebarOpen(false)

  if (!user) {
    return <div>Loading...</div>
  }

  const roleBasedNavItems = () => {
    switch (user.role) {
      case "exam_creator":
        return [
          {
            href: "/dashboard/exam-creator/essays",
            icon: <FileText className="h-5 w-5" />,
            label: "Essays",
          },
        ]
      case "teacher":
        return [
          {
            href: "/dashboard/teacher/assignments",
            icon: <ClipboardList className="h-5 w-5" />,
            label: "Assignments",
          },
          // Removed the Submissions menu item as requested
        ]
      case "student":
        return [
          {
            href: "/dashboard/student/assignments",
            icon: <ClipboardList className="h-5 w-5" />,
            label: "Assignments",
          },
          {
            href: "/dashboard/student/submissions",
            icon: <FileText className="h-5 w-5" />,
            label: "My Submissions",
          },
        ]
      case "admin":
        return [
          {
            href: "/dashboard/admin/users",
            icon: <Users className="h-5 w-5" />,
            label: "Users",
          },
        ]
      default:
        return []
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle Menu"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="font-semibold">Essay Grading Automator</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for mobile (overlay) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:static md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <h2 className="font-semibold">Dashboard</h2>
            <Button variant="ghost" size="icon" aria-label="Close Menu" className="md:hidden" onClick={closeSidebar}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <NavItem
              href="/dashboard"
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              active={pathname === "/dashboard"}
              onClick={closeSidebar}
            />
            <NavItem
              href="/dashboard/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
              active={pathname === "/dashboard/profile"}
              onClick={closeSidebar}
            />
            {roleBasedNavItems().map((item, index) => (
              <NavItem
                key={index}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onClick={closeSidebar}
              />
            ))}
            <Button
              variant="ghost"
              className="mt-auto flex w-full items-center justify-start gap-3 px-3 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              onClick={() => {
                closeSidebar()
                logout()
              }}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
