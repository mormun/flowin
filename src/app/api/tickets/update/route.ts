import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  notifyTicketCreatorOnStatusChange,
  notifyTechOnAssignment,
} from "@/lib/notifications"

// PATCH /api/tickets/update
// Actualiza un ticket: estado, asignación y/o prioridad.
// Aplica validaciones de rol y máquina de estados antes de persistir.
export async function PATCH(req: Request) {
  try {
    // Verificar sesión activa
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener usuario actual con su rol
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

    // Obtener el ticket actual para comparar estado y permisos
    const currentTicket = await prisma.tickets.findUnique({
      where: { id },
      select: { id: true, status_id: true, assigned_to: true, created_by: true },
    })
    if (!currentTicket) {
      return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 })
    }

    // ───── Cargar todos los estados en una sola query y mapear por nombre ─────
    const statuses = await prisma.status.findMany({
      where: {
        name: { in: ["Nuevo", "En Proceso", "Pendiente", "Solucionado", "Cerrado", "Cancelado"] },
      },
      select: { id: true, name: true },
    })
    const statusMap = Object.fromEntries(statuses.map((s) => [s.name, s.id])) as Record<string, number>
    const NUEVO      = statusMap["Nuevo"]
    const EN_PROCESO = statusMap["En Proceso"]
    const PENDIENTE  = statusMap["Pendiente"]
    const SOLUCIONADO = statusMap["Solucionado"]
    const CERRADO    = statusMap["Cerrado"]
    const CANCELADO  = statusMap["Cancelado"]

    // ───── Variables de contexto: rol y relación con el ticket ─────
    const isAdmin       = currentUser.role === "admin"
    const isTech        = currentUser.role === "tech"
    const isUser        = currentUser.role === "user"
    const isCreator     = currentTicket.created_by === currentUser.id
    const isAssignedToMe = currentTicket.assigned_to === currentUser.id
    const currentStatus = currentTicket.status_id

    // ───── Bloqueo global: tickets cerrados o cancelados son inmutables ─────
    if (currentStatus === CERRADO || currentStatus === CANCELADO) {
      return NextResponse.json(
        { error: "No se puede modificar un ticket cerrado o cancelado" },
        { status: 403 }
      )
    }

    // ───── Validación: cambio de prioridad ─────
    // Solo permitido en estados activos y por admin o técnico con acceso al ticket
    if (priority !== undefined) {
      const inActiveStatus =
        currentStatus === NUEVO || currentStatus === EN_PROCESO || currentStatus === PENDIENTE
      if (!inActiveStatus) {
        return NextResponse.json({ error: "No se puede cambiar la prioridad en este estado" }, { status: 403 })
      }
      const canChangePriority =
        isAdmin || (isTech && (isAssignedToMe || currentTicket.assigned_to === null))
      if (!canChangePriority) {
        return NextResponse.json({ error: "No autorizado para cambiar la prioridad" }, { status: 403 })
      }
    }

    // ───── Validación: cambio de asignación ─────
    // Solo en estados activos; técnico solo puede asignar si el ticket es Nuevo o ya está asignado a él
    if (assigned_to !== undefined && assigned_to !== null) {
      const inActiveStatus =
        currentStatus === NUEVO || currentStatus === EN_PROCESO || currentStatus === PENDIENTE
      if (!inActiveStatus) {
        return NextResponse.json({ error: "No se puede asignar en este estado" }, { status: 403 })
      }
      const canAssign =
        isAdmin || (isTech && (currentStatus === NUEVO || isAssignedToMe))
      if (!canAssign) {
        return NextResponse.json({ error: "No autorizado para asignar este ticket" }, { status: 403 })
      }
    }

    // ───── Validación: máquina de estados ─────
    // Define qué transiciones son válidas según el rol y el estado actual
    let resolvedStatusId = status_id

    if (status_id !== undefined) {
      const target = status_id

      if (target === CANCELADO) {
        // Usuario puede cancelar solo si es creador y el ticket es Nuevo
        // Técnico/admin pueden cancelar en estados activos si tienen acceso
        const canCancel =
          (isUser && isCreator && currentStatus === NUEVO) ||
          ((isTech || isAdmin) &&
            (currentStatus === NUEVO || currentStatus === EN_PROCESO || currentStatus === PENDIENTE) &&
            (isAdmin || isAssignedToMe || currentTicket.assigned_to === null))
        if (!canCancel) {
          return NextResponse.json({ error: "No autorizado para cancelar este ticket" }, { status: 403 })
        }
      } else if (target === PENDIENTE) {
        // En Proceso → Pendiente: solo técnico asignado o admin
        const valid = currentStatus === EN_PROCESO && (isAdmin || (isTech && isAssignedToMe))
        if (!valid) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === EN_PROCESO) {
        // Pendiente → En Proceso: técnico asignado o admin (reanudar)
        // Solucionado → En Proceso: solo el creador (reabrir)
        const fromPendiente = currentStatus === PENDIENTE && (isAdmin || (isTech && isAssignedToMe))
        const fromSolucionado = currentStatus === SOLUCIONADO && isUser && isCreator
        if (!fromPendiente && !fromSolucionado) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === SOLUCIONADO) {
        // En Proceso → Solucionado: técnico asignado o admin
        const valid = currentStatus === EN_PROCESO && (isAdmin || (isTech && isAssignedToMe))
        if (!valid) {
          return NextResponse.json({ error: "Transición de estado no permitida" }, { status: 403 })
        }
      } else if (target === CERRADO) {
        // Solucionado → Cerrado: solo el creador del ticket
        const valid = currentStatus === SOLUCIONADO && isUser && isCreator
        if (!valid) {
          return NextResponse.json({ error: "Solo el creador puede cerrar un ticket solucionado" }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: "Estado destino no válido" }, { status: 400 })
      }
    }

    // ───── Lógica especial: asignar desde Nuevo → cambia automáticamente a En Proceso ─────
    if (assigned_to !== undefined && assigned_to !== null && currentStatus === NUEVO) {
      resolvedStatusId = EN_PROCESO
    }

    // ───── Determinar si el nuevo estado es final (para actualizar closed_at) ─────
    const isFinalStatus = resolvedStatusId === CERRADO || resolvedStatusId === CANCELADO

    // ───── Aplicar el update en BD ─────
    // closed_at: se establece si el estado es final, se limpia si cambia a no-final, se deja igual si no hay cambio de estado
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

    // ───── Notificaciones post-update ─────
    const statusChanged =
      resolvedStatusId !== undefined && resolvedStatusId !== currentTicket.status_id
    const assignmentChanged =
      assigned_to !== undefined &&
      assigned_to !== null &&
      assigned_to !== currentTicket.assigned_to

    // Notificar al creador si cambió el estado
    if (statusChanged && currentTicket.created_by) {
      await notifyTicketCreatorOnStatusChange({
        ticketId: updated.id,
        creatorId: currentTicket.created_by,
        actorId: currentUser.id,
        newStatusId: resolvedStatusId!,
      })
    }

    // Notificar al técnico si se le asignó el ticket
    if (assignmentChanged) {
      await notifyTechOnAssignment({
        ticketId: updated.id,
        techId: assigned_to,
        actorId: currentUser.id,
      })
    }

    return NextResponse.json({ success: true, ticket: updated })
  } catch (error) {
    console.error("ERROR PATCH /api/tickets/update:", error)
    return NextResponse.json({ error: "Error actualizando ticket" }, { status: 500 })
  }
}