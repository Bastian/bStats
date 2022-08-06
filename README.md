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
> [`/volumes/nginx/nginx.conf`](/volumes/nginx/nginx.conf).

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

- Docker and Docker Compose (v1)
- Linux. WSL2 is recommended for Windows. MacOS should work but is untested
- GNU Make (should be available on most Unix systems)

Additionally, you need a Firebase account place the `firebase-config.json` file
and the `service-account-file.json` file in the root of this repository.

- [Learn about the Google service account file]
- [Learn about the Firebase config file]

Then you can start all services by running `make`. The services will run in
Docker containers, thus no additional dependencies like Node.js and npm are
required (even though it is recommended to have them installed for your IDE
tooling).

## License

This project is licensed under the [MIT License](/LICENSE).

[bstats]: https://bStats.org
[learn about the google service account file]: https://cloud.google.com/docs/authentication/getting-started
[learn about the firebase config file]: https://firebase.google.com/docs/web/setup?authuser=0#config-object
