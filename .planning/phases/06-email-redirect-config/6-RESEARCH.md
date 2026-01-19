# Phase 6: Email Redirect Config - Research

**Researched:** 2025-01-15
**Domain:** Supabase Auth email confirmation redirect configuration
**Confidence:** HIGH

## Summary

Researched how to configure Supabase email confirmation redirects to point to production URL (chat.trplan.si). There are three approaches:

1. **Dashboard (manual)**: Set Site URL in Supabase dashboard under Authentication > URL Configuration
2. **Management API (programmatic)**: Use `PATCH /v1/projects/{ref}/config/auth` endpoint to update auth config
3. **Client-side (already implemented)**: Use `emailRedirectTo` option in signup calls

Current implementation uses `emailRedirectTo: window.location.origin`, which works dynamically but requires the production Site URL to be configured in the allow list.

**Primary recommendation:** Configure Site URL in Supabase dashboard to `https://chat.trplan.si` and add it to Redirect URLs allow list. This is the simplest, most reliable approach for production. Programmatic Management API is available but requires additional setup (access token, API access) and is typically used for CI/CD or multi-environment automation.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.x | Supabase client | Official JS SDK for Supabase auth |
| Supabase Dashboard | Latest | Manual configuration | Direct control, no code changes needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Management API | v1 | Programmatic config updates | CI/CD pipelines, multi-environment automation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dashboard config | Management API | Dashboard is simpler for one-off prod setup, API better for automation |

**Installation:** None needed (SDK already installed)

## Architecture Patterns

### Recommended Configuration Approach

**Dashboard Configuration (simpler for production):**
```
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Set Site URL to: https://chat.trplan.si
3. Add to Redirect URLs allow list: https://chat.trplan.si/**
```

### Pattern 1: Current Implementation (Client-Side Redirect)
**What:** Using `emailRedirectTo` option in signup calls
**When to use:** When you need per-request redirect control or dynamic URLs
**Example:** (from src/lib/auth.tsx:64)
```typescript
// Source: Current codebase
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: window.location.origin,
  },
})
```

### Pattern 2: Management API Update (Programmatic)
**What:** Update auth config via Management API
**When to use:** CI/CD pipelines, automated deployments, multi-environment management
**Example:**
```typescript
// Source: Supabase Management API docs
const response = await fetch('https://api.supabase.com/v1/projects/{ref}/config/auth', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer {access_token}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    'site_url': 'https://chat.trplan.si',
    'additional_redirect_urls': ['https://chat.trplan.si/**']
  })
})
```

### Anti-Patterns to Avoid
- **Hardcoding redirect URLs:** Use `window.location.origin` or environment variables, not literal URLs
- **Attempting to intercept email links:** Don't try to rewrite Supabase email links - configure properly instead
- **Missing allow list:** URLs must be in Redirect URLs allow list or redirects will fail
- **Using localhost in production:** Site URL must be production URL, not localhost

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email link rewriting | Custom middleware to redirect after email click | Supabase Site URL configuration | Security risks, breaks verification flow |
| Dynamic redirect handling | Complex client-side logic to handle all redirect scenarios | Dashboard Site URL + emailRedirectTo option | Supabase handles this reliably, custom code fragile |
| Multi-environment URL switching | Complex conditional logic based on env | Multiple URLs in Redirect URLs allow list | Supabase supports wildcards for dev, exact URLs for prod |

**Key insight:** Supabase's email confirmation flow is well-tested and secure. Don't interfere with the email link handling - configure correctly and let Supabase handle the redirect logic.

## Common Pitfalls

### Pitfall 1: Redirect to Wrong URL
**What goes wrong:** After confirming email, user is redirected to localhost instead of production
**Why it happens:** Site URL still set to localhost:3000 from development
**How to avoid:** Update Site URL in dashboard before deploying to production
**Warning signs:** User confirms email but sees localhost URL or "site can't be reached" error

### Pitfall 2: redirectTo Not Working
**What goes wrong:** `emailRedirectTo` option doesn't affect redirect destination
**Why it happens:** Redirect URL not in the allow list in dashboard
**How to avoid:** Always add redirect URLs to the allow list when using `emailRedirectTo`
**Warning signs:** Email confirmation link appears to work but redirects to Site URL instead of custom redirect

### Pitfall 3: Wildcard Mismatch
**What goes wrong:** Wildcard patterns in allow list don't match actual URLs
**Why it happens:** Incorrect wildcard syntax or placement
**How to avoid:** Use `**` for multi-segment wildcards, test exact URL matches
**Warning signs:** Some redirects work, others fail with "redirect URL not allowed" errors

### Pitfall 4: Environment URL Conflicts
**What goes wrong:** Production users redirected to dev environment or vice versa
**Why it happens:** Single Site URL for multiple environments, no environment-specific configuration
**How to avoid:** Use environment variables with `emailRedirectTo` or Management API for per-environment config
**Warning signs:** Users from prod.com see dev.com after confirming email

## Code Examples

### Current Implementation (Already Works)
```typescript
// Source: src/lib/auth.tsx:56-71
const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) {
    return Promise.reject(new Error('Supabase is not configured'))
  }
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  })

  if (error) {
    throw error
  }
}
```

### Dashboard Configuration Steps
```bash
# Manual steps (no code):
1. Login to Supabase Dashboard
2. Select project
3. Navigate to: Authentication > Configuration > URL Configuration
4. Set Site URL to: https://chat.trplan.si
5. Add to Redirect URLs: https://chat.trplan.si/**
6. Save
```

### Environment Variable Approach (Optional Enhancement)
```typescript
// Source: Best practice for multi-environment
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    // Using environment variable instead of window.location.origin
    emailRedirectTo: import.meta.env.VITE_PRODUCTION_URL || window.location.origin,
  },
})
```

## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded localhost URLs | Dashboard configuration + dynamic emailRedirectTo | 2023+ | Better production support, environment-agnostic |
| Manual email link interception | Built-in redirect configuration | Ongoing | Security best practices, reliable flow |

**New tools/patterns to consider:**
- **Management API for CI/CD**: Automate auth config updates during deployment
- **Terraform Provider**: Infrastructure as code for Supabase projects (includes auth config)
- **Environment-specific configs**: Use dev/stage/prod projects or careful URL allow lists

**Deprecated/outdated:**
- **Supabase v1.x Auth API**: Use v2.x (@supabase/supabase-js)
- **Manual email link manipulation**: Security risk, not recommended

## Open Questions

1. **Management API Access Token**
   - What we know: Management API requires access token, can update auth config programmatically
   - What's unclear: How user obtains/sets up access token for their Supabase project
   - Recommendation: Use dashboard configuration for this phase (simpler), Management API is overkill unless building CI/CD pipeline

2. **Current Redirect Behavior in Production**
   - What we know: Code uses `window.location.origin` which will be `https://chat.trplan.si` in production
   - What's unclear: Current dashboard Site URL setting (is it still localhost?)
   - Recommendation: Verify current dashboard setting, update to production URL if needed

## Sources

### Primary (HIGH confidence)
- [Redirect URLs | Supabase Docs](https://supabase.com/docs/guides/auth/redirect-urls) - Comprehensive guide on redirect URL configuration
- [Login with Google | Supabase Docs](https://supabase.com/docs/guides/auth/social-login/auth-google) - Mentions Management API endpoint for auth config
- [Email Templates | Supabase Docs](https://supabase.com/docs/guides/auth/auth-email-templates) - Explains {{ .RedirectTo }} and {{ .SiteURL }} variables

### Secondary (MEDIUM confidence)
- Current codebase (src/lib/auth.tsx) - Verified existing implementation pattern
- Multiple Stack Overflow/GitHub discussions - Cross-verified common issues and solutions

### Tertiary (LOW confidence - needs validation)
- None - all findings verified

## Metadata

**Research scope:**
- Core technology: Supabase Auth email confirmation
- Ecosystem: Supabase Dashboard, Management API
- Patterns: Site URL configuration, emailRedirectTo option, redirect allow lists
- Pitfalls: Wrong redirects, allow list issues, environment conflicts

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs, widely used
- Architecture: HIGH - from official Supabase docs and current codebase
- Pitfalls: HIGH - documented in docs and community discussions
- Code examples: HIGH - from official docs and verified working code

**Research date:** 2025-01-15
**Valid until:** 2025-02-15 (30 days - Supabase Auth stable, but check for updates)

---

*Phase: 06-email-redirect-config*
*Research completed: 2025-01-15*
*Ready for planning: yes*
