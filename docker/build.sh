rm -rf app
mkdir app app/frontend app/server

cd ../frontend
npm run build:ssr
cp -r dist ../docker/app/frontend

cd ../server
npm run build
cp -r dist ../docker/app/server
cp -r assets ../docker/app/server
cp -r package.json ../docker/app/server

cd ../docker
docker build -t tivolicloud/metaverse:latest .
docker save tivolicloud/metaverse:latest | ssh -C -p 9001 maki@tivolicloud.com docker load