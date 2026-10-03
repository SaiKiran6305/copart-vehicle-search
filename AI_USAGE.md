# AI Usage Record

AI assistants supported planning, implementation, testing, and review of this vehicle-search prototype. The entries below summarize the tools, models, requests, and how the responses were used. AI-assisted code, data, and test suggestions were reviewed before use. No API keys or secrets are included.

## Tools and models

| Tool | Model | Used for |
| --- | --- | --- |
| ChatGPT | GPT-6 Sol | Hosting decisions, architecture, deployment troubleshooting, UI ideas, and LLM search design |
| Claude chat | Claude Sonnet 5.5 | Initial seed data, boilerplate code, and test-case drafts |
| Claude Code | Claude Opus 5.5 (claude-opus-5-5) | UI and backend reviews, bug fixes, features, tests, page-load work, and README review |
| OpenAI Responses API | gpt-5.6-luna (configurable with OPENAI_MODEL) | Runtime Ask AI feature; not used as a coding assistant |

## 1. Hosting and deployment decision

**Model:** GPT-6 Sol

**Prompt summary:** Compare hosting options for a React frontend, Spring Boot backend, and SQL database; explain the trade-offs of deploying them together or separately.

**Response summary:** React can be hosted as static files, while Spring Boot needs a Java runtime. Render and Railway were considered. A single deployment reduces setup; separate deployments allow independent scaling but require more configuration.

**Decision:** Use one Railway service, with Spring Boot serving the production React build.

**Challenge and resolution:** Railway could not detect how to build both parts together. A multi-stage Dockerfile was added to build React, package its output with Spring Boot, and run them in one service.

## 2. Architecture, deployment troubleshooting, and UI ideas

**Model:** GPT-6 Sol

**Prompt summary:** Discuss the React, Spring Boot, and H2 architecture; troubleshoot deployment; and review search behavior, filter resets, and responsive layout.

**Response summary:** The assistant helped compare options and reason through reported issues. Suggestions were checked against the requirements and code before being adopted.

## 3. Initial seed data and boilerplate

**Model:** Claude Sonnet 5.5

**Prompt summary:** Prepare representative vehicle records and draft boilerplate for application components.

**Response summary:** Claude provided draft records and starter code, which were reviewed before use. The initial seed data was later replaced by a deterministic generator.

## 4. LLM search design

**Model:** GPT-6 Sol

**Prompt summary:** Discuss adding LLM-based interpretation to vehicle search and how it should connect to regular search.

**Response summary:** The discussion helped shape the flow: AI interprets text into supported filters, and the regular search API returns matching vehicles.

## 5. Initial test-case drafts

**Model:** Claude Sonnet 5.5

**Prompt summary:** Review the application behavior and suggest test cases for search.

**Response summary:** The test-case drafts helped guide application verification.

## 6. Reviews, fixes, and features

**Tool and model:** Claude Code with Claude Opus 5.5 (claude-opus-5-5)

**Use:** Review UI and backend changes, fix bugs, implement features, improve page-load behavior, and review the README.

Changes were developed on branches, reviewed, and merged by me after CI. Tests were added across these changes, including frontend tests with Vitest and React Testing Library, and backend tests with JUnit and MockMvc.

AI assistance helped me build the application more efficiently. I reviewed and tested AI-assisted code, data, and test suggestions before using them.
