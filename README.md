# bStats

The parent repository of the [bStats] project.

## Repository structure

This repository contains all bStats repositories as submodules. These are

- `bstats-backend` - The backend of bStats.
- `bstats-web` - The frontend of bStats.
- `bstats-data-processor` - The service that processes incoming data from plugins.
- `bstats-metrics` - The Java-based metrics classes of bStats.

This repository also provides the development environment for bStats.

## Run bStats locally

### 0. Prerequisites

- Docker
- Linux. WSL2 is recommended for Windows. MacOS should work but is untested
- GNU Make (should be available on most Unix systems)

### 1. Clone repository

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

### 2. Update submodules

Switch to the `master` branch of all submodules using the following command:

```bash
git submodule foreach 'git checkout master'
```

### 3. Start the development environment

Then you can start all services by running the default target of the `Makefile`.
You need to provide credentials for [hCaptcha](https://www.hcaptcha.com/) and
[MaxMind GeoIP](https://www.maxmind.com/en/account):

```bash
PUBLIC_HCAPTCHA_SITE_KEY=your_site_key \
HCAPTCHA_SECRET_KEY=your_secret_key \
GEOIPUPDATE_ACCOUNT_ID=your_account_id \
GEOIPUPDATE_LICENSE_KEY=your_license_key \
make
```

After everything is up and running, bStats should be available at
<https://bstats.localhost/> with a self-signed certificate.

The services will run in Docker containers, thus no additional dependencies like
Node.js and npm are required (even though it is recommended to have them
installed for your IDE tooling).

The containers run in dev-mode, which means that the code is mounted into the
containers and features like hot-reloading are working. You can just start
editing the code without having to do any additional steps.

## Start Production

The `prod` directory contains the production environment for bStats.
You need to create the following env files from their examples:

- `prod/postgres.env`
- `prod/bstats-web.env`
- `prod/bstats-backend.env`
- `prod/geoipupdate.env`

You can then start the services by running `make start-prod`.

### Backups

Redis and Postgres data is backed up to a remote server via SCP.
Cronjobs can be set up with the `add-backup-cronjobs.sh` script in the `prod`
directory.

### Disaster Recovery

Assuming the worst happens and the current bStats server explodes. To get back
up running, perform the following steps:

1. Set up a new server with Docker and the http(s) port open
2. Clone this repository and all submodules (on the `master` branch)
3. Start the `prod` environment
4. Stop the `prod` environment
5. Restore the Redis backup (just replace the `prod/volumes/redis` dir)
6. Create the env files from their examples (see above)
7. Start the `prod` environment
8. Update the DNS settings to point to the new server IP
9. Ingest historic chart data from the postgres backup (not time critical)

## License

This project is licensed under the [MIT License](/LICENSE).

[bstats]: https://bStats.org
