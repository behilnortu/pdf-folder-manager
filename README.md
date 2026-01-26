# PDF Folder Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/behilnortu/pdf-folder-manager.svg)](https://github.com/behilnortu/pdf-folder-manager/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/behilnortu/pdf-folder-manager.svg)](https://github.com/behilnortu/pdf-folder-manager/issues)
[![GitHub Forks](https://img.shields.io/github/forks/behilnortu/pdf-folder-manager.svg)](https://github.com/behilnortu/pdf-folder-manager/network)

A web-based PDF management system that automatically organizes and displays PDFs from monitored folders. Features a clean three-column layout for easy navigation and viewing.

---

## 📸 Screenshot

![PDF Folder Manager Interface](https://via.placeholder.com/800x500/3498db/ffffff?text=PDF+Folder+Manager)
*Three-column layout: Folders (left) | PDF Viewer (center) | PDF List with Search (right)*

> **Note:** Replace the placeholder above with an actual screenshot of your application by uploading an image to your repository and updating the URL.

---

## ✨ Features

- **Automatic Detection**: Monitors the `Projects/` directory for new PDFs and folders (configurable via `PDF_DIR` env var)
- **Three-Column Layout**:
  - Left sidebar: List of folders containing PDFs
  - Main section: PDF viewer
  - Right sidebar: List of PDFs in selected folder
- **Real-time Updates**: Automatically refreshes when PDFs are added or removed
- **In-browser Viewing**: View PDFs directly in the browser without downloading
- **Search Functionality**: Filter PDFs by name in real-time
- **Folder Creation**: Create new folders directly from the web interface
- **PDF Upload**: Upload PDFs through the web interface (supports multiple files)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/behilnortu/pdf-folder-manager.git
cd pdf-folder-manager

# Install dependencies
npm install

# Start the server
npm start

# Open in your browser
# http://localhost:3000
```

---

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. The `Projects/` directory will be created automatically on first run (or set `PDF_DIR` env var to use a custom path)

## 💻 Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. Using the interface:

   **Creating Folders:**
   - Click the "+ New Folder" button in the left sidebar
   - Enter a folder name in the modal dialog
   - Click "Create" to add the folder

   **Uploading PDFs:**
   - Select a folder from the left sidebar
   - Click the "+ Upload PDF" button in the right sidebar
   - Select one or more PDF files from your computer
   - Files will upload automatically and appear in the list

   **Viewing PDFs:**
   - Click on a folder in the left sidebar to view its PDFs
   - Click on a PDF in the right sidebar to view it in the main section

   **Searching PDFs:**
   - Type in the search box in the right sidebar to filter PDFs by name
   - Search is case-insensitive and updates in real-time

   **Adding PDFs Manually:**
   - You can also create subdirectories in the `Projects/` folder (e.g., `Projects/invoices/`)
   - Add PDF files to these subdirectories
   - The website will automatically detect and display them within 2 seconds

## 📁 Project Structure

```
/
├── public/              # Frontend files
│   ├── index.html      # Main HTML structure
│   ├── styles.css      # Styling
│   └── app.js          # Frontend JavaScript
├── server/             # Backend server
│   └── server.js       # Express server with file monitoring
├── Projects/           # PDF storage (auto-created, configurable via PDF_DIR)
│   ├── folder1/        # Example folder
│   └── folder2/        # Example folder
├── package.json        # Dependencies
└── README.md          # This file
```

## 🎯 Example Setup

To test the application, create some sample folders:

```bash
mkdir -p Projects/invoices
mkdir -p Projects/reports
mkdir -p Projects/contracts
```

Then add some PDF files to these folders, and they will appear automatically in the web interface.

## 🔌 API Endpoints

- `GET /api/folders` - Returns list of all folders
- `GET /api/folders/:folderName/pdfs` - Returns list of PDFs in a folder
- `GET /api/pdf/:folderName/:pdfName` - Serves a specific PDF file
- `POST /api/folders` - Creates a new folder (requires JSON body with `folderName`)
- `POST /api/folders/:folderName/upload` - Uploads PDFs to a folder (multipart/form-data)

## 🛠️ Development

To run with auto-restart on file changes:

```bash
npm run dev
```

## 🧰 Technologies Used

- **Backend**: Node.js, Express.js
- **File Monitoring**: chokidar
- **File Upload**: multer
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **PDF Viewing**: Browser native PDF viewer

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT © [behilnortu](https://github.com/behilnortu)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!
