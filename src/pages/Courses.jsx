// src/pages/Courses.jsx
import { useUser } from "@/context/UserContext"
import { permissions } from "@/config/permissions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function Courses() {
  const { user } = useUser()
  const canEdit = permissions[user.role]?.can?.editCourse

  // Dummy data (replace later with API)
  const courses = [
    { id: 1, name: "React Fundamentals", mentor: "Alice", students: 20 },
    { id: 2, name: "Advanced Node.js", mentor: "Bob", students: 15 },
    { id: 3, name: "UI/UX Basics", mentor: "Charlie", students: 30 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Courses</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Mentor</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>{course.name}</TableCell>
              <TableCell>{course.mentor}</TableCell>
              <TableCell>{course.students}</TableCell>
              <TableCell>
                <Button size="sm" disabled={!canEdit}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
