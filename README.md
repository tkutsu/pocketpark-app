# PocketPark — App

Frontend of **PocketPark**, a real-time geospatial platform for park navigation and environmental education. Built as my MSc thesis (Electronic & Computer Engineering, Technical University of Crete) and still live at **[pocketpark.themi.dev](https://pocketpark.themi.dev)**.

## Architecture

PocketPark runs as three cooperating services:

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

- **This repo** — Next.js + TypeScript frontend: interactive Leaflet maps, park/place/activity browsing, live visitor positions, observation logging.
- [**pocketpark-cms**](https://github.com/tkutsu/pocketpark-cms) — Strapi content service (parks, places, activities, taxa, observations) exposing a GraphQL API.
- [**pocketpark-realtime**](https://github.com/tkutsu/pocketpark-realtime) — Socket.io + Redis pub/sub service broadcasting live user geolocation.

## Stack

Next.js · React · TypeScript · Leaflet · SWR + graphql-request · Sass modules · pm2 + nginx on a self-managed VPS

## About this repo

Public mirror of the private development repository (2021–2024). Environment configuration is provided via `.env` (see `src/shared/constants` for the variables consumed).
