# PocketPark App

Frontend of PocketPark, a real-time geospatial platform for park navigation and environmental education. I built it as my MSc thesis (Electronic & Computer Engineering, Technical University of Crete). It's still live at **[pocketpark.themi.dev](https://pocketpark.themi.dev)**.

## Architecture

PocketPark runs as three services:

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

This repo is the Next.js + TypeScript frontend: interactive Leaflet maps, park/place/activity browsing, live visitor positions, and observation logging.

The other two services:

- [pocketpark-cms](https://github.com/tkutsu/pocketpark-cms) is a Strapi content service (parks, places, activities, taxa, observations) exposing a GraphQL API.
- [pocketpark-realtime](https://github.com/tkutsu/pocketpark-realtime) is a Socket.io + Redis pub/sub service that broadcasts live user geolocation.

## Stack

Next.js, React, TypeScript, Leaflet, SWR + graphql-request, Sass modules. Runs on pm2 + nginx on a self-managed VPS.

## About this repo

This is a public mirror of the private development repo (2021–2024). Config comes from `.env`; see `src/shared/constants` for the variables it reads.
