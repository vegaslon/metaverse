# build the metaverse!

FROM node:lts

WORKDIR /build
COPY server /build/server
COPY frontend /build/frontend
COPY build.sh /build/build.sh

RUN ./build.sh

# package the metaverse!

FROM ubuntu:20.04 

ENV \
NODE_ENV=production \
CHROME_BIN=/usr/bin/google-chrome-stable \
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
DEBIAN_FRONTEND=noninteractive

RUN \
apt-get update -y && \
apt-get install -y curl fonts-roboto fonts-noto fontconfig && \ 
# install nodejs
curl -sL https://deb.nodesource.com/setup_lts.x | bash - && \
apt-get install -y nodejs && \
npm i -g yarn node-gyp pm2 && \
# install twemoji mozilla
curl -Lo /usr/share/fonts/truetype/TwemojiMozilla.ttf https://github.com/mozilla/twemoji-colr/releases/download/v0.5.1/TwemojiMozilla.ttf && \
fc-cache -fv && \
# install google chrome
curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
apt-get install -y ./google-chrome-stable_current_amd64.deb && \
rm -f google-chrome-stable_current_amd64.deb

COPY --from=0 /build/app /app

WORKDIR /app/server
RUN yarn install --production

CMD pm2-runtime /app/server/ecosystem.config.js