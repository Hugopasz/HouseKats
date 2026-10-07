# Imagem do House Kats. Duas etapas: a primeira monta o front, a segunda só roda.
#
# Node 24 porque o app usa node:sqlite (DatabaseSync), que só é estável a partir
# dele — e porque assim o banco não precisa de compilação nativa nenhuma, que é
# exatamente a dor que fez este projeto escolher node:sqlite no Windows.

# ----------------------------------------------------------------- etapa 1
FROM node:24-slim AS build
WORKDIR /app

# package*.json antes do resto de propósito: enquanto as dependências não
# mudarem, o Docker reaproveita esta camada e o deploy leva segundos.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ----------------------------------------------------------------- etapa 2
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

# Só o que roda: vite e typescript ficaram para trás na etapa de build.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server ./server
COPY --from=build /app/dist ./dist

EXPOSE 3777
CMD ["node", "--no-warnings=ExperimentalWarning", "server/index.js"]
