'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function markMessageRead(id: string) {
  try {
    const message = await prisma.lead.update({
      where: { id },
      data: { status: 'CONTACTED' },
    })
    revalidatePath('/messages')
    return { success: true, message }
  } catch (error: any) {
    console.error('Failed to mark message as read:', error)
    return { success: false, error: error.message }
  }
}

export async function replyToMessage(id: string, reply: string) {
  try {
    // 1. Fetch the lead to get the customer's email
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: { email: true, full_name: true, property_interest: true },
    })

    if (!lead) throw new Error('Message not found')

    // 2. Save the reply to the database
    const message = await prisma.lead.update({
      where: { id },
      data: { 
        status: 'CONTACTED',
        notes: { set: [reply] } 
      },
    })

    // 3. Send email to the customer via Resend API
    let emailSent = false
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY && lead.email) {
      try {
        const subject = lead.property_interest
          ? `Re: Your inquiry about ${lead.property_interest}`
          : 'Re: Your inquiry — KTM Real Estate'

        const htmlBody = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px;">KTM Real Estate</h1>
              <p style="color: #d1fae5; margin: 8px 0 0; font-size: 14px;">Thank you for contacting us</p>
            </div>
            <div style="padding: 32px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong>${lead.full_name}</strong>,</p>
              <p style="color: #374151; font-size: 15px; line-height: 1.6;">Thank you for reaching out to us. Here is our response to your inquiry:</p>
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #1f2937; font-size: 15px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${reply}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
                If you have any further questions, feel free to reply to this email or call us directly.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                KTM Real Estate — Your Trusted Property Partner in Nepal
              </p>
            </div>
          </div>
        `

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'KTM Real Estate <onboarding@resend.dev>',
            to: [lead.email],
            subject,
            html: htmlBody,
          }),
        })

        if (res.ok) {
          emailSent = true
          console.log(`Reply email sent to ${lead.email}`)
        } else {
          const errorText = await res.text()
          console.error('Resend API error:', errorText)
        }
      } catch (emailError) {
        console.error('Failed to send reply email:', emailError)
      }
    } else if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured — reply email not sent')
    }

    revalidatePath('/messages')
    return { 
      success: true, 
      message, 
      emailSent,
      warning: !emailSent ? 'Reply saved but email could not be sent. Check RESEND_API_KEY configuration.' : undefined
    }
  } catch (error: any) {
    console.error('Failed to reply to message:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteMessage(id: string) {
  try {
    await prisma.lead.delete({ where: { id } })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete message:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkMarkMessagesRead(ids: string[]) {
  try {
    await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { status: 'CONTACTED' },
    })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to bulk mark messages:', error)
    return { success: false, error: error.message }
  }
}

export async function bulkDeleteMessages(ids: string[]) {
  try {
    await prisma.lead.deleteMany({
      where: { id: { in: ids } },
    })
    revalidatePath('/messages')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to bulk delete messages:', error)
    return { success: false, error: error.message }
  }
}
