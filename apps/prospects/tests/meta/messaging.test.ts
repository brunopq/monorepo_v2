import { expect, it, describe } from 'bun:test'

import WhatsappMessageService from '~/services/meta/WhatsappMessageService'

describe('Meta WhatsApp messaging', () => {
    it('should send a WhatsApp message', async () => {
        // This test assumes that the environment variables are set correctly
        // and that the Meta WhatsApp API is accessible.

        const response = await WhatsappMessageService.sendMessage({
            to: '+5551980223200',
            templateName: 'pre',
        })

        expect(response.success).toBe(true)
    }
    )
})