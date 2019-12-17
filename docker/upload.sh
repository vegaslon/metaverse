#docker save tivolicloud/metaverse:latest | ssh -C -p 9001 maki@tivolicloud.com docker load

docker save tivolicloud/metaverse:latest | gzip | pv | \
ssh -p 9001 maki@tivolicloud.com docker load