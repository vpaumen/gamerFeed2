# react-scripts 1.0.14 and the 2018-era dependencies need Node 14
FROM node:14 AS client-build
WORKDIR /app/client
COPY client/package.json client/yarn.lock ./
RUN yarn install --network-timeout 600000
COPY client/ ./
RUN yarn build

FROM node:14-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock ./
# --ignore-scripts skips the root "install" hook that would reinstall the client
RUN yarn install --production --ignore-scripts --network-timeout 600000 && yarn cache clean
COPY server.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY models/ ./models/
COPY routes/ ./routes/
COPY migrations/ ./migrations/
COPY seeders/ ./seeders/
COPY --from=client-build /app/client/build ./client/build
EXPOSE 3001
USER node
CMD ["node", "server.js"]
