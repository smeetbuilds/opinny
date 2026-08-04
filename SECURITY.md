# Security policy

Opinny is an open-source frontend-only project developed by Aahav Labs.

- Website: https://aahavlabs.in
- Security contact: hi@aahavlabs.in

## Reporting a vulnerability

Please email hi@aahavlabs.in with:

- affected file, component or workflow;
- impact and realistic attack scenario;
- reproduction steps or proof of concept;
- affected commit or version;
- suggested mitigation, if available.

Do not publish exploitable details before maintainers have had a reasonable opportunity to investigate and release a fix.

## Supported version

Security fixes are applied to the latest commit on `main`. Older commits, forks and third-party deployments are not maintained by Aahav Labs unless separately agreed.

## Frontend-only boundary

This repository does not provide production custody, authentication, authorization, matching, settlement, compliance or database services. Operators integrating Opinny must independently secure:

- wallet challenge verification and sessions;
- API authentication and authorization;
- admin permissions and audit logs;
- smart contracts and blockchain transactions;
- deposits, withdrawals and confirmation tracking;
- pricing, order matching and settlement;
- KYC/KYB, sanctions, geofencing and fraud controls;
- secrets, infrastructure and data retention.

A polished frontend is not a security boundary. Never rely on hidden routes, disabled buttons or client-side validation to enforce policy.
