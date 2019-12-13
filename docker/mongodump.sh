#!/bin/bash
docker-compose exec db mongodump -d metaverse -o /data/db
sudo mv db/metaverse mongodump
