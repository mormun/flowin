import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { prisma } from "@/lib/prisma"

// GET /api/attachments/download/[id]
// Descarga un archivo adjunto por su ID.
// En local (Docker): lee el fichero del volumen montado en /public.
// En producción: redirige a la URL externa (Vercel Blob / Supabase Storage).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const attachmentId = Number(id)

    // Validar que el ID sea un número válido
    if (!attachmentId) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // Buscar el adjunto en BD
    const attachment = await prisma.attachments.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    const filePath = attachment.file_path

    // Validar que exista ruta
    if (!filePath) {
      return NextResponse.json({ error: "Ruta de archivo no válida" }, { status: 500 })
    }

    // Si es URL externa (producción), redirigir directamente
    if (filePath.startsWith("http")) {
      return NextResponse.redirect(filePath)
    }

    // Si es ruta local (Docker), leer el fichero del sistema de archivos
    const fullPath = path.join(process.cwd(), "public", filePath)
    const fileBuffer = await readFile(fullPath)

    // Mapa de extensiones a tipos MIME
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

    // Devolver el fichero forzando descarga con Content-Disposition
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error descargando archivo:", error)
    return NextResponse.json({ error: "Error descargando archivo" }, { status: 500 })
  }
}