# Code Quality Quick Reference

## Quick Commands

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check types
npm run type-check

# Run all checks
npm run validate
```

## Commit Message Format

```
<type>(<scope>): <subject>
```

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Examples**:
- `feat(pilots): Add bulk update feature`
- `fix(dashboard): Correct pilot count`
- `docs(api): Update endpoint documentation`

## Git Hooks

### Pre-commit (automatic)
- Formats staged files
- Lints and fixes issues
- Runs type-check
- Speed: ~5-10s

### Commit-msg (automatic)
- Validates commit message format
- Speed: < 1s

### Pre-push (automatic)
- Full type-check
- Complete lint
- Build verification
- Speed: ~30-60s

## Emergency Bypass

```bash
# Only for critical hotfixes!
git commit --no-verify -m "hotfix: critical issue"
git push --no-verify
```

## VS Code

Install recommended extensions for best experience:
- Prettier
- ESLint
- Tailwind CSS IntelliSense

Format on save is enabled automatically.

## Help

- See `CODE_STANDARDS.md` for detailed guidelines
- See `PHASE_5.2_CODE_QUALITY_SUMMARY.md` for complete setup info
