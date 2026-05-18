# ============================================
# Stage 1: Dependencias
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias de forma reproducible con npm ci
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar el cliente Prisma antes del build
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario y grupo sin privilegios para mayor seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar assets públicos y crear carpeta de uploads con permisos correctos
COPY --from=builder /app/public ./public
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

# Copiar solo los artefactos necesarios del build (standalone mode de Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar el cliente Prisma generado (necesario en runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Ejecutar como usuario sin privilegios
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]