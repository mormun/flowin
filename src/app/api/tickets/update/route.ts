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

    // ───── Cargar estados de referencia (una sola query) ─────
    const statuses = await prisma.status.findMany({
      where: {
        name: { in: ["Nuevo", "En Proceso", "Pendiente", "Solucionado", "Cerrado", "Cancelado"] },
      },
      select: { id: true, name: true },
    })

    const statusMap = Object.fromEntries(statuses.map((s: any) => [s.name, s.id])) as Record<string, number>
    const NUEVO = statusMap["Nuevo"]
    const EN_PROCESO = statusMap["En Proceso"]
    const PENDIENTE = statusMap["Pendiente"]
    const SOLUCIONADO = statusMap["Solucionado"]
    const CERRADO = statusMap["Cerrado"]
    const CANCELADO = statusMap["Cancelado"]

    // ───── Variables de contexto ─────
    const isAdmin = currentUser.role === "admin"
    const isTech = currentUser.role === "tech"
    const isUser = currentUser.role === "user"
    const isCreator = currentTicket.created_by === currentUser.id
    const isAssignedToMe = currentTicket.assigned_to === currentUser.id
    const currentStatus = currentTicket.status_id

    // ───── Bloqueo global: estados finales no permiten modificaciones ─────
    if (currentStatus === CERRADO || currentStatus === CANCELADO) {
      return NextResponse.json(
        { error: "No se puede modificar un ticket cerrado o cancelado" },
        { status: 403 }
      )
    }

    // ───── Validación: cambio de prioridad ─────
    if (priority !== undefined) {
      if (currentStatus !== NUEVO && currentStatus !== EN_PROCESO && currentStatus !== PENDIENTE) {
        return NextResponse.json({ error: "No se puede cambiar la prioridad en este estado" }, { status: 403 })
      }
      const canChangePriority =
        isAdmin ||
        (isTech && (isAssignedToMe || currentTicket.assigned_to === null))
      if (!canChangePriority) {
        return NextResponse.json({ error: "No autorizado para cambiar la prioridad" }, { status: 403 })
      }
    }

    // ───── Validación: cambio de asignación ─────
    if (assigned_to !== undefined && assigned_to !== null) {
      if (currentStatus !== NUEVO && currentStatus !== EN_PROCESO && currentStatus !== PENDIENTE) {
        return NextResponse.json({ error: "No se puede asignar en este estado" }, { status: 403 })
      }
      const canAssign =
        isAdmin ||
        (isTech && (currentStatus === NUEVO || isAssignedToMe))
      if (!canAssign) {
        return NextResponse.json({ error: "No autorizado para asignar este ticket" }, { status: 403 })
      }
    }

    // ───── Validación: cambio de estado ─────
    let resolvedStatusId = status_id

    if (status_id !== undefined) {
      const target = status_id

      if (target === CANCELADO) {
        const canCancel =
          (isUser && isCreator && currentStatus === NUEVO) ||
          ((isTech || isAdmin) &&
            (currentStatus === NUEVO || currentStatus === EN_PROCESO || currentStatus === PENDIENTE) &&
            (isAdmin || isAssignedToMe || currentTicket.assigned_to === null))
        if (!canCancel) {
          return NextResponse.json({ error: "No autorizado para cancelar este ticket" }, { status: 403 })
        }
      } else if (target === PENDIENTE) {
        const valid = currentStatus === EN_PROCESO && (isAdmin || (isTech && isAssignedToMe))
        if (!valid) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === EN_PROCESO) {
        const fromPendiente = currentStatus === PENDIENTE && (isAdmin || (isTech && isAssignedToMe))
        const fromSolucionado = currentStatus === SOLUCIONADO && isUser && isCreator
        if (!fromPendiente && !fromSolucionado) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === SOLUCIONADO) {
        const valid = currentStatus === EN_PROCESO && (isAdmin || (isTech && isAssignedToMe))
        if (!valid) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === CERRADO) {
        const valid = currentStatus === SOLUCIONADO && isUser && isCreator
        if (!valid) {
          return NextResponse.json({ error: "Solo el creador puede cerrar un ticket solucionado" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Estado destino no válido" }, { status: 400 })
      }
    }

    // ───── Lógica especial: asignar en Nuevo → auto-cambio a En Proceso ─────
    if (assigned_to !== undefined && assigned_to !== null && currentStatus === NUEVO) {
      resolvedStatusId = EN_PROCESO
    }

    // ───── Lógica: estados finales actualizan closed_at ─────
    const isFinalStatus = resolvedStatusId === CERRADO || resolvedStatusId === CANCELADO

    // ───── Aplicar el update ─────
    const updated = await prisma.tickets.update({
      where: { id },
      data: {
        ...(resolvedStatusId !== undefined && { status_id: resolvedStatusId }),
        ...(assigned_to !== undefined && { assigned_to }),
        ...(priority !== undefined && { priority }),
        updated_at: new Date(),
        closed_at: isFinalStatus
          ? new Date()
          : resolvedStatusId !== undefined
            ? null
            : undefined,
      },
    })

    // ───── Notificaciones ─────
    const statusChanged =
      resolvedStatusId !== undefined && resolvedStatusId !== currentTicket.status_id

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
    return NextResponse.json({ error: "Error actualizando ticket" }, { status: 500 })
  }
}