FROM node:22.14-alpine

WORKDIR /usr/app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run","start:prod"]