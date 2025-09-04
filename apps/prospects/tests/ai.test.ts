import { expect, it, describe } from 'bun:test'

import { prettifyColumn } from '~/services/ai'

describe('AI column prettifier', () => {
    it('should prettify column names', async () => {
        const birthDate = await prettifyColumn('DAT_NASC')
        const cpf = await prettifyColumn('CPF')
        const phone = await prettifyColumn('NRTELEFONE1')
        const pis = await prettifyColumn('PIS_PASEP')

        console.log({ birthDate, cpf, phone, pis })

        expect(birthDate.toLowerCase()).toMatch(/data.*nascimento/i)
        expect(cpf.toLowerCase()).toBe('CPF'.toLowerCase())
        expect(phone.toLowerCase()).toMatch(/telefone/i)
        // expect(pis.toLowerCase()).toBe('PIS/PASEP'.toLowerCase())
    })

    it('should do a bunch of stuff', async () => {
        await Promise.all([
            "CPF", "PIS", "NOME", "CNPJ", "RAZAOSOCIAL", "DATAADMISSAO", "DATADESLIGAMENTO", "NOME_MAE", "DT_NASC", "SEXO", "IDADE", "ENDERECO", "TIPO_END", "TITULO_END", "LOGR_END", "NUM_END", "COMPLEMENTO_END", "BAIRRO", "CIDADE", "UF", "CEP", "EMAIL", "FONE1", "FONE2", "FONE3", "FONE4"
        ].map(async (col) => {
            const pretty = await prettifyColumn(col)
            console.log(`${col} => ${pretty}`)
        }
        ))

        expect(true).toBe(true)

    })
})