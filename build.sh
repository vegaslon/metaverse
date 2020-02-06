rm -rf app
mkdir app app/frontend app/server

cd frontend
npm run build:ssr
cp -r dist ../app/frontend

cd ../server
npm run build
cp -r dist ../app/server
cp -r assets ../app/server
cp -r templates ../app/server
cp -r package.json ../app/server