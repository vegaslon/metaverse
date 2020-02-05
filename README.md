<img height="80" alt="metaverse" src="https://git.tivolicloud.com/tivolicloud/metaverse/raw/master/logo.png"/>

---

![pipeline status](https://git.tivolicloud.com/tivolicloud/metaverse/badges/master/pipeline.svg)
![coverage report](https://git.tivolicloud.com/tivolicloud/metaverse/badges/master/coverage.svg)

### Develop

To start developing, you need to run two commands simulatenously.

```bash
cd server
npm run start
```

```bash
cd frontend
npm run start
```

They will both incrementally watch for file changes. The metaverse should now be available at http://localhost:3000

### Distribute

```bash
cd docker
sh build.sh
```

Which will create a docker image that you can use. See `upload.sh` on how to upload the image to a Linux server.
