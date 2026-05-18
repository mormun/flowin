import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const ROLES = ["user", "tech", "admin"] as const
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Valida los campos de un usuario en creación o edición.
// En creación (isCreate=true) todos los campos son obligatorios.
// En edición (isCreate=false) solo se validan los campos presentes.
function validateUserPayload(
  data: { name?: string; surname?: string; email?: string; password?: string; role?: string },
  isCreate: boolean
): string | null {
  const { name, surname, email, password, role } = data

  if (isCreate || name !== undefined) {
    if (!name?.trim()) return "El nombre es obligatorio"
    if (name.length > 80) return "El nombre no puede superar los 80 caracteres"
  }
  if (isCreate || surname !== undefined) {
    if (!surname?.trim()) return "El apellido es obligatorio"
    if (surname.length > 100) return "El apellido no puede superar los 100 caracteres"
  }
  if (isCreate || email !== undefined) {
    if (!email?.trim()) return "El email es obligatorio"
    if (email.length > 150) return "El email no puede superar los 150 caracteres"
    if (!EMAIL_REGEX.test(email)) return "El formato del email no es válido"
  }
  if (isCreate || role !== undefined) {
    if (!role) return "El rol es obligatorio"
    if (!ROLES.includes(role as typeof ROLES[number])) return "Rol no válido"
  }
  if (password !== undefined && password !== "") {
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    if (password.length > 72) return "La contraseña no puede superar los 72 caracteres"
  }
  return null
}

// Helper: verifica que el usuario esté autenticado y sea admin.
// Devuelve { error } si no cumple, o { session } si pasa la validación.
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role) {
    return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }
  if (session.user.role !== "admin") {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) }
  }
  return { session }
}

// GET /api/users
// Devuelve todos los usuarios del sistema. Solo admin.
export async function GET() {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        active: true,
        registration_date: true,
      },
      orderBy: { id: "asc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("ERROR GET /api/users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

// POST /api/users
// Crea un nuevo usuario. Solo admin.
// Si no se proporciona contraseña, el usuario solo podrá acceder por OAuth (Google).
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const body = await req.json()

    // Validar campos con la función compartida
    const validationError = validateUserPayload(body, true)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const { name, surname, email, role, password } = body

    // Comprobar que el email no esté ya registrado
    const existing = await prisma.users.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    // Hashear la contraseña si se proporciona; si no, el acceso será solo por OAuth
    const password_hash = password ? await bcrypt.hash(password, 10) : null

    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
        role,
        password_hash,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("ERROR POST /api/users:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}

// PATCH /api/users
// Actualiza datos de un usuario. Solo admin.
// Si viene resetPassword=true, genera una contraseña aleatoria y la devuelve en texto plano
// para que el admin pueda comunicársela al usuario.
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { id, name, surname, email, role, active, resetPassword } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    // Modo reset de contraseña: genera una nueva aleatoria y la hashea
    if (resetPassword) {
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$"
      const newPassword = Array.from({ length: 10 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("")

      const password_hash = await bcrypt.hash(newPassword, 10)

      await prisma.users.update({
        where: { id },
        data: { password_hash },
      })

      // Devolver la contraseña en texto plano para que el admin la comunique al usuario
      return NextResponse.json({ success: true, generatedPassword: newPassword })
    }

    // Validar campos editables
    const validationError = validateUserPayload({ name, surname, email, role }, false)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Actualizar solo los campos presentes en el body
    const user = await prisma.users.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(surname !== undefined && { surname: surname.trim() }),
        ...(email !== undefined && { email: email.trim() }),
        ...(role !== undefined && { role }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("ERROR PATCH /api/users:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

// DELETE /api/users
// Elimina un usuario. Solo admin.
// Bloquea la eliminación si tiene tickets asociados (creados o asignados).
// En ese caso se recomienda desactivarlo en lugar de eliminarlo.
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin()
    if ("error" in auth) return auth.error

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    // Verificar que no tenga tickets asociados antes de eliminar
    const ticketCount = await prisma.tickets.count({
      where: {
        OR: [{ created_by: id }, { assigned_to: id }],
      },
    })
    if (ticketCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${ticketCount} ticket(s) asociado(s). Desactívalo en su lugar.` },
        { status: 409 }
      )
    }

    await prisma.users.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("ERROR DELETE /api/users:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}