FROM alpine:edge

ENV \
NODE_ENV=production \
CHROME_BIN=/usr/bin/chromium-browser \
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN \
echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
# compiling: bcrypt 
apk add --no-cache --virtual builds-deps build-base python3 unzip && \
apk add --no-cache \
# node
nodejs yarn \
# for: sharp
vips \
# for: puppeteer
chromium nss \
font-noto font-noto-cjk \
# custom fonts
wget fontconfig \
&& \
mkdir -p /usr/share/fonts/TTF && \
# font: Roboto
wget -O /usr/share/fonts/TTF/roboto.zip https://fonts.google.com/download?family=Roboto && \
unzip /usr/share/fonts/TTF/roboto.zip "*.ttf" && \
# font: Twemoji Mozilla
wget -P /usr/share/fonts/TTF https://github.com/mozilla/twemoji-colr/releases/download/v0.5.0/TwemojiMozilla.ttf && \
\
fc-cache -fv

COPY \
app/server/package.json \
app/server/yarn.lock \
/app/server/

WORKDIR /app/server
RUN \
yarn global add node-gyp pm2 && \
yarn install --production && \
apk del builds-deps

COPY app /app
CMD pm2-runtime /app/server/ecosystem.config.js