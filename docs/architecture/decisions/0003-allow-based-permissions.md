# ADR 0003: Allow-based permissions

- Status: Accepted for specification
- Date: 2026-07-16

## Context
The first permission model should be understandable and safe to evaluate.

## Decision
Use canonical `domain.action` permissions and allow-based role expansion. No explicit deny permissions are supported initially; missing permission means deny.

## Consequences
Evaluation is simple and auditable. Future deny semantics require a separate decision with precedence and migration rules.

## Alternatives considered
- Allow and deny rules immediately: deferred due to precedence complexity.
- Hard-coded role checks: rejected because they resist controlled permission evolution.
