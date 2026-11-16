import { configDotenv } from 'dotenv';
import { connect as amqpConnect } from 'amqplib';
import { sleep } from '../../utils/sleep.js';

export default (() => {
    configDotenv({
        quiet: true
    });

    let connection = null;
    let channel = null;

    const isDocker = process.env.IS_DOCKER === 'true';
    const rabbitHost = process.env.RABBITMQ_HOST || (isDocker ? 'rabbitmq_host' : 'localhost');
    const rabbitPort = process.env.RABBITMQ_PORT || '5672';
    const rabbitUser = process.env.RABBITMQ_USER;
    const rabbitPassword = process.env.RABBITMQ_PASSWORD;

    const rabbitUrl = process.env.RABBITMQ_URL || null;
    const rabbitOptions = {
        protocol: 'amqp',
        hostname: rabbitHost,
        port: Number(rabbitPort),
        username: rabbitUser,
        password: rabbitPassword
    };

    const connect = async () => {
        if (connection) {
            return connection;
        }

        const maxAttempts = 10;
        const retryDelayMs = 4;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const connectTarget = rabbitUrl || rabbitOptions;
                connection = await amqpConnect(connectTarget);
                return connection;
            } catch (error) {
                if (attempt === maxAttempts) {
                    console.error(`RabbitMQ falhou após ${maxAttempts} tentativas. Host=${rabbitHost}:${rabbitPort} URL=${rabbitUrl ? rabbitUrl : JSON.stringify(rabbitOptions)}`);
                    throw error;
                }

                console.warn(`RabbitMQ conexão falhou (tentativa ${attempt}/${maxAttempts}), retry em ${retryDelayMs / 1000}s...`);
                await sleep(retryDelayMs);

                console.log(`Tentando conectar novamente ao RabbitMQ (tentativa ${attempt + 1}/${maxAttempts})...`);
            }
        }
    };

    const createChannel = async () => {
        if (!channel) {
            const conn = await connect();
            channel = await conn.createChannel();
        }
        return channel;
    };

    const isConnected = () => connection !== null;

    // Exchange explícito (o nome vem por parâmetro): fanout copia a mensagem para TODAS as filas ligadas
    const assertExchange = async (exchange, type = 'fanout', options = { durable: false }) => {
        const ch = await createChannel();
        await ch.assertExchange(exchange, type, options);
        return ch;
    };

    // Producer: publica no exchange; quem entrega é o fanout
    const notify = async (exchange, event, payload) => {
        const ch = await assertExchange(exchange);
        const message = Buffer.from(JSON.stringify({ event, payload }));

        return ch.publish(exchange, '', message);
    };

    // Consumer: cria uma fila DINÂMICA só deste processo (nome vazio, exclusive) e a liga ao exchange
    const subscribe = async (exchange, onNotification) => {
        const ch = await assertExchange(exchange);
        const { queue } = await ch.assertQueue('', { exclusive: true });

        await ch.bindQueue(queue, exchange, '');

        return ch.consume(queue, (msg) => {
            if (!msg) {
                return;
            }

            const { event, payload } = JSON.parse(msg.content.toString());

            onNotification(event, payload);
        }, { noAck: true });
    };

    const assertQueue = async (queue, options = { durable: true }) => {
        const ch = await createChannel();
        await ch.assertQueue(queue, options);
        return ch;
    };

    const publish = async (queue, message, options = {}) => {
        const ch = await assertQueue(queue);
        const buffer = Buffer.from(typeof message === 'string' ? message : JSON.stringify(message));
        return ch.sendToQueue(queue, buffer, options);
    };

    const consume = async (queue, onMessage, options = { noAck: false }) => {
        const ch = await assertQueue(queue);
        return ch.consume(queue, async (msg) => {
            if (!msg) {
                return;
            }

            await onMessage(msg, ch);

            if (!options.noAck) {
                ch.ack(msg);
            }
        }, options);
    };

    const close = async () => {
        if (channel) {
            await channel.close();
            channel = null;
        }

        if (connection) {
            await connection.close();
            connection = null;
        }
    };

    return {
        connect,
        isConnected,
        createChannel,
        assertQueue,
        assertExchange,
        notify,
        subscribe,
        publish,
        consume,
        close
    };
})();
