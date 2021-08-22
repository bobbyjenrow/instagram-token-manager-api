FROM node

ENV BASEURL $BASEURL     
ENV INSTAGRAM_APP_ID $INSTAGRAM_APP_ID    
ENV INSTAGRAM_APP_SECRET $INSTAGRAM_APP_SECRET    
ENV INSTAGRAM_APP_NAMESPACE $INSTAGRAM_APP_NAMESPACE     
ENV DB_SERVICE_NAME $DB_SERVICE_NAME
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_NAME $DB_NAME
ENV DB_PASSWORD $DB_PASSWORD

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start" ]