# Contributing Guide

Thank you for your interest in contributing to OpenRooms PWA! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Contribution Guidelines](#contribution-guidelines)
4. [Pull Request Process](#pull-request-process)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Code Review Process](#code-review-process)
7. [Reporting Issues](#reporting-issues)
8. [License](#license)

---

## Code of Conduct

### Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment for our community include:

- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes, and learning from the experience
- Focusing on what is best not just for us as individuals, but for the overall community

Examples of unacceptable behavior include:

- The use of sexualized language or imagery, and sexual attention or advances of any kind
- Trolling, insulting or derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or electronic address, without their explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

### Enforcement

Violations of the Code of Conduct may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

**Maintainers reserve the right to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned with this Code of Conduct.**

---

## Getting Started

### Prerequisites

Before you can contribute, make sure you have the following installed:

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 9.0.0
- [Git](https://git-scm.com/)
- (Optional) [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) for backend development

### Setting Up the Development Environment

1. **Fork the repository**
   
   Click the "Fork" button on the top-right of the repository page on GitHub.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/openrooms-pwa.git
   cd openrooms-pwa
   ```

3. **Add the upstream remote**
   ```bash
   git remote add upstream https://github.com/erikbabcan-commits/openrooms-pwa.git
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   ```

5. **Verify the setup**
   ```bash
   # Start frontend
   pnpm --filter app dev
   
   # In another terminal, start backend
   cd server
   pnpm dev
   ```

6. **Open the application**
   
   Navigate to `http://localhost:3000` in your browser.

For more detailed setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

---

## Contribution Guidelines

### What to Contribute

We welcome contributions in the following areas:

#### Bug Fixes
- Report bugs via GitHub Issues
- Submit pull requests with fixes
- Include tests that reproduce the bug

#### New Features
- Discuss feature ideas in GitHub Discussions or Issues
- Implement features that align with the project's goals
- Ensure features are well-tested

#### Documentation
- Improve existing documentation
- Add missing documentation
- Fix typos and errors

#### Tests
- Add missing test coverage
- Improve existing tests
- Fix flaky tests

#### Code Improvements
- Performance optimizations
- Code refactoring
- Security improvements

### What NOT to Contribute

Please **do not** contribute:

- Features outside the project scope (see [ARCHITECTURE.md](ARCHITECTURE.md))
- Breaking changes without discussion
- Code that violates the Code of Conduct
- Unlicensed code or assets

### Contribution Requirements

All contributions **must**:

1. **Follow the existing code style** (see [DEVELOPMENT.md](DEVELOPMENT.md))
2. **Include appropriate tests** (see [TESTING.md](TESTING.md))
3. **Pass all existing tests**: `pnpm test` and `pnpm test:e2e`
4. **Pass type checking**: `pnpm typecheck`
5. **Maintain test coverage** >= 85% statements / 75% branches
6. **Use descriptive commit messages** (see [Commit Message Conventions](#commit-message-conventions))
7. **Update documentation** when necessary
8. **Respect the project's architecture** (no major rewrites without discussion)

---

## Pull Request Process

### Before Submitting a Pull Request

1. **Check for existing issues**
   
   Search GitHub Issues to ensure your contribution hasn't been requested or implemented already.

2. **Discuss large changes**
   
   For significant changes (new features, architectural changes), open a GitHub Issue or Discussion first to get feedback from maintainers.

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/your-bug-fix
   ```

4. **Keep changes focused**
   
   Each pull request should address **one** specific issue or feature. Avoid bundling multiple unrelated changes.

5. **Update your branch**
   
   Regularly rebase your branch on the latest `main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Submitting a Pull Request

1. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create the Pull Request**
   
   Go to your fork on GitHub and click "Compare & pull request".

3. **Fill in the PR template**
   
   Use the provided PR template and fill in all required sections:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Link to related issues
   - Screenshots (if applicable)
   - Testing information

4. **Request review**
   
   Assign the PR to maintainers for review.

### Pull Request Template

```markdown
## Summary

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Test improvement
- [ ] Other: __________

## Description

Please provide a clear and concise description of the changes:
- What problem does this solve?
- What was changed?
- Why was this change made?

## Related Issues

- Closes #
- Related to #

## Testing

- [ ] All existing tests pass (`pnpm test`)
- [ ] All E2E tests pass (`pnpm test:e2e`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] New tests added for new functionality
- [ ] Coverage maintained >= 85% statements / 75% branches

## Screenshots (if applicable)

## Checklist

- [ ] Code follows project style guidelines
- [ ] Commit messages are descriptive and follow conventions
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or discussed with maintainers)
- [ ] All CI checks pass
```

---

## Commit Message Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. This helps with automated changelog generation and release management.

### Commit Message Format

```
type(scope): subject

body

footer
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(chat): add message reactions` |
| `fix` | Bug fix | `fix(socket): handle reconnection errors` |
| `docs` | Documentation changes | `docs: update README.md` |
| `style` | Code style changes (no functional changes) | `style: format code with Prettier` |
| `refactor` | Code refactoring (no bug fixes or features) | `refactor(hooks): extract useChatSocket logic` |
| `perf` | Performance improvements | `perf(list): implement virtualization` |
| `test` | Test-related changes | `test: add unit tests for escape()` |
| `chore` | Build process or auxiliary tool changes | `chore: update dependencies` |
| `revert` | Revert a previous commit | `revert: feat(chat): add message reactions` |
| `WIP` | Work in progress | `WIP: feat(chat): implement typing indicators` |

### Scopes

Scopes indicate the part of the codebase affected. Common scopes:

- `app` - Frontend application
- `server` - Backend (Worker + Durable Objects)
- `chat` - Chat functionality
- `socket` - WebSocket communication
- `ui` - User interface
- `pwa` - Progressive Web App features
- `docs` - Documentation
- `test` - Testing

### Subject

- Use imperative mood ("add" not "added", "fix" not "fixed")
- Keep it concise (50 characters or less)
- Start with a lowercase letter
- Do not end with a period

### Body

- Explain **what** was changed and **why**
- Reference related issues or PRs
- Include breaking changes if applicable

### Footer

- Reference related issues: `Closes #123` or `Fixes #456`
- Include breaking change notes: `BREAKING CHANGE: ...`

### Examples

```
feat(chat): add message grouping

Implement grouping of consecutive messages from the same user
within a 5-minute window. Messages are grouped with timestamps
only shown on the first message in the group.

Closes #42
```

```
fix(socket): handle reconnection with lastMessageId

Fix issue where reconnecting users would miss messages sent
while they were disconnected. Now sending lastMessageId on
reconnect to sync history.

Fixes #58
```

```
docs: add development guide

Add comprehensive development guide with setup instructions,
debugging tips, and code style guidelines.

Related to #10
```

```
refactor(hooks): extract useVisualViewport logic

Extract visualViewport handling into a separate hook for
better reusability and testability. No functional changes.
```

```
chore: update dependencies

Update React to 18.2.0, Vite to 5.0.0, and TypeScript to 5.3.0.
```

---

## Code Review Process

### For Contributors

1. **Address feedback promptly**
   
   Respond to review comments within a reasonable timeframe (2-3 days).

2. **Be responsive to questions**
   
   Answer clarifying questions from reviewers.

3. **Update the PR**
   
   Push additional commits to address feedback:
   ```bash
   git add .
   git commit -m "fix: address review feedback"
   git push origin feature/your-feature-name
   ```

4. **Squash commits (if requested)**
   
   Before merging, you may be asked to squash commits:
   ```bash
   git rebase -i upstream/main
   # Squash commits using 'squash' or 'fixup'
   git push origin feature/your-feature-name --force
   ```

### For Reviewers

1. **Be constructive**
   
   Focus on improving the code, not criticizing the author.

2. **Be specific**
   
   Point to specific lines of code and explain the issue.

3. **Suggest improvements**
   
   Don't just say "this is wrong" - explain why and suggest a better approach.

4. **Be timely**
   
   Aim to review PRs within 2-3 days.

5. **Check for**:
   - Code quality and style
   - Test coverage
   - Documentation
   - Performance implications
   - Security concerns
   - Breaking changes

---

## Reporting Issues

### Before Reporting

1. **Check existing issues**
   
   Search GitHub Issues to ensure the issue hasn't been reported already.

2. **Check the documentation**
   
   Review [DEVELOPMENT.md](DEVELOPMENT.md), [DEPLOYMENT.md](DEPLOYMENT.md), and [ARCHITECTURE.md](ARCHITECTURE.md).

3. **Try the latest version**
   
   Ensure you're using the latest version of the code.

### How to Report

1. **Create a new GitHub Issue**
   
   Click "New issue" on the repository's Issues page.

2. **Use the issue template**

```markdown
## Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

A clear description of what you expected to happen.

## Actual Behavior

A clear description of what actually happened.

## Screenshots/Video

If applicable, add screenshots or a video to help explain the problem.

## Environment

- OS: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- Browser: [e.g., Chrome 120, Safari 16, Firefox 115]
- Node.js version: [e.g., 20.9.0]
- pnpm version: [e.g., 9.0.0]

## Additional Context

Add any other context about the problem here.

## Possible Solution

If you have suggestions for a fix, describe them here.
```

3. **Add labels**
   
   Add appropriate labels (bug, enhancement, documentation, etc.).

### Issue Triage

Maintainers will triage issues and:
- Acknowledge the issue
- Request additional information if needed
- Assign priority
- Assign to a milestone (if applicable)
- Assign to a contributor (if applicable)

---

## Testing Requirements

All contributions must maintain the project's high test coverage standards.

### Test Coverage Requirements

- **Minimum**: 85% statement coverage / 75% branch coverage per file
- **Target**: 90%+ statement coverage / 85%+ branch coverage
- **Critical files**: 95%+ coverage (useChatSocket, Room.ts, etc.)

### Test Types

1. **Unit Tests** (Vitest)
   - Test individual functions and utilities
   - Test in isolation with mocks
   - Example: `escape()`, `groupMessages()`, `outboundQueue`

2. **Integration Tests** (Vitest + RTL)
   - Test component interactions
   - Test hooks with realistic scenarios
   - Example: `useChatSocket`, `MessageList`, `Composer`

3. **E2E Tests** (Playwright)
   - Test user flows across the application
   - Test WebSocket communication
   - Test mobile-specific behavior
   - Example: message sending, reconnection, offline queue

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run type checking
pnpm typecheck
```

For more details, see [TESTING.md](TESTING.md).

---

## Security Considerations

### Reporting Security Vulnerabilities

**Do NOT report security vulnerabilities in public issues.**

If you discover a security vulnerability, please:

1. **Email the maintainers** at the address in the repository's SECURITY.md (if exists)
2. **Or open a private security advisory** on GitHub
3. **Do not disclose publicly** until a fix is released

### Security Best Practices

- **Input Validation**: Always validate user input on both client and server
- **Output Encoding**: Use React's built-in escaping (never use `dangerouslySetInnerHTML`)
- **Rate Limiting**: Respect server-side rate limits
- **Authentication**: Currently public rooms (no auth), but be mindful of this
- **Data Privacy**: Don't store sensitive user data

---

## Project Maintainers

Current maintainers:
- [erikbabcan-commits](https://github.com/erikbabcan-commits)

### Maintainer Responsibilities

- Review and merge pull requests
- Triage and respond to issues
- Release new versions
- Maintain documentation
- Ensure code quality and test coverage
- Enforce the Code of Conduct

### Becoming a Maintainer

If you're interested in becoming a maintainer:
1. Contribute regularly to the project
2. Demonstrate expertise in the codebase
3. Help other contributors
4. Express interest to current maintainers

---

## License

By contributing to OpenRooms PWA, you agree that your contributions will be licensed under the **MIT License**. See [LICENSE](LICENSE) for the full license text.

---

## Acknowledgments

Thank you to all contributors who have helped make OpenRooms PWA better!

---

## Additional Resources

- [DEVELOPMENT.md](DEVELOPMENT.md) - Local development guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - WebSocket API protocol
- [TESTING.md](TESTING.md) - Testing guide

---

*Last updated: November 2024*
