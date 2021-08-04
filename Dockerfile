FROM registry.tivolicloud.com/tivolicloud-private/metaverse:base

COPY \
app/server/package.json \
app/server/yarn.lock \
/app/server/

WORKDIR /app/server
RUN yarn install --production
# TODO: run tokenizer-server.py once so it downloads dataset

COPY app /app

EXPOSE 3000

CMD pm2-runtime /app/server/ecosystem.config.js