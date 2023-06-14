FROM node as build1

WORKDIR /react-app

COPY . .

RUN npm i
RUN npm install react-icons



#FROM gcr.io/distroless/nodejs:10
FROM node:16-alpine as build2
COPY --from=build1 /react-app /react-app
WORKDIR /react-app
EXPOSE 3000

ENTRYPOINT ["npm", "start"]

