import z from "zod"

import { env } from '~/utils/env'

// enviar mensagem precisa de outro token: 592600940597649
const domainWhatsappMessage = z.object({
    to: z.string(),
    templateName: z.string(),
    parameters: z.record(z.string(), z.string()).optional(), // named parameters only for now
})

type DomainWhatsappMessage = z.infer<typeof domainWhatsappMessage>

const MetaNamedParameterInputSchema = z.object({
    type: z.literal("body"),
    parameters: z.array(
        z.object({
            type: z.literal("text"),
            parameter_name: z.string(),
            text: z.string(), // for now only text is supported
        }),
    ),
})

const MetaPositionalParameterInputSchema = z.object({
    type: z.literal("body"),
    parameters: z.array(
        z.object({
            type: z.literal("text"),
            text: z.string(), // for now only text is supported
        }),
    ),
})

const MetaSendMessageSchema = z.object({
    messaging_product: z.literal("whatsapp"),
    recipient_type: z.literal("individual"),
    to: z.string(),
    type: z.literal("template"),
    template: z.object({
        name: z.string(),
        language: z.object({ code: z.literal("pt_BR") }),
        components: z.array(
            z.union([MetaNamedParameterInputSchema, MetaPositionalParameterInputSchema]),
        ),
    }),
})


type MetaSendMessage = z.infer<typeof MetaSendMessageSchema>

const MetaSendMessageSuccessSchema = z.object({
    messaging_product: z.literal("whatsapp"),
    contacts: z.array(
        z.object({
            input: z.string(),
            wa_id: z.string(),
        }),
    ),
    messages: z.array(
        z.object({
            id: z.string(),
        }),
    ),
})

const MetaSendMessageErrorSchema = z.object({
    error: z.object({
        message: z.string(),
        type: z.string(),
        code: z.number(),
        error_data: z.object({
            messaging_product: z.string().optional(),
            details: z.string().optional(),
        }).optional(),
        fbtrace_id: z.string().optional(),
    }),
})

const MetaSendMessageResponseSchema = z.union([
    MetaSendMessageSuccessSchema,
    MetaSendMessageErrorSchema,
])

const sendMessageMapper = {
    toDomain: () => { },
    toMeta: (domainMessage: DomainWhatsappMessage): MetaSendMessage => {
        const components = domainMessage.parameters
            ? Object.entries(domainMessage.parameters).map(([key, value]) => ({
                type: "text" as const,
                parameter_name: key,
                text: value,
            }))
            : [];

        return {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: domainMessage.to,
            type: "template",
            template: {
                name: domainMessage.templateName,
                language: { code: "pt_BR" },
                components: [
                    {
                        type: "body",
                        parameters: components,
                    }
                ]
            },
        };
    },
}

class WhatsappMessageService {
    async sendMessage(payload: DomainWhatsappMessage) {
        const response = await fetch(
            `${env.META_GRAPH_API_URL}/${env.META_PHONE_NUMBER_ID}/messages?access_token=${env.META_API_TOKEN}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sendMessageMapper.toMeta(payload)),
            }
        )

        const data = await response.json()
        const parsed = MetaSendMessageResponseSchema.safeParse(data)

        if (!parsed.success) {
            console.error('Failed to parse WhatsApp API response', {
                data,
                error: parsed.error,
            })
            throw new Error('Failed to parse WhatsApp API response')
        }

        // Check if response is an error
        if ('error' in parsed.data) {
            const errorMessage = `WhatsApp API Error: ${parsed.data.error.message} (Code: ${parsed.data.error.code})`
            const errorDetails = parsed.data.error.error_data?.details
            const fullErrorMessage = errorDetails ? `${errorMessage}. Details: ${errorDetails}` : errorMessage

            console.error('WhatsApp API Error:', {
                message: parsed.data.error.message,
                type: parsed.data.error.type,
                code: parsed.data.error.code,
                details: errorDetails,
                fbtrace_id: parsed.data.error.fbtrace_id,
                payload,
            })

            throw new Error(fullErrorMessage)
        }

        return {
            success: true as const
        }
    }
}

export default new WhatsappMessageService()