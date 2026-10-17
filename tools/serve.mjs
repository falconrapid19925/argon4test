import http from 'node:http';
import path from 'node:path';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};
const documents = new Set([
  'index.html',
  'second_brain_landing_pages.html',
  'cairn_second_brain_iterations.html',
  'second_brain_five_landing_page_iterations.html',
]);

// Serve only deployable files, never source tooling, .git, or dependencies.
export function createServer(directory = root) {
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const name =
        decodeURIComponent(new URL(request.url, 'http://local').pathname).replace(/^\/+/, '') ||
        'index.html';
      if (name === 'favicon.ico') {
        response.writeHead(204).end();
        return;
      }
      const candidate = path.resolve(directory, name);
      if (
        !(documents.has(name) || name.startsWith('assets/')) ||
        !candidate.startsWith(directory + path.sep)
      ) {
        response.writeHead(404).end('Not found');
        return;
      }
      if (
        name.startsWith('assets/') &&
        !candidate.startsWith(path.join(directory, 'assets') + path.sep)
      ) {
        response.writeHead(404).end('Not found');
        return;
      }
      const actual = await realpath(candidate);
      if (
        !actual.startsWith(directory + path.sep) ||
        (name.startsWith('assets/') &&
          !actual.startsWith(path.join(directory, 'assets') + path.sep))
      ) {
        response.writeHead(404).end('Not found');
        return;
      }
      const data = await readFile(actual);
      response.writeHead(200, {
        'Content-Type': `${types[path.extname(actual)] || 'application/octet-stream'}`,
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404).end('Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const directory = process.env.SERVE_DIR ? path.resolve(process.env.SERVE_DIR) : root;
  createServer(directory).listen(Number(process.env.PORT || 8000), '127.0.0.1', () =>
    console.log('Serving on http://127.0.0.1:' + (process.env.PORT || 8000)),
  );
}
