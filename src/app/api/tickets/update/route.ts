import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const { id, status_id, assigned_to } = await req.json()

    const [procesoStatus, cerradoStatus, canceladoStatus, solucionadoStatus] = await Promise.all([
      prisma.status.findFirst({ where: { name: "Proceso" } }),
      prisma.status.findFirst({ where: { name: "Cerrado" } }),
      prisma.status.findFirst({ where: { name: "Cancelado" } }),
      prisma.status.findFirst({ where: { name: "Solucionado" } }),  // ← nuevo
    ])

    let resolvedStatusId = status_id

    if (assigned_to !== undefined && assigned_to !== null) {
      const currentTicket = await prisma.tickets.findUnique({
        where: { id },
        select: { status_id: true },
      })

      const isBlocked =
        currentTicket?.status_id === cerradoStatus?.id ||
        currentTicket?.status_id === canceladoStatus?.id

      if (isBlocked) {
        return NextResponse.json(
          { error: "No se puede reasignar un ticket Cerrado o Cancelado" },
          { status: 400 }
        )
      }

      resolvedStatusId = procesoStatus?.id ?? status_id
    }

    // ── Determinar si hay que sellar closed_at ──────────────────
    const isFinalStatus =
      resolvedStatusId === cerradoStatus?.id ||
      resolvedStatusId === solucionadoStatus?.id

    const updated = await prisma.tickets.update({
      where: { id },
      data: {
        status_id: resolvedStatusId,
        assigned_to,
        updated_at: new Date(),
        closed_at: isFinalStatus ? new Date() : undefined,  // ← nuevo
      },
    })

    return NextResponse.json({ success: true, ticket: updated })

  } catch (error) {
    console.error("ERROR UPDATE TICKET:", error)
    return NextResponse.json(
      { error: "Error actualizando ticket" },
      { status: 500 }
    )
  }
}