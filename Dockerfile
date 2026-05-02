FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

FROM node:20-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* vars are baked into the JS bundle at build time, so they
# must be passed as build args when constructing the production image.
# Example:  docker build --build-arg NEXT_PUBLIC_API_URL=https://api.topdee.com ./frontend
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
