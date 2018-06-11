FROM node:latest

WORKDIR /usr/src/app
COPY package.json ./

RUN npm install

COPY . .
COPY secret/index-sample.js /usr/src/app/secret/index.js

EXPOSE 4000

CMD ["npm", "start"]
