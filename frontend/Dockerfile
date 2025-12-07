# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Copy all other files
COPY . .

# Final stage
FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules

COPY . .

CMD ["npm", "start"]
