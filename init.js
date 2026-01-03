const fs = require("fs");
const path = require("path");

const folders = [
  "src",
  "src/controllers",
  "src/db",
  "src/middlewares",
  "src/models",
  "src/routes",
  "src/routes/api",
];

const files = [
  { path: ".env", content: "" },
  { path: "src/index.js", content: "// Express app setup" },
  { path: "src/server.js", content: "// Server entry point" },
  { path: "src/db/connection.js", content: "" },
  { path: "src/middlewares/auth.js", content: "" },
  { path: "src/middlewares/upload.js", content: "" },
];

// Створення папок
folders.forEach((folder) => {
  const dirPath = path.join(__dirname, folder);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created folder: ${folder}`);
  }
});

// Створення файлів
files.forEach((file) => {
  const filePath = path.join(__dirname, file.path);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, file.content);
    console.log(`Created file: ${file.path}`);
  }
});

console.log("Project structure created successfully!");
