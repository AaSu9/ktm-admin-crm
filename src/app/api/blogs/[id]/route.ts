import { NextResponse } from 'next/server'
import { getBlog, updateBlog, deleteBlog, createBlog } from '@/app/actions/blogs'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const result = await getBlog(id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json(result.blog)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const data = await request.json()
  const result = await updateBlog(id, data)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json(result.blog)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const result = await deleteBlog(id)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
