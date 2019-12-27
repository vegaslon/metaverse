FROM node:alpine

ENV \
CHROME_BIN="/usr/bin/chromium-browser" \
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" > /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \

# compiling: bcrypt 
apk add --no-cache --virtual builds-deps build-base python3 && \

apk add --no-cache \
# for: sharp
vips \
# for: puppeteer
chromium nss \
ttf-roboto font-noto font-noto-cjk \
&& \

COPY app /app
WORKDIR /app/server
RUN npm i --only=prod

RUN apk del builds-deps

CMD node /app/server/dist/main.js