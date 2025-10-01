/// <reference types="bun-types" />

import { afterAll, beforeEach, describe, expect, test } from 'bun:test'

import {
  appendDomainInstructions,
  getDomainConfiguration,
  normaliseDomainList,
  resetDomainConfigurationCache
} from './domain'

const originalEnv = { ...process.env }

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(originalEnv)) {
    if (typeof value === 'string') {
      process.env[key] = value
    } else {
      delete process.env[key]
    }
  }
}

beforeEach(() => {
  restoreEnv()
  delete process.env.DEFAULT_INCLUDE_DOMAINS
  delete process.env.NEXT_PUBLIC_DEFAULT_INCLUDE_DOMAINS
  delete process.env.DEFAULT_EXCLUDE_DOMAINS
  delete process.env.NEXT_PUBLIC_DEFAULT_EXCLUDE_DOMAINS
  delete process.env.DOMAIN_AGENT_INSTRUCTIONS
  delete process.env.NEXT_PUBLIC_DOMAIN_AGENT_INSTRUCTIONS
  resetDomainConfigurationCache()
})

afterAll(() => {
  restoreEnv()
  resetDomainConfigurationCache()
})

describe('getDomainConfiguration', () => {
  test('returns empty defaults when no environment variables are set', () => {
    const configuration = getDomainConfiguration()

    expect(configuration.defaultIncludeDomains).toEqual([])
    expect(configuration.defaultExcludeDomains).toEqual([])
    expect(configuration.agentInstructions).toBeUndefined()
  })

  test('parses comma or newline separated domain lists', () => {
    process.env.DEFAULT_INCLUDE_DOMAINS =
      'example.com, docs.example.com\nblog.example.com'
    process.env.NEXT_PUBLIC_DEFAULT_EXCLUDE_DOMAINS =
      'ads.example.com\ntracker.example.com'
    process.env.DOMAIN_AGENT_INSTRUCTIONS =
      'Focus on official documentation first.'
    resetDomainConfigurationCache()

    const configuration = getDomainConfiguration()

    expect(configuration.defaultIncludeDomains).toEqual([
      'example.com',
      'docs.example.com',
      'blog.example.com'
    ])
    expect(configuration.defaultExcludeDomains).toEqual([
      'ads.example.com',
      'tracker.example.com'
    ])
    expect(configuration.agentInstructions).toBe(
      'Focus on official documentation first.'
    )
  })

  test('prefers server environment variables over NEXT_PUBLIC fallbacks', () => {
    process.env.DEFAULT_INCLUDE_DOMAINS = 'private.example.com'
    process.env.NEXT_PUBLIC_DEFAULT_INCLUDE_DOMAINS = 'public.example.com'
    process.env.NEXT_PUBLIC_DEFAULT_EXCLUDE_DOMAINS =
      'public-excluded.example.com'
    resetDomainConfigurationCache()

    const configuration = getDomainConfiguration()

    expect(configuration.defaultIncludeDomains).toEqual(['private.example.com'])
    expect(configuration.defaultExcludeDomains).toEqual([
      'public-excluded.example.com'
    ])
  })
})

describe('normaliseDomainList', () => {
  test('supports string and array inputs', () => {
    expect(
      normaliseDomainList(
        'one.example.com, two.example.com\n three.example.com'
      )
    ).toEqual(['one.example.com', 'two.example.com', 'three.example.com'])

    expect(
      normaliseDomainList(['four.example.com', '  five.example.com  '])
    ).toEqual(['four.example.com', 'five.example.com'])
  })

  test('returns an empty array for unsupported input', () => {
    expect(normaliseDomainList(undefined)).toEqual([])
    expect(normaliseDomainList(null)).toEqual([])
    expect(normaliseDomainList(123)).toEqual([])
  })
})

describe('appendDomainInstructions', () => {
  test('appends domain instructions when configured', () => {
    process.env.DOMAIN_AGENT_INSTRUCTIONS =
      'Only cite information from example.com domains.'
    resetDomainConfigurationCache()

    const result = appendDomainInstructions('Base prompt')

    expect(result).toContain('Base prompt')
    expect(result).toContain('Domain-specific instructions:')
    expect(result).toContain('Only cite information from example.com domains.')
  })

  test('returns the original prompt when no instructions are set', () => {
    const prompt = 'Base prompt without additions'
    expect(appendDomainInstructions(prompt)).toBe(prompt)
  })
})
