const fs = require('fs').promises;
const path = require('path');

const logFile = path.join(__dirname, '../data/access.log');

// Promise queue para evitar concorrência na escrita do arquivo
let writeQueue = Promise.resolve();

async function loggerMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Captura o e-mail do usuário se o middleware auth.js já o tiver populado
    const user = req.user ? req.user.email : 'anonymous';

    const logLine = `[${timestamp}] ${method} ${url} ${status} - ${duration}ms - IP: ${ip} - User: ${user}\n`;
    
    // Exibe no console para o desenvolvedor
    console.log(logLine.trim());
    
    // Escreve no arquivo access.log com fila
    writeQueue = writeQueue.then(async () => {
      try {
        await fs.appendFile(logFile, logLine, 'utf8');
      } catch (err) {
        console.error('Falha ao escrever log de acesso:', err);
      }
    });
  });
  
  next();
}

module.exports = loggerMiddleware;
