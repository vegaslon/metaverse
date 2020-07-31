rm -rf app
mkdir -p app/server app/frontend

cd server
yarn install
yarn build
cp -R dist ../app/server
cp -R assets ../app/server
cp -R templates ../app/server
cp package.json ../app/server
cp yarn.lock ../app/server
cp ecosystem.config.js ../app/server
cd ..

cd frontend
yarn install
yarn build:ssr
cp -R dist ../app/frontend
cd ..