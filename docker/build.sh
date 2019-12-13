rm -rf app
mkdir app

cd ../frontend
npm run build

cd ../server
npm run build
cp -r dist ../docker/app
cp -r assets ../docker/app
cp -r frontend ../docker/app
cp -r package.json ../docker/app

cd ../docker
docker build -t tivolicloud/metaverse:latest .
docker save tivolicloud/metaverse:latest | ssh -C -p 9001 maki@tivolicloud.com docker load