const http = require('http');
const port = 8080;

const requiredRoles = process.env.REQUIRED_ROLES || 'ADMIN,DEVELOPER'

const AUTH_HEADERFIELD = 'X-MWAY-BAAS-ROLES';

const parsedRequiredRoles = requiredRoles.split(',').filter(r => !!r);

console.log('Server will require the following roles:', parsedRequiredRoles.join(', '))

const HANDLERS = {
  '/restricted': (request, response) => {
    if (request.headers[AUTH_HEADERFIELD] && parsedRequiredRoles.some(role => role === request.headers[AUTH_HEADERFIELD])) {
      return response.end(JSON.stringify({
        message: 'Hello, you are authenticated',
        role: request.headers[AUTH_HEADERFIELD],
      }));
    }

    response.statusCode = 401;
    response.statusMessage = 'Unauthorized';
    response.end(JSON.stringify({ message: response.statusMessage, code: response.statusCode }));
  },
  '/print-headers': (request, response) => {
    response.end(JSON.stringify(request.headers))
  },
  '/print-env': (request, response) => {
    response.end(JSON.stringify(process.env))
  }
};


const server = http.createServer((request, response) => {

  const handler = HANDLERS[request.url];
  if (handler) {
    return handler(request, response);
  }

  response.statusCode = 404;
  response.statusMessage = 'Not Found';
  response.end(JSON.stringify({ message: response.statusMessage, code: response.statusCode }));
})

server.listen(port, (err) => {
  if (err) {
    console.log('Something bad happened', err);
    process.exitCode = 1;
  }

  console.log(`Server is listening on ${port}`);
});