FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production=false

COPY . .

RUN npm run build api-gateway
RUN npm run build micro-auth
RUN npm run build micro-system
RUN npm run build micro-monitor
RUN npm run build micro-upload
RUN npm run build micro-tools

CMD ["npm", "run", "start:prod", "api-gateway"]
