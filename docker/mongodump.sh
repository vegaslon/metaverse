#!/bin/bash
docker-compose exec db mongodump -d metaverse -o /data/db
sudo rm -rf mongodump.old
sudo mv mongodump mongodump.old
sudo mv db/metaverse mongodump
