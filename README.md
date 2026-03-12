# ChatBoot

ChatBoot is a **Node.js backend for building AI-powered chatbots**. It
provides a modular API for authentication, customer management, company
data, document ingestion, and LLM-based chat interactions.

The system is designed to support **AI assistants that can answer
questions based on company documents using vector search and language
models**.

------------------------------------------------------------------------

# Features

-   🤖 AI-powered chatbot with LLM integration
-   🧠 Vector-based knowledge retrieval
-   📄 Document ingestion pipeline
-   👤 Customer authentication and management
-   🏢 Company (Firma) data handling
-   🔗 Webhook support for integrations
-   ⚡ Modular Express API architecture
-   ☁️ AWS S3 integration for file storage
-   💳 Stripe integration for payments

------------------------------------------------------------------------

# Tech Stack

-   Node.js
-   Express.js
-   PostgreSQL
-   JavaScript
-   REST API
-   OpenAI API
-   AWS S3
-   Stripe
-   Vector embeddings
-   Large Language Models (LLM)

------------------------------------------------------------------------

# Project Structure

    chatboot/

    ├── app.js
    ├── package.json
    ├── vecel.json

    ├── routes/
    │   ├── auth.js
    │   ├── authCu.js
    │   ├── customer.js
    │   ├── firma.js
    │   ├── methode.js
    │   ├── webhook.js
    │
    │   ├── chat/
    │   │   ├── chat.js
    │   │   ├── data.js
    │   │   └── LLM.js
    │
    │   └── ingestData/
    │       └── ingestFirmaData.js

    └── source/
        ├── db.js
        └── models/
            ├── actions.js
            ├── customers.js
            ├── chunks.js
            ├── firma.js
            └── dokument.js

------------------------------------------------------------------------

# Installation

Clone the repository:

    git clone https://github.com/alfredlog/chatboot.git
    cd chatboot

Install dependencies:

    npm install

------------------------------------------------------------------------

# Environment Variables

Before running the project you **must create a `.env` file in the root
directory**.

Example `.env` file:

    POSTGRES_URL=your_postgres_connection_string

    OPENAI_API_KEY=your_openai_api_key

    AWS_REGION=your_aws_region
    AWS_ACCESS_KEY_ID=your_access_key
    AWS_SECRET_ACCESS_KEY=your_secret_key
    AWS_S3_BUCKET=your_bucket_name

    JWT_SECRETC=customer_jwt_secret
    JWT_SECRETF=firma_jwt_secret
    JWT_SECRET=refresh_token_secret

    PRIVATE_KEY=stripe_private_key
    STRIPE_PRICE_ID=stripe_price_id
    STRIPE_WEBHOOK_SECRET=stripe_webhook_secret

### Description of Variables

| Variable \| Description \|

\|--------\|-------------\| POSTGRES_URL \| PostgreSQL database
connection string \| \| OPENAI_API_KEY \| API key used to access OpenAI
models \| \| AWS_REGION \| AWS region where S3 bucket is located \| \|
AWS_ACCESS_KEY_ID \| AWS access key \| \| AWS_SECRET_ACCESS_KEY \| AWS
secret access key \| \| AWS_S3_BUCKET \| S3 bucket used for file storage
\| \| JWT_SECRETC \| JWT secret used for **customer authentication** \|
\| JWT_SECRETF \| JWT secret used for **firma authentication** \| \|
JWT_SECRET \| Secret used for **refresh tokens** \| \| PRIVATE_KEY \|
Stripe private API key \| \| STRIPE_PRICE_ID \| Stripe price ID for
subscriptions \| \| STRIPE_WEBHOOK_SECRET \| Stripe webhook signing
secret \|

------------------------------------------------------------------------

# Running the Server

Start the application:

    node app.js

or for development:

    npx nodemon app.js

Server will run on:

    http://localhost:3000

------------------------------------------------------------------------

# API Documentation

Base URL:

    http://localhost:3000

------------------------------------------------------------------------

## Authentication

### Login

Endpoint

    POST /auth/login

Request

``` json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response

``` json
{
  "token": "jwt_token_here",
  "user": {
    "id": "12345",
    "email": "user@example.com"
  }
}
```

------------------------------------------------------------------------

## Chatbot

Send a message to the chatbot.

Endpoint

    POST /chat

Request

``` json
{
  "customerId": "cust_001",
  "message": "What services does the company offer?"
}
```

Response

``` json
{
  "response": "Our company offers consulting, software development, and AI integration services.",
  "sources": [
    "document_1",
    "document_3"
  ]
}
```

------------------------------------------------------------------------

## Customer Management

Get customer by ID.

Endpoint

    GET /customer/:id

Response

``` json
{
  "id": "cust_001",
  "name": "John Doe",
  "email": "john@example.com"
}
```

------------------------------------------------------------------------

## Data Ingestion

Upload company documents to the chatbot knowledge base.

Endpoint

    POST /ingestData

Request

``` json
{
  "firmaId": "company_001",
  "document": "Company handbook or text"
}
```

The system will:

1.  Split the document into chunks
2.  Generate embeddings
3.  Store them in the database
4.  Use them later for chatbot retrieval

------------------------------------------------------------------------

# Chat Architecture

The chatbot uses **Retrieval Augmented Generation (RAG)**.

Flow:

1.  User sends a message to `/chat`
2.  Backend searches vector database
3.  Relevant document chunks are retrieved
4.  Context is added to the prompt
5.  Prompt is sent to the OpenAI model
6.  Response is returned to the user

------------------------------------------------------------------------

# Architecture Diagram

``` mermaid
graph TD

Client[Client Application] --> API[Express API Server]

API --> Auth[Auth Routes]
API --> Customer[Customer Routes]
API --> Firma[Company Routes]
API --> Chat[Chat Routes]

Chat --> VectorSearch[Vector Database]
Chat --> LLM[OpenAI LLM]

VectorSearch --> Chunks[(Document Chunks)]

API --> DB[(PostgreSQL Database)]
API --> S3[(AWS S3 Storage)]

API --> Stripe[Stripe Payments]
Stripe --> Webhook[Stripe Webhooks]
```

------------------------------------------------------------------------

# Example Chat Flow

User request

``` json
{
  "message": "What products does the company sell?"
}
```

Example response

``` json
{
  "response": "The company sells AI consulting services, automation software, and enterprise integrations.",
  "sources": [
    "product_catalog.pdf",
    "services_overview.pdf"
  ]
}
```

------------------------------------------------------------------------

# Contributing

1.  Fork the repository
2.  Create a branch

```{=html}
<!-- -->
```
    git checkout -b feature/new-feature

3.  Commit changes

```{=html}
<!-- -->
```
    git commit -m "Add new feature"

4.  Push branch

```{=html}
<!-- -->
```
    git push origin feature/new-feature

5.  Open a Pull Request

------------------------------------------------------------------------

# License

MIT License

------------------------------------------------------------------------

# Author

alfredlog\
https://github.com/alfredlog
