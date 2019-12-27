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
# custom fonts
wget fontconfig \
&& \

# custom fonts
mkdir -p /usr/share/fonts/noto /usr/share/fonts/TTF && \
# font: noto color emoji
wget -qO- https://noto-website-2.storage.googleapis.com/pkgs/NotoColorEmoji-unhinted.zip | \
busybox unzip -p - NotoColorEmoji.ttf > /usr/share/fonts/noto/NotoColorEmoji.ttf && \

fc-cache -fv

COPY app /app
WORKDIR /app/server
RUN npm i --only=prod

RUN apk del builds-deps

CMD node /app/server/dist/main.js