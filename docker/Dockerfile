FROM node:alpine

RUN apk add --no-cache --virtual builds-deps build-base python3 && \
apk add --no-cache vips --repository https://alpine.global.ssl.fastly.net/alpine/edge/community

COPY app /app
WORKDIR /app/server
RUN npm i

RUN apk del builds-deps

CMD node /app/server/dist/main.js