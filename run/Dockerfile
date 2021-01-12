FROM mcr.microsoft.com/playwright:focal
WORKDIR /usr/src/app
COPY package.json package*.json ./
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["node", "./dist/app.js"]
