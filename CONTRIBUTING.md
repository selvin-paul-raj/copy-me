# Contributing to Copy-ME

Thank you for your interest in contributing to Copy-ME! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm, yarn, or pnpm
- Git
- A Supabase account (for database setup)

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/copy_me.git
   cd copy_me
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🎯 How to Contribute

### Types of Contributions
- 🐛 **Bug Reports**: Help us identify and fix issues
- ✨ **Feature Requests**: Suggest new features or improvements
- 📝 **Documentation**: Improve or add documentation
- 🎨 **UI/UX**: Enhance the user interface and experience
- ⚡ **Performance**: Optimize code for better performance

### Contribution Process

1. **Check existing issues** before creating a new one
2. **Create an issue** to discuss major changes
3. **Fork the repository** and create a feature branch
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request** with a clear description

### Branch Naming Convention
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring

## 📝 Coding Standards

### Code Style
- Use TypeScript for all new code
- Follow the existing code formatting (we use Prettier)
- Use meaningful variable and function names
- Add comments for complex logic

### Component Guidelines
- Use functional components with hooks
- Keep components small and focused
- Use proper TypeScript types
- Follow the established file structure

### API Guidelines
- Follow RESTful conventions
- Add proper error handling
- Use appropriate HTTP status codes
- Validate input data

## 🧪 Testing

### Before Submitting
- Test your changes in different browsers
- Test responsive design on various screen sizes
- Verify real-time functionality works correctly
- Check for TypeScript errors: `npm run build`

### Testing Checklist
- [ ] Code builds without errors
- [ ] New features work as expected
- [ ] Existing functionality isn't broken
- [ ] Responsive design is maintained
- [ ] Real-time sync works properly

## 📋 Pull Request Guidelines

### PR Title Format
Use one of these prefixes:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for testing changes

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested locally
- [ ] Tested in different browsers
- [ ] Tested responsive design

## Screenshots (if applicable)
Add screenshots for UI changes
```

## 🐛 Bug Reports

### Before Reporting
1. Check if the issue already exists
2. Try to reproduce the bug
3. Test in different browsers

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 22]
- Device: [e.g. iPhone6, Desktop]
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🔧 Development Tips

### Useful Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types

# Database
# Set up your Supabase project and run the SQL schema
```

### File Structure Guidelines
```
app/
├── api/             # API routes
├── room/            # Room-related pages
├── components/      # Reusable components
├── lib/             # Utilities and configurations
└── hooks/           # Custom React hooks
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the code of conduct

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Email**: selvinpaulraj@gmail.com for direct contact

## ⭐ Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special mentions for outstanding contributions

Thank you for contributing to Copy-ME! 🎉
