FROM node:12.10

RUN mkdir /app
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . /app/
RUN npm start