const http = require('http');
const port = 8080;

const requiredRoles = process.env.REQUIRED_ROLES || 'ADMIN,DEVELOPER'

const AUTH_HEADERFIELD = 'X-MWAY-BAAS-ROLES'.toLowerCase();;
const INTERNAL_SERVICE_NAME = 'com.example.helloBaaS';

const parsedRequiredRoles = requiredRoles.split(',').filter(r => !!r);

console.log('Server will require the following roles:', parsedRequiredRoles.join(', '))
registerService();
const HANDLERS = {
  '/restricted': (request, response) => {
    /* Header is stringified object like:
    { 
      id: string,
      username: string,
      type: string, ('system' or 'ldap')
      roles:[ 
        { 
          service: string,
          roles: string[] 
        },
      ],
    */
    let authenticated = false;
    if (request.headers[AUTH_HEADERFIELD]) {
      const parsedHeader = JSON.parse(request.headers[AUTH_HEADERFIELD]);
      const serviceRoleObject = parsedHeader.roles.find((element) => {
        return element.service === INTERNAL_SERVICE_NAME;
      });
      if (serviceRoleObject) {
        authenticated = serviceRoleObject.roles.some(
          role => parsedRequiredRoles.some(
            requiredRole => role === requiredRole
          )
        );
      }
    }
    
    if (authenticated) {
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

function registerService() {
  console.log('registering service', Object.keys(process.env).join(', '))
  const options = {
    host: process.env.BAAS_SERVER_NAME || 'localhost',
    path: '/register',
    port: process.env.BAAS_SERVER_PORT || 8081,
    method: 'POST',
  };

  const payload = {
    serviceName: process.env['BAAS_SERVICE_NAME'],
    internalServiceName: INTERNAL_SERVICE_NAME,
    availableRoles: parsedRequiredRoles,
    port,
  };

  const req = http.request(options, (res) => {

    if (res.statusCode !== 200) {
      console.log('Couldn\'t connect to BaaS-Application');
      return;
    }
    let data;

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('registering done')
      // const responseData = JSON.parse(data);
      // TODO: get the uuid and save it, no use case yet
    });
  });

  req.on('error', (err) => {
    const reqError = err;
    console.log('Error while trying to reach BaaS-Application:');
    if (reqError.code === 'ENOTFOUND') {
      console.log('Couldn\'t reach Application at ' + options.host + options.path + ':' + options.port);
    } else {
      console.log(err);
    }
    // process.exit();   // if active will stop service after unsuccessful registration
  });

  req.write(JSON.stringify(payload));
  req.end();

}