import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const client = openai('gpt-4.1-nano')

export async function prettifyColumn(label: string) {
    const { text } = await generateText({
        model: client,
        system:
            `A sua missão é ajudar a transformar os nomes de colunas de um arquivo CSV em nomes mais amigáveis e compreensíveis.
            Mantenha os nomes curtos e diretos, evitando abreviações.
            Adicione pontuação adequada, como espaços, hífens ou barras, para melhorar a legibilidade.
            Foque apenas em tornar o nome mais legível, amigável e CURTO, sem adicionar informações ou palavras que não sejam relevantes. 
            Não assuma o contexto ou o significado da coluna além do que o nome sugere.
            "CPF" deve permanecer "CPF".
            Se o nome da coluna for auto explicativo, apenas retorne-o como está.
            Retorne apenas o nome em si, sem explicações adicionais.`,
        prompt: `${label}`,
    })

    return text.trim()
}

