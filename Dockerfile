# ---- Build stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL=postgresql://localhost/placeholder npx prisma generate

COPY src ./src
RUN npm run build

# ---- Production stage ----
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init \
  && addgroup -S nodejs && adduser -S nodejs -G nodejs \
  && chown nodejs:nodejs /app

# Copy compiled output, prisma files, and all node_modules (includes prisma CLI for migrations).
# Ownership is set while copying: a separate `chown -R` afterwards took minutes and duplicated
# node_modules into another image layer, roughly doubling the image size.
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs package.json prisma.config.ts docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nodejs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
