# AI usage record

This file records representative AI assistance used while designing, implementing, testing, and documenting the vehicle search prototype. Prompt excerpts are taken from the project conversation; response entries summarize the assistance and resulting change rather than reproducing entire chat transcripts.

## Tools and models

| Use | Tool or model | Notes |
| --- | --- | --- |
| Design and coding assistance | OpenAI ChatGPT/Codex assistant | Used to discuss architecture, troubleshoot deployment, refine UI behavior, review implementation details, and prepare documentation. Exact model identifiers for earlier project sessions were not retained in the repository, so they are not guessed here. |
| AI search at runtime | OpenAI Responses API | Called by the Spring Boot backend. The model is configurable with `OPENAI_MODEL`; the repository default is `gpt-5.6-luna`. This is separate from the coding assistant. |
| Automated checks | GitHub Actions | Runs frontend tests, a production frontend build, and backend tests. This is CI, not an AI tool. |

No API keys or secrets are included in this file. The runtime OpenAI key, when used, is supplied as the server-side `OPENAI_API_KEY` environment variable.

## Representative coding-assistant prompts and responses

### 1. Choose the prototype stack and delivery phases

**Prompt excerpt**

> “For now backend - java, spring boot, front end - react … before that we will discuss thoroughly what we will build, what technologies.”

**Assistant response summary**

Outlined a phased full-stack vehicle-search prototype using React, Spring Boot, a relational database, and a single deployed application. The implementation plan separated the search API/data foundation, frontend experience, and verification/deployment work.

### 2. Make keyword search and natural-language search share one UI

**Prompt excerpt**

> “The search panel has TWO separate inputs … Merge the two inputs into ONE input.”
>
> “Search runs the existing keyword search logic … Ask AI sends the same input text to the existing AI parsing logic … Enter = Search (keyword).”
>
> The request also specified a shared sticky search state, clearing AI interpretation chips when filters change or regular search is submitted, responsive controls, accessibility labels, and URL query state.

**Assistant response summary**

Consolidated the search experience around one query value and two actions. Regular search continues through the vehicle-search endpoint; Ask AI calls the interpretation endpoint, applies validated filters, and then uses the normal vehicle-search endpoint. The sticky bar reuses the same search state.

### 3. Correct stale AI interpretation state

**Prompt excerpt**

> “AI interpreted, is not resetting after changing the filter or when I am clicking the normal search.”

**Assistant response summary**

Updated the UI behavior so that editing filters or submitting an ordinary keyword search clears the old AI interpretation indicator and chips. The normal search path remains usable independently of AI.

### 4. Fix combined frontend/backend deployment

**Prompt excerpt**

> “Deployment is success now, but where is the UI?”
>
> Earlier, Railway's build log reported that it could not determine how to build the application from the repository root.

**Assistant response summary**

Explained and implemented the repository-root multi-stage Docker build: Node builds the React assets, Maven packages them into Spring Boot's static resources, and a Java runtime serves both the UI and API from one service.

### 5. Document the actual project choices

**Prompt excerpt**

> “Now the biggest main is to properly updating the Read.md with the technologies used and architecture decisions. Everything has to be correct.”

**Assistant response summary**

Used the current repository configuration as the source of truth to describe the stack, API, data model, H2 setup, Docker/Railway deployment, and known limitations. The H2 volume limitation and optional AI configuration were called out explicitly.

## Runtime AI search example

This is an application feature, separate from coding-assistant use.

**User query sent to Ask AI:** `Honda`

**Observed interpretation:** `make=Honda`

**Observed result:** The regular vehicle-search API returned 30 matching synthetic Honda records, displayed 12 per page. The AI interpreted the query; the existing deterministic search API applied the filter and returned the records.

## Review and verification notes

AI assistance was used to propose and implement changes, but the repository remains the source of truth for behavior. Before submission, the candidate should be prepared to explain the implementation and trade-offs. The repository's GitHub Actions workflow runs frontend tests, builds the production frontend, and runs backend tests. The latest `main` deployment check observed during documentation preparation completed successfully.

