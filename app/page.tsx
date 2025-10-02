import { generateId } from 'ai'

import { getDomainConfiguration } from '@/lib/config/domain'
import { getModels } from '@/lib/config/models'

import { Chat } from '@/components/chat'

export default async function Page() {
  const id = generateId()
  const models = await getModels()
  const domainConfig = getDomainConfiguration()
  return <Chat key={id} id={id} models={models} domainConfig={domainConfig} />
}
