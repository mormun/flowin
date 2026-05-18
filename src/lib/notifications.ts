import { prisma } from "@/lib/prisma"

/**
 * Notifica al creador del ticket cuando cambia el estado.
 * No notifica si el actor es el propio creador.
 */
export async function notifyTicketCreatorOnStatusChange(args: {
  ticketId: number
  creatorId: number
  actorId: number
  newStatusId: number
}) {
  try {
    // Evitar autonotificación
    if (args.creatorId === args.actorId) return

    // Obtener el nombre del nuevo estado para incluirlo en el mensaje
    const status = await prisma.status.findUnique({
      where: { id: args.newStatusId },
      select: { name: true },
    })

    await prisma.notifications.create({
      data: {
        user_id: args.creatorId,
        title: "Estado de tu ticket actualizado",
        message: `El estado del ticket #${args.ticketId} ha cambiado a "${status?.name ?? "actualizado"}".`,
        ticket_id: args.ticketId,
      },
    })
  } catch (e) {
    console.error("Error notifyTicketCreatorOnStatusChange:", e)
  }
}

/**
 * Notifica al técnico cuando se le asigna un ticket.
 * No notifica si el técnico se autoasigna.
 */
export async function notifyTechOnAssignment(args: {
  ticketId: number
  techId: number
  actorId: number
}) {
  try {
    // Evitar autonotificación
    if (args.techId === args.actorId) return

    await prisma.notifications.create({
      data: {
        user_id: args.techId,
        title: "Nuevo ticket asignado",
        message: `Se te ha asignado el ticket #${args.ticketId}.`,
        ticket_id: args.ticketId,
      },
    })
  } catch (e) {
    console.error("Error notifyTechOnAssignment:", e)
  }
}

/**
 * Notifica a todos los técnicos activos cuando se crea un nuevo ticket.
 * No notifica al actor (por si el actor fuera un técnico o admin).
 */
export async function notifyTechsOnNewTicket(args: {
  ticketId: number
  actorId: number
}) {
  try {
    // Obtener todos los técnicos activos excepto el que realiza la acción
    const techs = await prisma.users.findMany({
      where: {
        role: "tech",
        active: true,
        id: { not: args.actorId },
      },
      select: { id: true },
    })

    if (techs.length === 0) return

    // Crear una notificación por cada técnico en una sola operación
    await prisma.notifications.createMany({
      data: techs.map((t) => ({
        user_id: t.id,
        title: "Nuevo ticket creado",
        message: `Se ha creado un nuevo ticket #${args.ticketId}.`,
        ticket_id: args.ticketId,
      })),
    })
  } catch (e) {
    console.error("Error notifyTechsOnNewTicket:", e)
  }
}