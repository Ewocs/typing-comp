# 🤝 Contributing Guide

Welcome to the TechFest Typing Competition Platform! We appreciate contributions from the community. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and follow our code of conduct:

- **Be Respectful**: Treat all members with respect and courtesy
- **Be Inclusive**: Welcome people of all backgrounds and experiences
- **Be Professional**: Keep discussions focused and constructive
- **Be Collaborative**: Share knowledge and help each other grow

### Enforcement

Violations of the code of conduct may result in removal from the community. Report violations to the project maintainers.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** (v14 or higher)
- **MongoDB** (local or Atlas account)
- **Git** installed and configured
- **GitHub account**
- Basic knowledge of:
  - JavaScript (ES6+)
  - Node.js and Express
  - MongoDB and Mongoose
  - Socket.io
  - HTML5, CSS3, and Vanilla JavaScript

### Fork & Clone

1. **Fork the repository**
   - Click "Fork" button on GitHub
   - Creates a copy in your account

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/typing-platform.git
   cd typing-platform
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/typing-platform.git
   git fetch upstream
   ```

---

## Development Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Create `.env` file in root:

```env
MONGODB_URI=mongodb://localhost:27017/typing-platform
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Verify Setup

- Open `http://localhost:3000/organizer`
- Open `http://localhost:3000/`
- Both interfaces should load without errors

---

## Making Changes

### Branch Naming Convention

Create feature branches with descriptive names:

```bash
# Feature
git checkout -b feature/add-user-authentication

# Bug fix
git checkout -b fix/leaderboard-calculation-error

# Documentation
git checkout -b docs/add-api-examples

# Performance
git checkout -b perf/optimize-database-queries

# Refactor
git checkout -b refactor/socket-event-handlers
```

### Branch from Latest

Always branch from the latest main:

```bash
git checkout main
git pull upstream main
git checkout -b your-feature-branch
```

---

## Commit Guidelines

### Commit Message Format

Follow the conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, dependencies, tooling

### Examples

**Good Commits:**
```
feat(socket): add real-time WPM calculation
fix(leaderboard): correct accuracy percentage calculation
docs(api): add Socket.io events documentation
perf(database): add index to competitions collection
refactor(auth): reorganize authentication middleware
```

**Bad Commits:**
```
Fixed stuff
Updated code
WIP: still working on this
asdf
```

### Commit Best Practices

- ✅ Commit early and often
- ✅ Keep commits focused and logical
- ✅ Write clear, descriptive messages
- ✅ Reference issues: `fix #123`
- ✅ One feature per commit when possible

```bash
# Good workflow
git add src/features/newFeature.js
git commit -m "feat(core): add new feature"

git add tests/newFeature.test.js
git commit -m "test: add tests for new feature"

git add docs/API.md
git commit -m "docs(api): update API documentation"
```

---

## Pull Request Process

### Before Creating PR

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**
   ```bash
   npm start  # Run development server
   npm test   # Run test suite (if available)
   ```

3. **Lint code**
   ```bash
   npm run lint  # If linter configured
   ```

4. **Build if needed**
   ```bash
   npm run build  # If build step exists
   ```

### Creating PR

1. **Push to your fork**
   ```bash
   git push origin your-feature-branch
   ```

2. **Create PR on GitHub**
   - Click "Compare & pull request"
   - Fill in the PR template
   - Add clear title and description

### PR Title Format

```
[TYPE] Brief description of changes

Examples:
[FEATURE] Add user authentication system
[FIX] Fix leaderboard calculation bug
[DOCS] Update API documentation
[PERF] Optimize database queries
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issues
Fixes #123

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactor

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing Done
- [ ] Tested locally
- [ ] No breaking changes
- [ ] Backward compatible

## Screenshots (if applicable)
Add screenshots or GIFs showing the change.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings generated
```

### PR Review Process

- **Code review**: Maintainers will review your code
- **Feedback**: Address any comments or suggestions
- **Approval**: PR will be approved by maintainers
- **Merge**: PR will be merged into main branch

---

## Coding Standards

### JavaScript/Node.js

**Style Guide:**
```javascript
// ✅ Good: Descriptive names, clear logic
async function calculateLeaderboard(competitionId) {
  const competition = await Competition.findById(competitionId);
  
  if (!competition) {
    throw new Error('Competition not found');
  }
  
  const leaderboard = competition.rounds[competition.currentRound].results
    .sort((a, b) => b.wpm - a.wpm)
    .map((result, index) => ({
      rank: index + 1,
      ...result.toObject()
    }));
  
  return leaderboard;
}

// ❌ Bad: Unclear naming, poor structure
async function lb(cid) {
  const c = await Competition.findById(cid);
  if (!c) throw new Error('not found');
  const l = c.rounds[c.currentRound].results.sort((a, b) => b.wpm - a.wpm);
  return l;
}
```

**Rules:**
- Use `const` and `let` (not `var`)
- Use arrow functions for callbacks
- Use template literals for strings
- Use destructuring where applicable
- Add JSDoc comments for functions
- Keep functions focused and small (< 50 lines)

### HTML/CSS

**Style Guide:**
```html
<!-- ✅ Good: Semantic HTML, clear class names -->
<form class="competition-form">
  <div class="form-group">
    <label for="competition-name">Competition Name</label>
    <input 
      id="competition-name"
      type="text"
      class="form-control"
      placeholder="Enter competition name"
      required
    >
  </div>
</form>

<!-- ❌ Bad: Non-semantic, unclear classes -->
<div class="form">
  <div class="div1">
    <label>Name</label>
    <input type="text" class="inp">
  </div>
</div>
```

**Rules:**
- Use semantic HTML5 elements
- Use CSS variables for colors/spacing
- Follow mobile-first responsive design
- Add accessibility attributes (aria-*, alt text)
- Keep CSS organized and modular

### File Organization

```
src/
├── models/          # Database schemas
├── routes/          # API routes
├── socket/          # WebSocket handlers
│   ├── handlers/    # Event-specific logic
│   └── utils/       # Helper functions
├── config/          # Configuration files
├── public/          # Frontend files
│   ├── organizer/
│   ├── participant/
│   └── shared/
└── utils/           # Utility functions
```

---

## Testing Requirements

### Writing Tests

If you add new features, please include tests:

```javascript
// Example test structure
describe('Leaderboard Calculation', () => {
  it('should sort participants by WPM', () => {
    const results = [
      { name: 'John', wpm: 80 },
      { name: 'Jane', wpm: 85 },
      { name: 'Bob', wpm: 75 }
    ];
    
    const leaderboard = calculateLeaderboard(results);
    
    expect(leaderboard[0].name).toBe('Jane');
    expect(leaderboard[0].rank).toBe(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- leaderboard.test.js

# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Checklist

- [ ] Tests pass locally
- [ ] New features have test coverage
- [ ] Edge cases tested
- [ ] No console errors or warnings
- [ ] Tests are descriptive and maintainable

---

## Documentation

### Update Documentation When

- Adding new features → Update README or relevant docs
- Changing API endpoints → Update REST_API.md
- Modifying Socket events → Update SOCKET_API.md
- Changing configuration → Update CONFIG.md
- Finding bugs → Update TROUBLESHOOTING.md

### Documentation Format

All documentation uses **Markdown** format:

```markdown
## Feature Name

Brief description of feature.

### Usage

```javascript
// Code example
```

### Parameters

| Name | Type | Description |
|------|------|-------------|
| param1 | string | Description |

### Example Response

```json
{ "success": true }
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.
```

### Adding Code Examples

- Keep examples concise
- Show both good and bad practices
- Include expected output
- Use syntax highlighting

---

## Reporting Issues

### Bug Report Template

```markdown
## Description
Brief description of the bug.

## Steps to Reproduce
1. Do this
2. Then do this
3. Bug appears

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: macOS/Windows/Linux
- Node version: 16.x
- Browser: Chrome/Firefox/Safari

## Screenshots
[Add screenshots if applicable]

## Additional Context
Any other relevant information.
```

### Feature Request Template

```markdown
## Description
What feature would you like?

## Problem It Solves
Why is this needed?

## Proposed Solution
How should it work?

## Alternative Solutions
Other approaches considered.

## Additional Context
Examples or use cases.
```

### Issue Guidelines

- Search for existing issues first
- Be descriptive and specific
- Include reproduction steps
- Attach screenshots/logs when relevant
- One issue per problem

---

## Areas to Contribute

### High Priority

- 🐛 **Bug Fixes**: Fix reported issues
- 📚 **Documentation**: Improve docs and examples
- ♿ **Accessibility**: Make platform more accessible
- 🚀 **Performance**: Optimize code and database queries
- 🧪 **Tests**: Add test coverage

### Medium Priority

- ✨ **Features**: New typing modes, analytics
- 🎨 **UI/UX**: Improve interface and design
- 🔒 **Security**: Enhance security measures
- 📱 **Mobile**: Improve mobile experience

### Good First Issues

Issues tagged `good-first-issue` are perfect for new contributors:
- Bug fixes
- Documentation improvements
- Code refactoring
- Test additions

---

## Development Tools

### Recommended Extensions (VS Code)

- **ES7+ React/Redux/React-Native snippets**
- **MongoDB for VS Code**
- **Prettier - Code formatter**
- **ESLint**
- **Thunder Client** (for API testing)

### Useful Commands

```bash
# Development
npm run dev          # Start with auto-reload

# Testing
npm test             # Run tests
npm test -- --watch # Watch mode

# Code Quality
npm run lint         # Lint code
npm run format       # Format code

# Building
npm run build        # Build for production
npm start            # Run production build

# Database
npm run db:seed      # Seed database (if available)
npm run db:migrate   # Run migrations (if available)
```

---

## Getting Help

### Resources

- 📖 [README.md](./README.md) - Project overview
- 🚀 [SETUP.md](./SETUP.md) - Setup instructions
- 📡 [SOCKET_API.md](./SOCKET_API.md) - WebSocket events
- 💾 [DATABASE.md](./DATABASE.md) - Database schema
- 🔧 [CONFIG.md](./CONFIG.md) - Configuration options

### Community

- **GitHub Issues**: Ask questions or report bugs
- **Discussions**: General questions and ideas
- **Documentation**: Check docs before asking

### Asking for Help

When asking for help:

1. ✅ Check documentation first
2. ✅ Search existing issues
3. ✅ Provide context and details
4. ✅ Share error messages and logs
5. ✅ Be patient and respectful

---

## Recognition

### Contributors

All contributors are recognized in:
- GitHub contributors page
- `CONTRIBUTORS.md` file
- Release notes
- Project README

### Levels

- **Bronze**: 1-5 contributions
- **Silver**: 6-20 contributions
- **Gold**: 20+ contributions

---

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License as the project.

---

## Questions?

- Check [FAQ in TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review [existing issues](https://github.com/YOUR_REPO/issues)
- Ask in GitHub Discussions
- Contact maintainers

---

**Thank you for contributing to make TechFest Typing Competition Platform better! 🎉**

**Last Updated**: January 4, 2026  
**Version**: 1.0.0
