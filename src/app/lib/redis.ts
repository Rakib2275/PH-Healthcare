import { createClient } from 'redis';
import config from '../config';

const client = createClient({
    username: config.redis_user,
    password: config.redis_password,
    socket: {
        host: config.redis_host,
        port: Number(config.port)
    }
});