# Security Review Report
**Date:** 2025-01-27  
**Project:** Observer Portfolio Site

## Executive Summary

This security review identified **12 critical and high-priority security issues** that should be addressed before production deployment. The application has basic authentication and some XSS protections, but lacks several important security controls.

---

## Critical Issues (Must Fix Before Production)

### 1. Missing Security Headers (CRITICAL)
**Location:** `server.js`  
**Issue:** No security headers middleware (Helmet.js) configured. Missing:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Referrer-Policy

**Risk:** Vulnerable to clickjacking, MIME type sniffing, and other attacks.

**Recommendation:**
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"]
    }
  }
}));
```

---

### 2. No CSRF Protection (CRITICAL)
**Location:** All POST/PUT/DELETE routes  
**Issue:** No CSRF token validation for state-changing operations.

**Risk:** Cross-Site Request Forgery attacks can perform unauthorized actions on behalf of authenticated users.

**Recommendation:**
- Install `csurf` or `csrf` middleware
- Generate CSRF tokens for forms
- Validate tokens on all state-changing endpoints

---

### 3. Weak Session Secret (CRITICAL)
**Location:** `config/index.js:9`  
**Issue:** Default session secret `'observer-dev-secret-key-2024'` used if `SESSION_SECRET` not set.

**Risk:** Predictable session secret allows session hijacking.

**Current Code:**
```javascript
secret: process.env.SESSION_SECRET || 'observer-dev-secret-key-2024',
```

**Recommendation:**
- **MUST** require `SESSION_SECRET` in production (already validated in `config/env.js`)
- Generate strong random secret: `openssl rand -base64 32`
- Never commit secrets to version control

---

### 4. No Rate Limiting (HIGH)
**Location:** Authentication and API endpoints  
**Issue:** No rate limiting on login attempts or API calls.

**Risk:** Brute force attacks on login, API abuse, DoS.

**Recommendation:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/auth/login', loginLimiter);
```

---

### 5. Markdown Rendering Without Sanitization (HIGH)
**Location:** `services/markdownService.js:4`  
**Issue:** Using `marked` library without HTML sanitization.

**Risk:** XSS attacks through malicious markdown content.

**Current Code:**
```javascript
function renderMarkdown(content) {
  return marked(content);
}
```

**Recommendation:**
```javascript
const { marked } = require('marked');
const DOMPurify = require('isomorphic-dompurify');

function renderMarkdown(content) {
  const html = marked(content);
  return DOMPurify.sanitize(html);
}
```

---

### 6. XSS Vulnerabilities in innerHTML Usage (HIGH)
**Location:** Multiple frontend files  
**Issue:** Using `innerHTML` with user-generated content in several places:
- `public/scripts/home.js:262` - `modalDescription.innerHTML = data.htmlContent;`
- `public/scripts/products.js:169` - Same issue
- `public/scripts/post.js:58` - `postBody.innerHTML = post.htmlContent;`

**Risk:** XSS if markdown sanitization fails or if content contains malicious HTML.

**Recommendation:**
- Ensure markdown is properly sanitized (see issue #5)
- Consider using `textContent` where HTML isn't needed
- Use DOMPurify on client-side if needed

---

## High Priority Issues

### 7. Insufficient Input Validation (HIGH)
**Location:** All controllers  
**Issue:** Limited server-side validation:
- No length limits on text fields
- No format validation for URLs, emails
- No type checking for arrays/objects

**Examples:**
- `controllers/capabilitiesController.js:52` - No validation on `externalUrl`, `screenshots`, `features`
- `controllers/postsController.js:120` - No length limits on `title`, `content`

**Recommendation:**
- Add validation middleware (e.g., `express-validator`)
- Set maximum lengths for all text inputs
- Validate URL formats
- Validate array structures

---

### 8. File Upload Security Gaps (HIGH)
**Location:** `controllers/uploadController.js`  
**Issues:**
- Only checks MIME type and extension (can be spoofed)
- No virus scanning
- No file content validation
- 10MB limit may be too large

**Recommendation:**
- Add magic number/file signature validation
- Reduce file size limit (e.g., 5MB)
- Consider adding virus scanning in production
- Validate image dimensions

---

### 9. Error Information Leakage (MEDIUM)
**Location:** `middleware/errorHandler.js:10`  
**Issue:** Stack traces exposed in non-production (though this is intentional for dev).

**Current Code:**
```javascript
...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
```

**Recommendation:**
- Ensure production mode is properly set
- Consider logging errors to a secure log service
- Don't expose internal paths in error messages

---

### 10. Missing HTTPS Enforcement (MEDIUM)
**Location:** `config/index.js:11`  
**Issue:** `secure` cookie flag only set in production, but no HTTPS redirect.

**Recommendation:**
- Add HTTPS redirect middleware in production
- Use HSTS header (via Helmet)

---

### 11. No Content Security Policy (MEDIUM)
**Location:** Missing entirely  
**Issue:** No CSP headers to prevent XSS and injection attacks.

**Recommendation:**
- Implement via Helmet.js (see issue #1)
- Start with strict policy, relax as needed

---

### 12. Dependency Vulnerabilities (MEDIUM)
**Location:** `package.json`  
**Issue:** Dependencies may have known vulnerabilities.

**Recommendation:**
- Run `npm audit` to check for vulnerabilities
- Update dependencies regularly
- Consider using `npm audit fix` or `npm update`
- Add automated dependency scanning (Dependabot, Snyk)

---

## Medium Priority Issues

### 13. Session Configuration
**Location:** `server.js:19-24`  
**Issue:** 
- No session store configuration (uses memory store by default)
- Sessions lost on server restart
- No session rotation

**Recommendation:**
- Use Redis or database session store for production
- Implement session rotation
- Set appropriate session timeout

---

### 14. Admin Password Default
**Location:** `config/index.js:26`  
**Issue:** Default password `'changeme123'` if `ADMIN_PASSWORD` not set.

**Recommendation:**
- Force password change on first login
- Require strong password policy
- Already has warning in `services/initService.js:26`

---

### 15. No Request Size Limits
**Location:** `server.js:16-17`  
**Issue:** No explicit body size limits on JSON/URL-encoded parsers.

**Recommendation:**
```javascript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

---

## Positive Security Practices Found

✅ **Good Practices:**
1. Password hashing with bcrypt (12 rounds)
2. HTTP-only cookies for sessions
3. Some XSS escaping in frontend (`escapeHtml` functions)
4. SVG sanitization in `icons.js`
5. File type validation for uploads
6. Authentication middleware on protected routes
7. Environment variable validation

---

## Action Items Priority

### Immediate (Before Production):
1. ✅ Add Helmet.js security headers
2. ✅ Implement CSRF protection
3. ✅ Add rate limiting to login
4. ✅ Sanitize markdown output
5. ✅ Verify SESSION_SECRET is set in production
6. ✅ Run `npm audit` and fix vulnerabilities

### Short Term:
7. Add input validation middleware
8. Enhance file upload security
9. Implement proper session store
10. Add HTTPS enforcement

### Long Term:
11. Set up automated security scanning
12. Implement security monitoring/logging
13. Regular dependency updates
14. Security testing/penetration testing

---

## Testing Recommendations

1. **Security Testing:**
   - OWASP ZAP or Burp Suite scan
   - Manual XSS testing on all user inputs
   - CSRF token validation testing
   - Rate limiting verification

2. **Dependency Scanning:**
   - `npm audit`
   - Snyk or Dependabot integration

3. **Code Review:**
   - Review all user input handling
   - Verify all authentication checks
   - Check for hardcoded secrets

---

## Notes

- The application uses JSON file storage, which is fine for small-scale deployments but consider database migration for production scale
- Most security issues are common in early-stage applications and are fixable
- The codebase shows awareness of security (escaping, hashing) but needs hardening for production

