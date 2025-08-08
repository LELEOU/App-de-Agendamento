const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000; // Mudando para porta 3000
const publicDir = './app/dist';

console.log('🔍 Verificando se pasta existe:', path.resolve(publicDir));

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log('📥 Requisição:', req.url);
  
  let filePath = path.join(__dirname, publicDir, req.url === '/' ? 'index.html' : req.url);
  console.log('📁 Buscando arquivo:', filePath);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log('❌ Arquivo não encontrado, servindo index.html');
        // Se arquivo não encontrado, serve o index.html (SPA)
        fs.readFile(path.join(__dirname, publicDir, 'index.html'), (error, content) => {
          if (error) {
            console.log('💥 Erro ao ler index.html:', error);
            res.writeHead(500);
            res.end('Erro interno do servidor');
          } else {
            console.log('✅ Servindo index.html como fallback');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        console.log('💥 Erro:', error.code);
        res.writeHead(500);
        res.end('Erro interno do servidor: ' + error.code);
      }
    } else {
      console.log('✅ Arquivo encontrado, servindo:', filePath);
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log('🚀 Servidor rodando em http://localhost:' + port);
  console.log('📁 Servindo arquivos de:', path.resolve(publicDir));
  console.log('🛑 Pressione Ctrl+C para parar o servidor');
  console.log('🌐 Acesse: http://localhost:' + port);
});
