## Installation

```bash
$ yarn install
```

## Running the app on local host (change host in development.yml to 'localhost' and port in defaul.yml to '1486')
## Origin file run with docker machine
```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod

#dump postgreSQL
##backup
$ docker exec -t {DB_PG_CONTAINER} pg_dump -U {POSTGRES_USER} {POSTGRES_DB} > {dump_name}
$ docker exec -t department-report-db pg_dump -U postgres department-report > department_report_dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
##restore
$ docker exec -i {DB_PG_CONTAINER} psql -U {POSTGRES_USER} {POSTGRES_DB} < {dump_name}
$ docker exec -i department-report-db psql -U postgres department-report < department_report_dump_25-06-2020_20_41_30.sql