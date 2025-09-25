import { z } from 'zod'

import { env } from '~/utils/env'

/*
{
  "data": [
    {
      "name": "benefcio_indeferido_prev",
      "parameter_format": "NAMED",
      "components": [
        {
          "type": "BODY",
          "text": "Muitas vezes, mesmo apresentando laudos e exames médicos, o INSS nega benefícios aos quais o trabalhador tem direito. Felizmente, esse tipo de decisão pode ser revisto tanto administrativamente quanto judicialmente, e é justamente nisso que nosso escritório é especializado."
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "MARKETING",
      "id": "760676993033161"
    },
    {
      "name": "benef_indef_prev1",
      "parameter_format": "NAMED",
      "components": [
        {
          "type": "BODY",
          "text": "Olá, tudo bem? Sou a Paula, faço parte de uma equipe especializada em benefícios que foram indeferidos, e acabei de entrar em contato com você por telefone. Conforme o processo, estou enviando esta mensagem para dar sequência na análise do seu benefício que foi indeferido pelo INSS ou outro orgão."
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "MARKETING",
      "id": "1821108868836327"
    },
    {
      "name": "solicitacao_de_resposta",
      "parameter_format": "POSITIONAL",
      "components": [
        {
          "type": "BODY",
          "text": "Olá, enviamos uma mensagem e estamos aguardando o seu retorno. Caso não retorne seu caso será dado como resolvido por nossa equipe."
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "UTILITY",
      "sub_category": "CUSTOM",
      "id": "550239581357191"
    },
    {
      "name": "pre",
      "previous_category": "UTILITY",
      "parameter_format": "POSITIONAL",
      "components": [
        {
          "type": "BODY",
          "text": "Oi tudo bem?"
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "MARKETING",
      "correct_category": "MARKETING",
      "id": "1350138509464712"
    },
    {
      "name": "hello_world",
      "parameter_format": "POSITIONAL",
      "components": [
        {
          "type": "HEADER",
          "format": "TEXT",
          "text": "Hello World"
        },
        {
          "type": "BODY",
          "text": "Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us."
        },
        {
          "type": "FOOTER",
          "text": "WhatsApp Business Platform sample message"
        }
      ],
      "language": "en_US",
      "status": "APPROVED",
      "category": "UTILITY",
      "id": "486028580932052"
    },
    {
      "name": "modelo_gerra_it",
      "parameter_format": "POSITIONAL",
      "components": [
        {
          "type": "BODY",
          "text": "Olá, 😊\n\nAqui é a Paula, da equipe da IbotiAdvogados Associados. Durante nossa conversa, você demonstrou interesse em receber mais informações.\n\n✅ Nossa equipe está pronta para te auxiliar com suporte jurídico especializado e tirar todas as suas dúvidas."
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "MARKETING",
      "sub_category": "CUSTOM",
      "id": "609731991673350"
    },
    {
      "name": "minutinho_para_conversar",
      "parameter_format": "NAMED",
      "components": [
        {
          "type": "HEADER",
          "format": "TEXT",
          "text": "Olá, {{ $json.Nome }}, tudo bem?"
        },
        {
          "type": "BODY",
          "text": "Tem um minutinho para a gente conversar?"
        }
      ],
      "language": "pt_BR",
      "status": "APPROVED",
      "category": "MARKETING",
      "sub_category": "CUSTOM",
      "id": "1333180961247810"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MjQZD"
    }
  }
}
*/

const whatsappTemplateParameterFormatSchema = z.enum(['NAMED', 'POSITIONAL'])

const whatsappTemplateComponentSchema = z.object({
    type: z.enum(['BODY', 'HEADER', 'FOOTER']),
    text: z.string(),
    format: z.enum(['TEXT']).optional(),
})

const whatsappMessageTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    language: z.string(),
    status: z.string(),
    category: z.string(),
    sub_category: z.string().optional(),
    parameter_format: whatsappTemplateParameterFormatSchema,
    components: z.array(whatsappTemplateComponentSchema),
})

const listTemplatesResponseSchema = z.object({
    data: z.array(whatsappMessageTemplateSchema),
    // idk about paging
})

export type WhatsappMessageTemplate = z.infer<typeof whatsappMessageTemplateSchema>

const domainMessageTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    // language does not matter
    status: z.string(),
    category: z.string(),
    subCategory: z.string().optional(),
    // parameter_format: whatsappTemplateParameterFormatSchema, // does not matter too
    content: z.string(), // the merged text of all components
    parameterNames: z.array(z.string()),
})

export type DomainMessageTemplate = z.infer<typeof domainMessageTemplateSchema>

const messageMapper = {
    toDomain(template: WhatsappMessageTemplate): DomainMessageTemplate {
        const content = template.components
            .map((component) => component.text)
            .join('\n\n')

        const parameterNames = Array.from(
            content.matchAll(/{{\s*\$json\.([a-zA-Z0-9_]+)\s*}}/g)
        ).map((match) => match[1])

        return {
            id: template.id,
            name: template.name,
            status: template.status,
            category: template.category,
            subCategory: template.sub_category,
            content,
            parameterNames,
        }
    }
}

class WhatsappTemplateService {
    async listTemplates(): Promise<DomainMessageTemplate[]> {
        const response = await fetch(
          `${env.META_GRAPH_API_URL}/${env.META_WABA_ID}/message_templates?access_token=${env.META_API_TOKEN}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )

        if (!response.ok) {
          console.log(response.status, await response.text())
            throw new Error('Failed to fetch WhatsApp message templates')
        }

        const data = await response.json()

        const parsed = listTemplatesResponseSchema.safeParse(data)

        if (!parsed.success) {
            console.error('Failed to parse WhatsApp message templates', {
                data,
                error: parsed.error,
            })
            throw new Error('Failed to parse WhatsApp message templates')
        }

        return parsed.data.data.map(messageMapper.toDomain)
    }
}

export default new WhatsappTemplateService()