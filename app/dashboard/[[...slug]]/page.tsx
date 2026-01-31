import { redirect } from 'next/navigation'

export default async function DashboardRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await params
  const path = slug?.join('/') ?? 'dashboard'
  redirect(`/social/${path}`)
}
