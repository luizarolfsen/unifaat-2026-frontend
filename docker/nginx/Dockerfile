FROM nginx:stable-alpine

# Remove o default do container
RUN rm /etc/nginx/conf.d/default.conf

# Copia o template: na subida, o nginx troca as ${VARIAVEIS} pelo valor do ambiente e gera o /etc/nginx/conf.d/default.conf
COPY ./docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template