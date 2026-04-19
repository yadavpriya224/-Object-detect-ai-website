import fs from 'fs';
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "exists" : "missing");
console.log("VITE_GEMINI_API_KEY:", process.env.VITE_GEMINI_API_KEY ? "exists" : "missing");
fs.writeFileSync('env_check.txt', `GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "exists" : "missing"}\nVITE_GEMINI_API_KEY: ${process.env.VITE_GEMINI_API_KEY ? "exists" : "missing"}`);
