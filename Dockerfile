FROM nginx

COPY app /usr/share/nginx/html
#COPY default.conf /etc/nginx/conf.d/default.conf
#COPY start.sh /
#RUN chmod +x /start.sh

#ENTRYPOINT /start.sh