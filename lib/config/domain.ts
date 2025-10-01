export type DomainConfiguration = {
  defaultIncludeDomains: string[]
  defaultExcludeDomains: string[]
  agentInstructions?: string
}

const LIST_SPLIT_REGEX = /[,\n]/

function getFirstEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function parseListFromString(raw?: string) {
  if (!raw) {
    return []
  }

  return raw
    .split(LIST_SPLIT_REGEX)
    .map(part => part.trim())
    .filter(Boolean)
}

export function normaliseDomainList(input: unknown) {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }

  if (typeof input === 'string') {
    return parseListFromString(input)
  }

  return []
}

let cachedConfiguration: DomainConfiguration | undefined

function buildDomainConfiguration(): DomainConfiguration {
  const defaultIncludeRaw = getFirstEnvValue([
    'DEFAULT_INCLUDE_DOMAINS',
    'NEXT_PUBLIC_DEFAULT_INCLUDE_DOMAINS'
  ])

  const defaultExcludeRaw = getFirstEnvValue([
    'DEFAULT_EXCLUDE_DOMAINS',
    'NEXT_PUBLIC_DEFAULT_EXCLUDE_DOMAINS'
  ])

  const instructionsRaw = getFirstEnvValue([
    'DOMAIN_AGENT_INSTRUCTIONS',
    'NEXT_PUBLIC_DOMAIN_AGENT_INSTRUCTIONS'
  ])

  return {
    defaultIncludeDomains: parseListFromString(defaultIncludeRaw),
    defaultExcludeDomains: parseListFromString(defaultExcludeRaw),
    agentInstructions: instructionsRaw?.trim() || undefined
  }
}

export function getDomainConfiguration(): DomainConfiguration {
  if (!cachedConfiguration) {
    cachedConfiguration = buildDomainConfiguration()
  }

  return cachedConfiguration
}

export function resetDomainConfigurationCache() {
  cachedConfiguration = undefined
}

export function appendDomainInstructions(basePrompt: string) {
  const configuration = getDomainConfiguration()
  if (!configuration.agentInstructions) {
    return basePrompt
  }

  const trimmedBase = basePrompt.trimEnd()
  const separator = trimmedBase.length ? '\n\n' : ''
  return `${trimmedBase}${separator}Domain-specific instructions:\n${configuration.agentInstructions}`
}
