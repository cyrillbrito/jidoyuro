FROM node:14-alpine
# ENV PLAYWRIGHT_BROWSERS_PATH=0
WORKDIR /usr/src/app
COPY . .
RUN npm ci
RUN npm run build
CMD ["node", "./dist/app.js"]
