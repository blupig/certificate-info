FROM node:alpine

# Install bash for debugging
RUN apk add --no-cache bash

# Copy code
COPY main.js /app/main.js

# Run app
CMD ["node", "/app/main.js"]
