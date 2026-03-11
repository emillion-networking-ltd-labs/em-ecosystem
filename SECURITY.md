# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously at EMillion Networking LTD. If you discover a security vulnerability in EM NexaCore, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities.
2. Email your findings to **security@emillionnetworking.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (optional)
3. You will receive an acknowledgment within **48 hours**.
4. We will investigate and provide a resolution timeline within **7 business days**.

### What to Expect

| Severity | Response Time | Resolution Target |
|----------|--------------|-------------------|
| Critical | 24 hours | 72 hours |
| High     | 48 hours | 7 days |
| Medium   | 7 days | 30 days |
| Low      | 14 days | 90 days |

### Scope

**In scope:**
- EM NexaCore API (nexacore-api)
- EM NexaCore Dashboard (nexacore-dashboard)
- Authentication and authorization flows
- Data handling and storage
- API endpoints and input validation
- Session management
- OAuth integration (Google, GitHub)
- WebAuthn/Passkey implementation

**Out of scope:**
- Denial of Service (DoS/DDoS) attacks
- Social engineering attacks against employees
- Physical security attacks
- Third-party services and dependencies (report upstream)
- Vulnerabilities in development/staging environments
- Issues already reported and under investigation

### Severity Classification

We follow **CVSS v3.1** scoring aligned with our internal audit framework:

| CVSS Score | Severity | Examples |
|------------|----------|---------|
| 9.0 - 10.0 | Critical | RCE, auth bypass, SQL injection, mass data breach |
| 7.0 - 8.9 | High | Privilege escalation, stored XSS, IDOR |
| 4.0 - 6.9 | Medium | Reflected XSS, CSRF, information disclosure |
| 0.1 - 3.9 | Low | Verbose error messages, missing headers |

### Security Standards

This project is audited against:
- OWASP ASVS v4.0 (Chapters 2-8, 13)
- NIST SP 800-63B (Digital Identity)
- RFC 9700 (OAuth 2.0 Security)
- RFC 8725 (JWT Best Practices)
- SOC 2 Trust Services Criteria
- ISO 25010 (Maintainability)

### Automated Security

Our CI/CD pipeline includes:
- **Gitleaks** — secrets detection on every commit
- **npm audit** — dependency vulnerability scanning
- **ESLint Security Plugin** — static analysis for security anti-patterns
- **OWASP ZAP** — dynamic application security testing
- **Coverage gates** — 90% statement/function/line, 85% branch coverage

### Acknowledgments

We appreciate responsible disclosure. Contributors who report valid vulnerabilities will be acknowledged in our security hall of fame (with permission).

---

*This policy follows the [security.txt](https://securitytxt.org/) standard and ISO 29147 (Vulnerability Disclosure).*
