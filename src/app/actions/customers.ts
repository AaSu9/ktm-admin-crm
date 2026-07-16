'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
  type?: string
}) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        notes: formData.notes || null,
        type: formData.type || 'BUYER',
      },
    })
    revalidatePath('/customers')
    return { success: true, customer }
  } catch (error: any) {
    console.error('Failed to create customer:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCustomer(
  id: string,
  formData: {
    name?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
    type?: string
  }
) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email !== undefined ? formData.email || null : undefined,
        address: formData.address !== undefined ? formData.address || null : undefined,
        notes: formData.notes !== undefined ? formData.notes || null : undefined,
        type: formData.type,
      },
    })
    revalidatePath('/customers')
    revalidatePath(`/customers/${id}`)
    return { success: true, customer }
  } catch (error: any) {
    console.error('Failed to update customer:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({
      where: { id },
    })
    revalidatePath('/customers')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete customer:', error)
    return { success: false, error: error.message }
  }
}
