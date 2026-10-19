# Usa imagem oficial do Node 25
FROM node:25

# Entra de trabalho
WORKDIR /app

# Copia arquivos necessários para instalar as dependencia node_modules EM TEMPO DE BUILD
COPY src/package*.json ./
COPY src/_worker.js ./
# O resto do código (app/Jobs, database/connections, utils...) entra pelo volume ./src:/app do compose

# Instala dependências + nodemon para "ouvir" as mudanças
RUN npm install -g nodemon && npm install

# Não expõe porta: o worker não é servidor HTTP, só consome a fila do RabbitMQ

# Comando padrão ao iniciar o container
ENTRYPOINT ["nodemon", "_worker.js"]
