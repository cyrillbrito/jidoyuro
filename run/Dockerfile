FROM mcr.microsoft.com/playwright:bionic
WORKDIR /usr/src/app
COPY . .
RUN npm ci --production
RUN npm run build
CMD ["node", "./dist/app.js"]
