import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  notifyTicketCreatorOnStatusChange,
  notifyTechOnAssignment,
} from "@/lib/notifications"

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { id, status_id, assigned_to, priority } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 })
    }

    const currentTicket = await prisma.tickets.findUnique({
      where: { id },
      select: { id: true, status_id: true, assigned_to: true, created_by: true },
    })

    if (!currentTicket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    const [procesoStatus, cerradoStatus, canceladoStatus, solucionadoStatus] = await Promise.all([
      prisma.status.findFirst({ where: { name: "Proceso" } }),
      prisma.status.findFirst({ where: { name: "Cerrado" } }),
      prisma.status.findFirst({ where: { name: "Cancelado" } }),
      prisma.status.findFirst({ where: { name: "Solucionado" } }),
    ])

    const isAdmin = currentUser.role === "admin"
    const isTech = currentUser.role === "tech"
    const isUser = currentUser.role === "user"
    const isAssignedToMe = currentTicket.assigned_to === currentUser.id
    const isOwner = currentTicket.created_by === currentUser.id

    if (assigned_to !== undefined) {
      if (!isAdmin && !(isTech && (isAssignedToMe || currentTicket.assigned_to === null))) {
        return NextResponse.json({ error: "No autorizado para asignar este ticket" }, { status: 403 })
      }
    }

    if (priority !== undefined) {
      if (!isAdmin && !(isTech && (isAssignedToMe || currentTicket.assigned_to === null))) {
        return NextResponse.json({ error: "No autorizado para cambiar la prioridad" }, { status: 403 })
      }
    }

    if (status_id !== undefined) {
      if (isUser) {
        const canUserChangeStatus =
          isOwner &&
          currentTicket.status_id === solucionadoStatus?.id &&
          (status_id === cerradoStatus?.id || status_id === procesoStatus?.id)

        if (!canUserChangeStatus) {
          return NextResponse.json({ error: "No autorizado para cambiar el estado" }, { status: 403 })
        }
      }

      if (isTech) {
        const canTechChangeStatus =
          (currentTicket.status_id === procesoStatus?.id &&
            (status_id === 4 || (status_id === solucionadoStatus?.id && isAssignedToMe))) ||
          (currentTicket.status_id === 4 && status_id === procesoStatus?.id)

        if (!canTechChangeStatus && !isAdmin) {
          return NextResponse.json({ error: "No autorizado para cambiar el estado" }, { status: 403 })
        }
      }
    }

    let resolvedStatusId = status_id

    if (assigned_to !== undefined && assigned_to !== null) {
      const isBlocked =
        currentTicket.status_id === cerradoStatus?.id ||
        currentTicket.status_id === canceladoStatus?.id

      if (isBlocked) {
        return NextResponse.json(
          { error: "No se puede reasignar un ticket Cerrado o Cancelado" },
          { status: 400 }
        )
      }

      resolvedStatusId = procesoStatus?.id ?? status_id
    }

    const isFinalStatus =
      resolvedStatusId === cerradoStatus?.id ||
      resolvedStatusId === solucionadoStatus?.id

    const updated = await prisma.tickets.update({
      where: { id },
      data: {
        ...(resolvedStatusId !== undefined && { status_id: resolvedStatusId }),
        ...(assigned_to !== undefined && { assigned_to }),
        ...(priority !== undefined && { priority }),
        updated_at: new Date(),
        closed_at: isFinalStatus ? new Date() : resolvedStatusId !== undefined ? null : undefined,
      },
    })

    // ───── Notificaciones ─────
    const statusChanged =
      resolvedStatusId !== undefined &&
      resolvedStatusId !== currentTicket.status_id

    const assignmentChanged =
      assigned_to !== undefined &&
      assigned_to !== null &&
      assigned_to !== currentTicket.assigned_to

    if (statusChanged && currentTicket.created_by) {
      await notifyTicketCreatorOnStatusChange({
        ticketId: updated.id,
        creatorId: currentTicket.created_by,
        actorId: currentUser.id,
        newStatusId: resolvedStatusId!,
      })
    }

    if (assignmentChanged) {
      await notifyTechOnAssignment({
        ticketId: updated.id,
        techId: assigned_to,
        actorId: currentUser.id,
      })
    }

    return NextResponse.json({ success: true, ticket: updated })
  } catch (error) {
    console.error("ERROR UPDATE TICKET:", error)
    return NextResponse.json(
      { error: "Error actualizando ticket" },
      { status: 500 }
    )
  }
}