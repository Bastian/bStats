# Contributing guide

Thank you for your interest in contributing to bStats! This guide outlines
important points to consider before you start, provides an overview of the
project’s architecture, and offers instructions for specific development tasks.

## General things to consider

- For any larger changes, it's a good idea to open an issue first to discuss
  them. This helps ensure you don't waste time on something that isn't wanted.
- bStats is not dead, but it also isn't very actively developed. Be aware that
  it might take a while before your PR is reviewed. Making it easy to review
  will greatly increase the chances of it getting merged.
- Test all your changes thoroughly and explain how you tested them in the PR
  description.
- Write meaningful commit messages. See
  [this guide](https://chris.beams.io/posts/git-commit/) on how to do so.
- Expect very mixed code quality. This project is quite old, and especially its
  older parts can be somewhat messy. Please don't judge too harshly ;-)

## Architecture Overview

bStats consists of the following main components:

- **The legacy bStats backend and frontend** ("bstats-legacy"). This is the
  original version of bStats. It's an Express Node.JS application (no
  TypeScript) with a frontend built using the EJS templating engine. This is the
  oldest (and most outdated) part of bStats. It is mostly used for the website
  and related backend features (account management, creating/editing plugins,
  etc.). It is no longer used for data collection or data serving.
- **A somewhat newer backend** written in TypeScript ("bstats-backend") using
  NestJS. Although newer than the legacy backend, it's still old by modern
  JavaScript standards. This part handles data collection and serving.
- **A new frontend** ("bstats-frontend"). You can completely ignore this one. It
  is not used anywhere and is in an unfinished state.
- **A Redis database.** This is the main database for bStats, storing both the
  data sent by services and the data required to operate bStats (account data,
  plugin settings, etc.).
- **A Postgres database.** Used only for storing historical data. Data is
  periodically moved from Redis to Postgres. It does **not** store plugin
  settings or account data.
- **bStats Metrics classes.** These are what plugin authors include in their
  services to send data back to bStats.

## Setup a local environment to test your changes

See the README for instructions.

## Guide for specific tasks

### Adding support for new platforms

There are frequent requests for adding support for new platforms to bStats. This
guide is intended to make contributing easier by outlining the necessary steps
and clarifying what is expected to ensure your PR is accepted. Read the
following steps carefully.

#### What platforms are allowed?

- The platform must be related to Minecraft.
- The platform should have a reasonable user base and have been around for some
  time.
- Services for the platform must under no circumstances be intended to run on
  end-user devices (e.g., client mods). If they can run on both end-user devices
  and servers, the service must only send data to bStats when it runs on a
  server.
- Services should be written in Java. Other languages are not supported by the
  existing Metrics classes and require significant work to implement from
  scratch. If you still think it's worth the effort, please discuss it with me
  first!

#### Create a new platform

Platforms are not hard-coded in the codebase but stored as configuration in the
Redis database. You can find the existing platforms in the
[`populator.service.ts` file in the bstats-backend][populator.service.ts]. This
file populates the Redis database with initial data. For local testing, add your
new platform there, wipe the Redis database, and start the backend again. The
new platform should now appear on the website. There's no documented format for
the platform configuration, so check the existing platforms to see how they're
structured.

Global stats (like <https://bstats.org/global/bukkit>) are just regular plugins
referenced by platforms in the `globalPlugin` field. If your platform should
have global stats (which most do), also add this plugin in the
`populator.service.ts` file.

Depending on the platform, you might want to add new "request parsers." The
existing parsers are located [here][request-parsers]. These parse the data sent
by services into a more suitable format for bStats (for example, extracting the
server software name and Minecraft version from something like
`git-Paper-196 (MC: 1.20.1)` returned by `Bukkit.getVersion()`).

#### Create a new Metrics class

You can find the existing Metrics classes in the `bstats-metrics` submodule.
Familiarize yourself with the existing code structure. Once you are faimilar
with it, adding a new Metrics class should be straightforward. Keep these points
in mind:

- Special care should be taken to ensure that the Metrics class is compatible
  with as many platform versions as possible. Avoid using features that only
  exist in newer versions or that are likely to change. Use reflection for edge
  cases (for example, when Bukkit changed the return type of
  `Bukkit.getOnlinePlayers()` from an array to a collection).
- For new platforms, avoid creating the configuration file with platform-native
  libraries. Older platforms like Bukkit, Bungeecord, and Sponge do so for
  legacy reasons, but newer ones like Velocity use the self-written
  `org.bstats.config.MetricsConfig` class. This reduces the chance of breakage
  if the platform changes its file format (which has happened in the past) and
  also simplifies your code.
- Think carefully about where (i.e., file path) the configuration file should be
  placed. This is a decision that is written in stone and cannot be changed
  later. Please include your reasoning in the PR description.
- Send the data as "raw" as possible. Don't try to pre-process it (for example,
  extracting the Minecraft version from `Bukkit.getVersion()`).

#### Update the documentation on the website

The website contains references to various platforms, such as the Getting
Started guide. These pages should be updated to include your new platform.

> While you are at it, maybe you'd like to improve the documentation in general
> in a separate PR? ;-)

#### Prepare the Pull Request

When creating PRs for a new platform, I expect:

- A description of the platform, assuming I'm not familiar with it. Mention
  anything important I should know.
- Your thought process on important decisions (e.g., file path for the config,
  why you did or did not add a global plugin, etc.).
- That you have thoroughly tested your code, including:
  - Trying it with different versions of the platform (both old and the latest).
    Let me know the oldest version tested (and ideally when that version was
    released).
  - Testing the Metrics class with a build tool (Maven/Gradle) as well as the
    copy-and-paste version.
- That your code follows the existing code style and has a decent code quality.

## Glossary

- **Platform**: Usually an API/server/software that can be extended with plugins
  or mods (e.g., Bukkit, Bungeecord, Sponge). There are also "meta"-platforms
  like "Server Implementation" and "Other" for cases such as "Paper."
- **Service**: A piece of software that sends data to bStats (for example, a
  plugin like EssentialsX or WorldEdit, or a server implementation like Paper).
- **Software**: Legacy wording for "Platform." I try to avoid this term in favor
  of "Platform."
- **Plugin**: Legacy wording for "Service." I try to avoid this term in favor of
  "Service," which is more general (e.g., Paper is not a plugin).
- **tms2000**: Chart data is collected in 30-minute intervals. If you're
  familiar with Unix timestamps, you can think of `tms2000` as a timestamp with
  a 30-minute resolution starting from Feb 1, 2000 ([for stupid
  reasons][tms2000-bug]). It stands for "**t**hirty **m**inutes **s**ince
  **2000**."

[tms2000-bug]: https://github.com/Bastian/bstats-data-processor/blob/7737e4db3833d0f14dc06c5f8276e48a869841ce/src/date_util.rs#L4-L12
[request-parsers]: https://github.com/Bastian/bstats-backend/tree/master/src/data-submission/parser
[populator.service.ts]: https://github.com/Bastian/bstats-backend/blob/master/src/database/populator.service.ts
