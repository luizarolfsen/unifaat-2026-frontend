# Usa imagem oficial do Node 24
FROM node:24

# Entra de trabalho
WORKDIR /app

# Copia arquivos necessários para instalar as dependencia node_modules EM TEMPO DE BUILD
COPY src/package*.json ./
COPY src/resources/ ./resources/
COPY docker/node24-vite-compiler/vite.config.js ./

# Instala dependências
RUN npm install && npm install -g vite

# Não expõe porta: não é um servidor, só compila resources/ -> public/
# e fica "ouvindo" (--watch) por mudanças nos arquivos fonte

# Comando padrão ao iniciar o container
ENTRYPOINT ["vite", "build", "--watch"]
