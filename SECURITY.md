# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public Issue.** Instead, please contact us through the contact form on [our site](https://tokistorage.github.io/lp/).

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Scope

This is a static site hosted on GitHub Pages. There is no server-side code, database, or user authentication. The primary security concerns are:

- Cross-site scripting (XSS) in client-side JavaScript
- Content injection via URL parameters
- Third-party dependency vulnerabilities

## Supported Versions

Only the latest version deployed on GitHub Pages is supported.
