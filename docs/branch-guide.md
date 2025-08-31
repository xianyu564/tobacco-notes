# Branch Guide

This document provides an overview of all branches in the tobacco project and their respective responsibilities.

## Active Branches

### Feature Branches

- `feature/site-static`
  - Purpose: Implements static site generation and related functionality
  - Status: Active development
  
- `feature/contributor-pages`
  - Purpose: Implements contributor profile pages and related features
  - Status: In development

- `feature/feed-seo`
  - Purpose: Implements SEO optimizations for feed pages
  - Status: In development

- `feature/search-filter`
  - Purpose: Implements search and filtering functionality
  - Status: In development

- `feature/sponsor-cta`
  - Purpose: Implements sponsor call-to-action features
  - Status: In development

- `feature/tag-aggregation`
  - Purpose: Implements tag aggregation and organization features
  - Status: In development

### Documentation Branches

- `docs/glossary-contributors-fill`
  - Purpose: Updates and maintains glossary content and contributor information
  - Status: Active

### Internationalization Branches

- `i18n/bilingual-site`
  - Purpose: Implements bilingual support for the site
  - Status: In development

### Fix Branches

- `fix/cli-corrections`
  - Purpose: Fixes and improvements to CLI tools
  - Status: Active

### Maintenance Branches

- `chore/issue-validation`
  - Purpose: Implements issue validation and maintenance tasks
  - Status: Active

### Deprecated Branches

- `deprecated/mirror`
  - Purpose: Previously used for mirroring functionality
  - Status: Deprecated

### Main Branch

- `master`
  - Purpose: Main production branch
  - Status: Stable
  - Note: All feature branches should be merged here after testing

## Branch Naming Convention

We follow these naming conventions for branches:

- `feature/*`: New features and major enhancements
- `fix/*`: Bug fixes and minor corrections
- `docs/*`: Documentation updates
- `chore/*`: Maintenance tasks
- `i18n/*`: Internationalization related changes
- `deprecated/*`: Deprecated features (to be removed)

## Workflow Guidelines

1. All new features should branch off from `master`
2. Feature branches should be merged back to `master` via pull requests
3. Ensure all tests pass before merging
4. Keep branches focused on single features or fixes
5. Delete branches after successful merge to master

## Branch Lifecycle

1. Creation: Branch off from master
2. Development: Active work and commits
3. Testing: Ensure all tests pass
4. Review: Create pull request and get reviews
5. Merge: Merge to master after approval
6. Cleanup: Delete branch after successful merge

## Notes

- Keep branches up to date with master to avoid merge conflicts
- Regularly push your changes to remote
- Use meaningful commit messages
- Document significant changes in the branch
