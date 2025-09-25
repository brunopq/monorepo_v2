import amqplib, { type Channel } from 'amqplib'
import type { ZodType } from 'zod'

import { env } from '~/utils/env'

interface IQueueService<T> {
    publish(message: T): Promise<void>;
    consume(onMessage: (message: T) => Promise<void>): Promise<void>;
}

export default class QueueService<T> implements IQueueService<T> {
    private channel!: Channel
    private readonly queue: string
    private schema: ZodType<T>

    constructor(queue: string, schema: ZodType<T>) {
        this.queue = queue
        this.schema = schema
    }

    async connect(): Promise<void> {
        const conn = await amqplib.connect(env.RABBITMQ_URL)
        this.channel = await conn.createChannel()
        await this.channel.assertQueue(this.queue, { durable: true })
    }

    async publish(message: T): Promise<void> {
        const parsed = this.schema.parse(message)
        this.channel.sendToQueue(this.queue, Buffer.from(JSON.stringify(parsed)), {
            persistent: true,
        })
    }

    async consume(
        handler: (msg: T) => Promise<void>,
    ): Promise<void> {

        this.channel.consume(this.queue, async (msg) => {
            if (!msg) return

            try {
                const payload = JSON.parse(msg.content.toString())
                const parsedPayload = this.schema.parse(payload); // Validate on consume
                await handler(parsedPayload)
                this.channel.ack(msg)
            } catch (err) {
                console.error(`Failed to process message on queue ${this.queue}`, err)
                this.channel.nack(msg, false, false) // reject and drop
            }
        })
    }
}

