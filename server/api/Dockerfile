# syntax=docker/dockerfile:1.6

# -------- Deps + Build (com devDeps) --------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    COPY package.json package-lock.json ./
    ENV NPM_CONFIG_ENGINE_STRICT=false
    
    # Troca npm ci -> npm install para contornar lock desatualizado
    RUN npm install --no-audit --no-fund
    
    COPY . .
    #products.json está na raiz do projeto (api/products.json)
    COPY products.json ./dist/products.json
    RUN npm run build   # gera dist/
    
    
    # -------- Runtime (apenas prod deps) --------
    FROM node:20-alpine AS runtime
    WORKDIR /app
    
    COPY package.json package-lock.json ./
    RUN npm install --no-audit --no-fund
    
    # Copia artefatos do build
    COPY --from=builder /app/dist ./dist
    # (se precisar de sql/scripts, copie aqui também)
    
    EXPOSE 8080
    CMD ["npm","run","start"]
    