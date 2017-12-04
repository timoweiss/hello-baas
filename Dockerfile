FROM mhart/alpine-node:9

COPY . .

EXPOSE 8080


CMD [ "npm", "start" ]