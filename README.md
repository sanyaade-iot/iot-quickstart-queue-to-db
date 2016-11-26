# iot-quickstart-queue-to-db
Features a NodeJS application whose only purpose is to shovel data from specific RabbitMQ queues to the database.


### Preparing development Flow for being offline, stuck at an airport

1. Set up docker containers for RabbitMQ and Postgres locally.
2. Make sure npm install was used to fetch all dependencies.


#### 1. RabbitMQ

https://hub.docker.com/_/rabbitmq/

```docker run -p 5672:5672 -p 15672:15672 rabbitmq:3-management```


#### 2. Postgresql

https://hub.docker.com/_/postgres/

```docker run --name=postgres961 -e POSTGRES_PASSWORD=iotquickstart -e POSTGRES_USER=iotquickstartdba -e POSTGRES_DB=iotquickstartdb  postgres:9.6.1```

### Run tests

```$ npm i; npm test```

### Run locally (docker containers need to be running)

```$ npm i; npm run start-local-peter```


### TODO

1. Use PG RxJS wrapper => https://github.com/jadbox/pg-rxjs
2. Use a logger library => https://github.com/nomiddlename/log4js-node
3. Add class dedicated to encapsulating the mapping logic for data between queue and 
database ```class QueueMessagePersistor {...}```. Currently this is embedded 
in ```EntityManager``` which is just plain wrong.
4. Reactive design for MicroService creation through Postgres LISTEN/NOTIFY feature: as 
records get added or removed from the table that stores the micro services, we also 
dynamically allocate/deallocate the associated resources like queues, schemas
5. Develop cross-platform UI (Web/Hybrid Mobile app: iOS, Android, Windows 10) with Ionic v2 and Loopback framework.
6. Add linter, make builds fail if linter fails.
7. Add code coverage: https://www.npmjs.com/package/istanbul
