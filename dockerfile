FROM node:14-alpine

WORKDIR /src
EXPOSE 3000

ENV NODE_ENV=production
COPY . /src
RUN npm install
CMD ["node", "bin/www"]
