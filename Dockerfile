FROM alpine:latest

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
# node
nodejs npm \
# for: sharp
vips \
# for: puppeteer
chromium nss \
ttf-roboto font-noto font-noto-cjk \
# custom fonts
wget fontconfig \
&& \
mkdir -p /usr/share/fonts/TTF && \
# font: Twemoji Mozilla
wget -P /usr/share/fonts/TTF https://github.com/mozilla/twemoji-colr/releases/download/v0.5.0/TwemojiMozilla.ttf && \
fc-cache -fv


COPY app/server/package.json /app/server/package.json
WORKDIR /app/server
RUN \
npm i --only=prod && \
apk del builds-deps

COPY app /app
CMD node /app/server/dist/main.js