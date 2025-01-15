# bStats

The parent repository of the [bStats] project.

## Repository structure

This repository contains all bStats repositories as submodules. These are

- `bstats-backend` - The backend of bStats.
- `bstats-web` - The (new) frontend of bStats.
- `bstats-legacy` - The original backend and frontend of bStats.
- `bstats-metrics` - The Java-based metrics classes of bStats.

> Currently bStats is in a transition phase from the original backend + frontend
> to a complete rewrite. The "live" version of bStats is currently running with
> the old frontend and a combination of old and new backend. Which routes are
> served by which backend can be found in the nginx configuration at
> [`/prod/volumes/nginx/nginx.conf`](/prod/volumes/nginx/nginx.conf).

This repository also provides the development environment for bStats.

## Clone repository

When cloning the repository, it is recommended to use the `--recursive`
flag to clone the repository with all submodules.

```bash
git clone --recursive git@github.com:Bastian/bStats.git
```

Alternatively, you can also clone the submodules after cloning this parent
repository by running

```bash
git submodule init && git submodule update
```

## Start Development

There are some prerequisites for development:

- Docker
- Linux. WSL2 is recommended for Windows. MacOS should work but is untested
- GNU Make (should be available on most Unix systems)

Additionally, you need a Firebase account place the `firebase-config.json` file
and the `service-account-file.json` file inside the `dev` directory (only for
the new frontend).

- [Learn about the Google service account file]
- [Learn about the Firebase config file]

Next, rename the `/prod/postgres.env.example` file to `/prod/postgres.env` and
replace the `POSTGRES_PASSWORD` with a random (long) string of your choosing.

Then you can start all services by running `make`. The services will run in
Docker containers, thus no additional dependencies like Node.js and npm are
required (even though it is recommended to have them installed for your IDE
tooling).

## Start Production

The `prod` directory contains the production environment for bStats. Similar to
the dev environment, you have to place the `firebase-config.json` file and the
`service-account-file.json` file inside the `prod` directory.
Additionally, you have to update the `prod/volumes/bstats-legacy/config.json`
file with your Recaptcha secrets and replace the `sessionSecret` with a random
(long) string of your choosing.

You can then start the services by running `make start-prod`.

### Backups

Redis and Postgres data is backed up to AWS S3. AWS credentials have to be
provided in a `AWS.env` file in the `prod` directory. Afterwards, cronjobs can
be set up with the `add-backup-cronjobs.sh` script in the `prod` directory.

A lifecycle configuration for S3 is given in the
`prod/s3-lifecycle-config.json` file.

### Disaster Recovery

Assuming the worst happens and the current bStats server explodes. To get back
up running, start the `prod` environment on a new server once and stop it after
it has successfully started. Then place the backup Redis dumps (`dump.rdb`) in
the `prod/volumes/redis/node-<x>m` directory. Make sure that the dump file is
the correct one for the current node. You can look at the
`prod/volumes/redis/node-<x>m/nodes.conf` file to find out for which key-range
the node is responsible.
You can then start the prod again and everything should work again (if it is a
new server with a new IP, you ofc also have to update the DNS settings in
Cloudflare).

## License

This project is licensed under the [MIT License](/LICENSE).

[bstats]: https://bStats.org
[learn about the google service account file]: https://cloud.google.com/docs/authentication/getting-started
[learn about the firebase config file]: https://firebase.google.com/docs/web/setup?authuser=0#config-object
