# Usa imagem oficial do Node 25
FROM node:25

# Entra de trabalho
WORKDIR /app

# Copia arquivos necessários para instalar as dependencia node_modules EM TEMPO DE BUILD
COPY src/package*.json ./
COPY src/_web.js ./
# O resto do código (app/, routes/, resources/views/...) entra pelo volume ./src:/app do compose

# Instala dependências + nodemon para "ouvir" as mudanças
RUN npm install -g nodemon && npm install

# Expõe a porta usada pelo Express (ajuste conforme necessário)
# Foi comentado pois foi exposto no docker compose
# EXPOSE 3000

# Comando padrão ao iniciar o container
ENTRYPOINT ["nodemon", "_web.js"]