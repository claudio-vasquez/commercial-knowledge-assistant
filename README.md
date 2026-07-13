# Commercial Knowledge Assistant

An AI-powered business knowledge assistant that answers questions about a consulting business using a verified knowledge base instead of generating unsupported responses.

---

## Overview

Commercial Knowledge Assistant is the first public product developed as part of my AI Residency.

The assistant is designed to answer questions about a real B2B consulting business while following a simple principle:

> If the information is not available in its knowledge base, it explicitly says so instead of inventing an answer.

The project is intentionally being developed through iterative public releases. New capabilities will be added during future development cycles while preserving a single product architecture.

---
## Design Principles

This project follows four core principles:

- Knowledge first
- No hallucinations
- Source-backed responses
- Honest uncertainty

## Features

- AI-powered conversational assistant
- Structured business knowledge base
- Source citation for every supported answer
- Explicit fallback for unknown information
- Prompt injection resistance
- Server-side LLM integration
- Public web interface
- Modular architecture for future products

---

## Architecture

```
User
      │
      ▼
Web Interface (Lovable)
      │
      ▼
Server Function
      │
      ▼
Gemini Flash Lite
      │
      ▼
business.json
```

The knowledge base acts as the single source of truth.

Business information is stored separately from the application logic, allowing future assistants to reuse the same architecture by replacing the knowledge file.

---

## Tech Stack

- Lovable
- TypeScript
- React
- Gemini Flash Lite
- AI Gateway
- JSON Knowledge Base
- GitHub

---

## Getting Started

Clone the repository.

Install dependencies.

Run the development server.

Configure the required environment variables.

Deploy.

---

## Roadmap

Current version:

- Business knowledge assistant
- Verified responses
- Source citations

Planned iterations:

- Lead capture
- Supabase integration
- Interactive commercial diagnosis
- CRM integration
- Analytics
- Astro integration
- ProspectAI interoperability

---

## Project Status

**Version:** 1.0

Released as the first module of an iterative AI product developed during my AI Residency.

---

## License

MIT
