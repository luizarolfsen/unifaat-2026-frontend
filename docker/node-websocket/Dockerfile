# Usa imagem oficial do Node 25
FROM node:25

# Entra de trabalho
WORKDIR /app

# Copia arquivos necessários para instalar as dependencia node_modules EM TEMPO DE BUILD
COPY src/package*.json ./
COPY src/_websocket.js ./
# O resto do código (app/Events, database/connections, utils...) entra pelo volume ./src:/app do compose

# Instala dependências + nodemon para "ouvir" as mudanças
RUN npm install -g nodemon && npm install

# Não publica porta no host: só o nginx (rede interna) chega no websocket, em nodewebsocket_host:3001

# Os argumentos (--exchange, --port) vêm do "command" do compose e entram depois do script
ENTRYPOINT ["nodemon", "_websocket.js"]
