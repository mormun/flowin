import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attachmentId = Number(id)

    if (!attachmentId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const attachment = await prisma.attachments.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    const filePath = attachment.file_path

    // Si es URL de Supabase (producción), redirigir
    if (filePath && filePath.startsWith("http")) {
      return NextResponse.redirect(filePath)
    }

    // Si es ruta local (desarrollo Docker), leer del volumen
    if (!filePath) {
      return NextResponse.json({ error: "Ruta de archivo no válida" }, { status: 500 })
    }

    const fullPath = path.join(process.cwd(), "public", filePath)
    const fileBuffer = await readFile(fullPath)

    // Detectar tipo MIME básico
    const ext = path.extname(attachment.filename || "").toLowerCase()
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".zip": "application/zip",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error descargando archivo:", error)
    return NextResponse.json(
      { error: "Error descargando archivo" },
      { status: 500 }
    )
  }
}