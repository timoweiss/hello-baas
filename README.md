# hello-baas
Minimal sample application for our BaaS solution.

This application exposes two endpoints.

### Routes

* `/restricted`: Route that requires the roles configured with `REQUIRED_ROLES`.
* `/print-env`: Prints the environment variables of the process.
* `/print-headers`: Prints the headers of the request.

### Conifguration

* `REQUIRED_ROLES`: comma-separated list of roles that are granted to access the `/restricted` handler - default: `ADMIN,DEVELOPER`.
