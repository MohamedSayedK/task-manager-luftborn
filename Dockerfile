# syntax=docker/dockerfile:1

# Two images from one file: `web` (the Angular app behind nginx) and `api` (the JSON Server
# mock backend). docker-compose.yml builds both.

# ---- Build the Angular app -------------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is cached until package-lock.json changes. The scripts are
# skipped because the `prepare` script installs Husky, which a container has no use for.
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx ng build

# ---- web: static files and the /api proxy ----------------------------------------------------
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/task-manager/browser /usr/share/nginx/html
EXPOSE 80

# ---- api: the mock backend -------------------------------------------------------------------
FROM node:24-alpine AS api
WORKDIR /app
# Only JSON Server is needed here. The version is the one the project uses.
RUN npm install --no-save --no-package-lock --no-audit --no-fund json-server@1.0.0-beta.15
COPY mock-api/db.json ./db.json
EXPOSE 3000
# The data lives inside the container, so it starts fresh every time the container is created.
CMD ["npx", "json-server", "db.json", "--port", "3000", "--host", "0.0.0.0"]
