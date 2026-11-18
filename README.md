# PocketPark App

The frontend of PocketPark, a map app for finding your way around parks and
learning about what lives in them. I built it for my MSc thesis in Electronic &
Computer Engineering at the Technical University of Crete, and it's still
running at [pocketpark.themi.dev](https://pocketpark.themi.dev).

## How it fits together

PocketPark is three services:

```
┌──────────────────────┐   GraphQL    ┌──────────────────────────┐
│  app  (this repo)    │ ───────────▶ │  pocketpark-cms          │
│  Next.js + Leaflet   │              │  Strapi + MariaDB        │
└─────────┬────────────┘              └──────────────────────────┘
          │ Socket.io
          ▼
┌──────────────────────┐
│  pocketpark-realtime │
│  Socket.io + Redis   │
└──────────────────────┘
```

This repo is the Next.js and TypeScript frontend: the Leaflet maps, browsing
parks, places and activities, watching other visitors move around live, and
logging what you spot.

The other two:

- [pocketpark-cms](https://github.com/tkutsu/pocketpark-cms) is the Strapi
  backend for the content (parks, places, activities, species, observations),
  served over GraphQL.
- [pocketpark-realtime](https://github.com/tkutsu/pocketpark-realtime) is a
  small Socket.io and Redis service that passes visitors' live positions around.

## Stack

Next.js, React, TypeScript, Leaflet, SWR with graphql-request, and Sass modules.
It runs under pm2 behind nginx on a VPS I look after myself.

## About this repo

It's a public copy of the private repo I worked in from 2021 to 2024. Config
comes from `.env`, and `src/shared/constants` shows which variables it reads.
