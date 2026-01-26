# PDF Folder Manager

## Project Overview

A web-based PDF management system that automatically organizes and displays PDFs from monitored folders. The application features a three-column layout:
- **Left Sidebar**: Displays folders containing PDFs
- **Right Sidebar**: Shows PDFs within the selected folder
- **Main Section**: Renders the selected PDF for viewing

Key features:
- Automatic detection of PDFs added to monitored folders
- Dynamic folder and file list updates
- In-browser PDF viewing
- Clean, intuitive navigation

## Architecture

### Directory Structure

```
/
├── public/           # Static files
│   ├── index.html   # Main HTML file
│   ├── styles.css   # Styling
│   └── app.js       # Frontend JavaScript
├── server/          # Backend server
│   └── server.js    # Express server with file monitoring
├── Projects/        # Folder containing PDF subdirectories (configurable via PDF_DIR env var)
└── package.json     # Dependencies
```

### Key Components

- **Frontend**: Three-column layout with dynamic content loading
- **Backend**: Node.js/Express server that monitors filesystem changes
- **File Watcher**: Detects when PDFs are added to folders
- **PDF Renderer**: Displays PDFs in the browser using PDF.js or iframe

### Tech Stack

- **Language**: JavaScript (Node.js)
- **Backend Framework**: Express.js
- **File Monitoring**: chokidar (filesystem watcher)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PDF Viewing**: Browser native PDF viewer or PDF.js

## Development Guidelines

### Code Style

- Follow [style guide name] conventions
- Use meaningful variable and function names
- Write self-documenting code with minimal comments
- Keep functions small and focused on a single responsibility

### Best Practices

- Write tests for new features
- Keep dependencies up to date
- Use version control with meaningful commit messages
- Review code before merging

### Naming Conventions

- **Files**: [e.g., kebab-case, snake_case]
- **Variables**: [e.g., camelCase, snake_case]
- **Constants**: [e.g., UPPER_SNAKE_CASE]
- **Classes**: [e.g., PascalCase]

## Getting Started

### Prerequisites

- [e.g., Node.js 18+, Python 3.9+]
- [e.g., Docker, PostgreSQL]

### Installation

```bash
# Install dependencies
npm install

# Create the Projects directory if it doesn't exist
mkdir -p Projects
```

### Running the Application

```bash
# Development mode
npm start

# The server will start on http://localhost:3000
# Add PDF files to subdirectories in the Projects/ folder
# The website will automatically update
```

## Testing

### Running Tests

```bash
# Run all tests
[test command]

# Run specific test suite
[specific test command]

# Run with coverage
[coverage command]
```

### Writing Tests

- Place tests in the `tests/` directory
- Name test files with `.test.` or `.spec.` suffix
- Follow AAA pattern: Arrange, Act, Assert

## Deployment

### Build Process

```bash
# Build the application
[build command]
```

### Deployment Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

### Environment Variables

- `VAR_NAME`: [description]
- `ANOTHER_VAR`: [description]

## Additional Notes

[Any other important information, gotchas, or context that would be helpful when working on this project]
