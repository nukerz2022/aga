FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

RUN mkdir -p src/logs src/database

CMD ["node", "src/index.js"]
