FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm ci --include=dev && npm --prefix frontend ci --include=dev

COPY . .

ENV BACKEND_ORIGIN=http://127.0.0.1:3000
RUN npm run build && npm --prefix frontend run build

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000

CMD ["node", "scripts/start-web.cjs"]
