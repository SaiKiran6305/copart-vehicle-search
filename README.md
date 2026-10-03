# copart-vehicle-search

## Copart Vehicle Search Prototype

A vehicle-search prototype for a Software Engineering Intern take-home assignment. It exposes a paginated REST API over synthetic vehicle auction records. No real Copart data is used.

Live demo: https://copart-vehicle-search.up.railway.app/

## Technology

- Backend: Java 17 and Spring Boot
- Spring Web, Spring Data JPA, and Hibernate
- H2 for local development and tests
- Maven
- JUnit 5 and MockMvc
- Frontend: React, JavaScript, Vite, HTML5, and CSS3

The React interface and Spring Boot API are packaged together for local development and container deployment.

## Local development

Requirements: Java 17, Maven, and Node.js/npm.

Start the backend from the repository root:

```sh
cd backend
mvn spring-boot:run
```

The backend listens on port 8080 during local development. On startup it loads 300 synthetic vehicle records from `backend/src/main/resources/vehicles.json`. In another terminal, start the React development server:

```sh
cd frontend
npm install
npm run dev
```

Open the development address printed by Vite. Vite forwards `/api` requests to the Spring Boot server on port 8080. The browser uses relative `/api` requests locally and when hosted.

Run the backend tests with:

```sh
cd backend && mvn test
```

Build the frontend with:

```sh
cd frontend
npm run build
```

The output is generated in `frontend/dist`.

## Railway deployment

The repository-root `Dockerfile` builds the React app, copies the production files into Spring Boot's static resources, and packages the frontend and API into one runnable image. Railway can detect and build this root `Dockerfile`; the application listens on Railway's `PORT` environment variable.

After connecting the GitHub repository to a Railway service, use the repository root as the source directory and the root `Dockerfile` for the build. Once the service deploys, generate a public domain in the service's Networking settings. Railway provides the public URL; the current deployment is at https://copart-vehicle-search.up.railway.app/.

## Frontend

The responsive search interface uses the backend API for vehicle data. It includes free-text search, make/model, primary damage, condition, estimated-value and year filters, combined sort choices, configurable page size, paginated card results, and loading, validation, error, and empty-result states. Make and model options are linked. Dropdown filters apply immediately together with any text or years already typed; text and year changes apply on Search or Enter. While a new page loads, the current cards stay visible (dimmed) so the page does not jump. Each card shows a photo chosen by the model's body style (labelled "Representative photo" and described in its alt text), a colour-coded primary damage badge, and the condition. The first load shows skeleton cards, and the AI search button shows a spinner while it waits. When 0–3 vehicles match, the page checks how many each active filter is costing and offers buttons such as "Remove Under $5,000 → 19 vehicles". The compact search bar appears only after the full search panel has scrolled out of view. On phones the filters collapse behind a "Show filters" button that shows how many are active. The applied search (filters, sort, page size, and page) is kept in the URL, for example `/?make=Toyota&damage=Hail&sortBy=estimatedValue&direction=desc&page=2`, so a refresh keeps the results, Back and Forward step through searches, and links can be shared. Unknown values in a link are ignored. Saved vehicle hearts persist in local storage and sync across tabs in the same browser profile; they are not shared between separate profiles or devices. Vehicle cards use four columns on wide screens, three on smaller desktop widths, two on tablets, and one on narrow phones.

The frontend is a Vite app for local development and is bundled into the Spring Boot application by the root Dockerfile for deployment.

## Database

Local development uses a persistent file-based H2 database at `jdbc:h2:file:./data/copartdb`, with username `sa` and an empty password. The database files are stored under `backend/data` when started from the backend directory. Hibernate updates the local schema. The H2 web console is disabled by default; start the backend with `H2_CONSOLE_ENABLED=true` to use it locally at `/h2-console`.

Tests override this configuration to use an in-memory H2 database and recreate its schema for each test run.

The dataset is packaged at `backend/src/main/resources/vehicles.json` so it is included in backend builds. On startup the stored vehicles are compared with the file: if they already match, nothing changes; otherwise they are replaced with the file's contents, so a regenerated file always takes effect. Tests use a fresh in-memory database and verify the 300-record seed.

The file is produced by `node scripts/generate-vehicles.mjs` (fixed random seed, so re-running gives the same data). Each of the 30 models has 10 lots with a random year (2016–2025), primary damage, condition, and location. Following Copart's terms, *primary damage* is the main damage category (Front End, Rear End, Side, Minor Dent/Scratches, Normal Wear, Hail, Vandalism, Mechanical, Water/Flood) and *condition* is whether the vehicle was verified to run: Run and Drive, Engine Start Program, Enhanced Vehicles, or Stationary (not verified). Condition depends on the damage, so flood and mechanical lots are mostly Stationary. Mileage grows with age, and the estimated value comes from the model's approximate new price, depreciation by age, mileage, damage, and condition. Lot numbers follow the weekday sale calendar.

## API

### Health

```http
GET /api/health
```

Returns:

```json
{"status":"UP"}
```

### Search vehicles

```http
GET /api/vehicles?q=toyota&primaryDamage=Front%20End&condition=Run%20and%20Drive&minYear=2020&page=0&size=12&sortBy=year&direction=desc
```

Supported query parameters:

| Parameter | Behavior |
| --- | --- |
| `q` | Case-insensitive partial match against lot number, make, model, and location |
| `make` | Case-insensitive exact make filter |
| `model` | Case-insensitive exact model filter |
| `primaryDamage` | Case-insensitive exact primary damage filter, e.g. `Water/Flood` |
| `condition` | Case-insensitive exact condition filter, e.g. `Run and Drive` |
| `minYear`, `maxYear` | Inclusive year range |
| `minPrice`, `maxPrice` | Estimated value range; `minPrice` is inclusive and `maxPrice` is exclusive, so `$10,000–$20,000` buckets don't overlap. Either can be omitted (the UI's `$50,000+` sends only `minPrice`) |
| `page` | Zero-based page number; defaults to `0` |
| `size` | Page size from 1 through 100; defaults to `12` |
| `sortBy` | One of `year`, `make`, `model`, `saleDate`, `estimatedValue`, or `odometer`; defaults to `saleDate`. Ties are broken by id so paging is stable |
| `direction` | `asc` or `desc`; defaults to `asc` |

The response includes the current page's `content` and pagination metadata such as `number`, `size`, `totalElements`, `totalPages`, `first`, and `last`. Invalid page/size values, unsupported sort fields or directions, inverted year ranges, and negative or inverted value ranges return HTTP 400.

### AI natural-language search

```
POST /api/ai-search
{"query": "Toyota under $20,000 near Dallas", "clarification": ""}
```

Turns a free-text request into the existing search filters using the OpenAI Responses API, then the frontend runs the normal `/api/vehicles` search with them. It returns either `{"status":"READY","filters":{...}}` or `{"status":"CLARIFICATION","question":"..."}`. Returned makes, models, primary damage, conditions, years, and prices are validated against the supported values before they are used.

Configuration: set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the environment, for example in the Railway service variables. Without a key the endpoint returns HTTP 503 and the UI shows "AI search is not configured on the server yet." The `maxPriceInclusive` search parameter (inclusive upper bound) exists for this feature.

Rate limits protect the API key from abuse: each visitor (by IP) can make 10 AI searches per minute, and all visitors together 200 per hour. Over the limit the endpoint returns HTTP 429 with a `Retry-After` header and the UI asks the visitor to wait. Change the limits with `AI_SEARCH_LIMIT_PER_MINUTE` and `AI_SEARCH_LIMIT_PER_HOUR`. Counters are kept in memory, so they reset when the service restarts.

## Assumptions and limitations

- Seeded records are fictional and are inserted only when the database is empty.
- Make, model, primary damage, and condition filters use exact matching (case-insensitive); only `q` is partial matching.
- Vehicle photos are representative stock images per body style, not photos of the actual lot.
- Search is implemented with database predicates and pagination rather than loading all records into application memory.
- H2 and Hibernate schema auto-update are intended for this prototype; a persistent database should be used for production data.
- Authentication, authorization, production database migrations, and advanced/fuzzy search are out of scope for this prototype.

## Architecture

The backend is organized into controller, service, repository, entity, response DTO, and search specification layers. The container serves the React app and API from the same Spring Boot application:

```text
Browser
  -> Spring Boot application
      -> React static frontend
      -> /api/* REST endpoints
          -> database
```

For a production system, replace H2 with PostgreSQL or SQL Server, introduce full-text search or Elasticsearch only if required, add caching only when profiling justifies it, and add authentication, observability, logging, and managed static asset hosting as appropriate.
