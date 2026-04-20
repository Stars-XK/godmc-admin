# Refactoring the API Gateway to a Pure Routing Gateway

## 1. Context & Motivation

Currently, the `api-gateway` uses a "dual-development" proxy mode:
- **API Gateway:** Contains HTTP Controllers, Swagger decorators, DTOs, and proxy Services that map HTTP requests to TCP messages.
- **Microservices (e.g., `micro-system`, `micro-water-basic`):** Contains TCP MessagePattern Controllers and the actual business Services (TypeORM).

**Pain Points:**
1. Code duplication (DTOs and HTTP logic in Gateway, actual logic in Microservice).
2. Adding a simple CRUD endpoint requires modifying two separate codebases.
3. The Gateway is bloated with module-specific code.

**Goal:**
Refactor the architecture so that:
- Microservices expose HTTP APIs directly (with Swagger, DTOs, and Guards).
- The `api-gateway` acts purely as a routing gateway, forwarding HTTP requests to the appropriate downstream microservice based on URL prefixes (e.g., `/api/water-basic/*` -> `http://localhost:3006/*`).

## 2. Approach Options

### Option A: Node.js Reverse Proxy (http-proxy-middleware)
- Transform `api-gateway` into a simple Express/NestJS app using `http-proxy-middleware`.
- Forward `/api/system/*` to `micro-system`, `/api/water-basic/*` to `micro-water-basic`, etc.
- **Trade-offs:** 
  - Pros: Very lightweight, pure routing, easy to implement in the existing Node ecosystem.
  - Cons: Requires modifying all microservices from TCP microservices to HTTP REST APIs.

### Option B: Keep TCP, Use API Gateway Dynamic Dispatch
- Keep microservices as TCP.
- Make the Gateway fully dynamic (e.g., GraphQL Federation or dynamic TCP routing).
- **Trade-offs:** Too complex, loses Swagger auto-generation from microservices.

### Option C: External Gateway (Nginx / Kong)
- Completely remove the Node.js `api-gateway` app.
- Use Nginx or Kong to route requests directly to microservices.
- **Trade-offs:** Requires infrastructure changes, harder for local development.

## 3. Recommended Approach (Option A - Step-by-Step Refactoring)

Since refactoring the entire system at once is too risky and massive, we will do a **Strangler Fig pattern** refactoring, starting with the newly created `micro-water-basic`.

### Step 1: Transform `micro-water-basic` to a Hybrid (or pure HTTP) app.
- Modify `server/apps/micro-water-basic/src/main.ts` to create an HTTP application (`NestFactory.create`) instead of just a TCP microservice.
- Move the `ZoneController` from `api-gateway` (which has `@Get`, `@Post`, Swagger, DTOs, and Guards) directly into `micro-water-basic`.
- Remove the TCP MessagePattern from `micro-water-basic`.
- Ensure `micro-water-basic` has access to `JwtAuthGuard` (which it does, since guards are in `libs/common`).

### Step 2: Implement HTTP Proxy in `api-gateway`
- Install `http-proxy-middleware` in the gateway.
- Configure the gateway to forward any request starting with `/water-basic` to `http://127.0.0.1:3006`.
- Delete the `water-basic` module from `api-gateway`.

### Step 3: Validate and Iterate
- Test the new HTTP routing for `water-basic`.
- If successful, this proves the pattern. Other modules (system, monitor, etc.) can be migrated one by one in the future.

## 4. Specific Refactoring Plan for `water-basic`

1. **Move Controllers:**
   - Copy `server/apps/api-gateway/src/module/water-basic/zone/zone.controller.ts` to `server/apps/micro-water-basic/src/module/zone/zone.controller.ts`.
   - Update imports in `zone.controller.ts`.

2. **Merge Services:**
   - Merge the `importData` and `export` logic (currently in gateway's `zone.service.ts`) into `micro-water-basic`'s `zone.service.ts`.
   
3. **App Initialization:**
   - Change `micro-water-basic/src/main.ts` to use `NestFactory.create(MicroWaterBasicModule)` and listen on `3006`.
   - Set up Swagger and GlobalPipes in `micro-water-basic` so it can validate DTOs independently.

4. **Setup Proxy in Gateway:**
   - In `api-gateway/src/main.ts` or `app.module.ts`, configure `createProxyMiddleware('/water-basic', { target: 'http://127.0.0.1:3006', changeOrigin: true })`.
   - Delete `api-gateway/src/module/water-basic`.

---

**Do you approve this design?** If yes, I will create the implementation plan and execute it.