// Servidor de documentação OpenAPI
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Servir arquivos estáticos
app.use(express.static(join(__dirname, 'node_modules/swagger-ui-dist')));

// Endpoint para servir o OpenAPI YAML
app.get('/openapi.yaml', (req, res) => {
  try {
    const yamlContent = fs.readFileSync(join(__dirname, 'openapi.yaml'), 'utf8');
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(yamlContent);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar OpenAPI spec' });
  }
});

// Endpoint para servir o OpenAPI JSON
app.get('/openapi.json', (req, res) => {
  try {
    const yamlContent = fs.readFileSync(join(__dirname, 'openapi.yaml'), 'utf8');
    const jsonSpec = yaml.load(yamlContent);
    res.json(jsonSpec);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao converter OpenAPI spec' });
  }
});

// Página principal com Swagger UI
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Defy Invest API Documentation</title>
  <link rel="stylesheet" type="text/css" href="/swagger-ui.css" />
  <style>
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui-bundle.js"></script>
  <script src="/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true
      });
    };
  </script>
</body>
</html>`;
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'docs-server',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`📚 Documentação OpenAPI disponível em: http://localhost:${PORT}`);
  console.log(`🔗 OpenAPI YAML: http://localhost:${PORT}/openapi.yaml`);
  console.log(`🔗 OpenAPI JSON: http://localhost:${PORT}/openapi.json`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});
