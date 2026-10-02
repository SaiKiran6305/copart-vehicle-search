# copart-vehicle-search

## Copart Vehicle Search Prototype

A vehicle-search prototype for a Software Engineering Intern take-home assignment. It exposes a paginated REST API over synthetic vehicle auction records. No real Copart data is used.

## Technology

- Java 17 and Spring Boot
- Spring Web, Spring Data JPA, and Hibernate
- H2 for local development and tests
- Maven
- JUnit 5 and MockMvc

The current implementation is Phase 1 (backend foundation). A React frontend and single-deployment static asset setup are intentionally not included yet.

## Local setup

Requirements: Java 17 and Maven.

From the repository root:

```sh
cd backend
mvn spring-boot:run
```

The API is available at `http://localhost:8080`. The backend seeds 12 fictional vehicles when the database has no records.

Run the backend tests with:

```sh
cd backend
mvn test
```

## Database

Local development uses a persistent file-based H2 database at `jdbc:h2:file:./data/copartdb`, with username `sa` and an empty password. The database files are stored under `backend/data` when started from the backend directory. Hibernate updates the local schema.

Tests override this configuration to use an in-memory H2 database and recreate its schema for each test run.

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
GET /api/vehicles?q=toyota&condition=Run%20%26%20Drive&minYear=2020&page=0&size=10&sortBy=year&direction=desc
```

Supported query parameters:

| Parameter | Behavior |
| --- | --- |
| `q` | Case-insensitive partial match against lot number, make, model, and location |
| `make` | Case-insensitive exact make filter |
| `model` | Case-insensitive exact model filter |
| `condition` | Case-insensitive exact condition filter |
| `minYear`, `maxYear` | Inclusive year range |
| `page` | Zero-based page number; defaults to `0` |
| `size` | Page size from 1 through 100; defaults to `10` |
| `sortBy` | One of `year`, `make`, `model`, `saleDate`, `estimatedValue`, or `odometer`; defaults to `saleDate` |
| `direction` | `asc` or `desc`; defaults to `asc` |

The response includes the current page's `content` and pagination metadata such as `number`, `size`, `totalElements`, `totalPages`, `first`, and `last`. Invalid page/size values, unsupported sort fields or directions, and inverted year ranges return HTTP 400.

## Assumptions and limitations

- Seeded records are fictional and are inserted only when the database is empty.
- Make, model, and condition filters use exact matching (case-insensitive); only `q` is partial matching.
- Search is implemented with database predicates and pagination rather than loading all records into application memory.
- H2 and Hibernate schema auto-update are for this local prototype, not production deployment.
- Authentication, authorization, frontend integration, production database migrations, and advanced/fuzzy search are out of scope for Phase 1.

## Architecture and future deployment

The backend is organized into controller, service, repository, entity, response DTO, and search specification layers. The intended later single-deployment layout is:

```text
Browser
  -> Spring Boot application
      -> React static frontend
      -> /api/* REST endpoints
          -> database
```

For a production system, replace H2 with PostgreSQL or SQL Server, introduce full-text search or Elasticsearch only if required, add caching only when profiling justifies it, and add authentication, observability, logging, and managed static asset hosting as appropriate.
