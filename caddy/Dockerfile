FROM alpine:edge
 
RUN apk --no-cache add tini git openssh-client \
 && apk --no-cache add --virtual devs tar curl
 
#Install Caddy Server
RUN curl -OL "https://github.com/caddyserver/caddy/releases/download/v2.1.1/caddy_2.1.1_linux_amd64.tar.gz"
RUN tar --no-same-owner -C /usr/bin/ -xzf caddy_2.1.1_linux_amd64.tar.gz caddy
 
#Remove build devs
RUN apk del devs
 
#Copy over a default Caddyfile
COPY ./Caddyfile /etc/Caddyfile
COPY ./Caddyfile /etc/caddy/Caddyfile

#USER caddy
 
ENTRYPOINT ["/sbin/tini"]
 
CMD ["caddy", "run", "--config", "/etc/Caddyfile"]