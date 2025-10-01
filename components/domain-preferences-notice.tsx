'use client'

import { Globe2, ShieldAlert } from 'lucide-react'

import type { DomainConfiguration } from '@/lib/config/domain'
import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'

interface DomainPreferencesNoticeProps {
  domainConfig?: DomainConfiguration
  className?: string
}

export function DomainPreferencesNotice({
  domainConfig,
  className
}: DomainPreferencesNoticeProps) {
  if (!domainConfig) {
    return null
  }

  const { defaultIncludeDomains, defaultExcludeDomains, agentInstructions } =
    domainConfig

  const hasInclude = defaultIncludeDomains.length > 0
  const hasExclude = defaultExcludeDomains.length > 0
  const hasInstructions = Boolean(agentInstructions)

  if (!hasInclude && !hasExclude && !hasInstructions) {
    return null
  }

  return (
    <div
      className={cn(
        'w-full rounded-3xl border border-input bg-background/80 p-4 text-sm text-muted-foreground shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Globe2 className="size-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Domain guardrails are active
            </p>
            <p className="text-xs text-muted-foreground">
              Searches and agent reasoning will prioritise your configured
              domains.
            </p>
          </div>

          {hasInclude && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                <ShieldAlert className="size-3" />
                Preferred domains
              </div>
              <div className="flex flex-wrap gap-2">
                {defaultIncludeDomains.map(domain => (
                  <Badge key={`include-${domain}`} variant="secondary">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasExclude && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                Deprioritised domains
              </p>
              <div className="flex flex-wrap gap-2">
                {defaultExcludeDomains.map(domain => (
                  <Badge key={`exclude-${domain}`} variant="outline">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasInstructions && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                Agent playbook
              </p>
              <p className="whitespace-pre-line rounded-2xl bg-muted/60 p-3 text-sm text-foreground">
                {agentInstructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
