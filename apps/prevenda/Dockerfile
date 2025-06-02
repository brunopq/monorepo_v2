FROM oven/bun:1

WORKDIR /app

COPY package.json ./
COPY app ./
COPY public ./
COPY drizzle ./
COPY drizzle.config.ts ./

EXPOSE 5173

CMD ["bun", "dev"]