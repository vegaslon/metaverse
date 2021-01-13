FROM tivolicloud/metaverse-base:latest

COPY \
app/server/package.json \
app/server/yarn.lock \
/app/server/

WORKDIR /app/server
RUN yarn install --production

COPY app /app

EXPOSE 3000

CMD pm2-runtime /app/server/ecosystem.config.js