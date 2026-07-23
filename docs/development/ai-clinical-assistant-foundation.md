# AI Clinical Assistant Foundation

Phase 2O establishes the persistence and UI boundary for future assistive workflows. It intentionally has no live provider integration, provider credentials, model invocation, queue, or production deployment.

## Architecture

Organizations own prompts, prompt versions, requests, responses, feedback, usage metrics, provider settings, and AI events. A global provider catalogue describes OpenAI, Azure OpenAI, Anthropic, Google Gemini, AWS Bedrock, Local LLM, and Custom Provider without enabling any provider. RPCs are the only mutation boundary and audit sensitive mutations.

Prompt versions must be reviewed and published before a request can be created. Every request requires human review, carries a clinical disclaimer, and supports blocked and approval states. Response text is explicitly a placeholder until a separately approved provider adapter exists.

## Future work

Provider adapters, ambient scribing, coding assistance, summarization, governance controls, retention policies, redaction, evaluation datasets, and rollback procedures require separate design and security review. No feature may create a clinical record or take action without an authorized human workflow.

## Limitations

Usage values and response content are placeholders. No quality, latency, cost, or safety claim is made. Local and CI validation uses structural tests only; it does not contact an AI provider or a hosted Supabase project.
