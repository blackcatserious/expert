/// <reference types="bun-types" />

import { describe, expect, test } from 'bun:test'

import { searchSchema } from '@/lib/schema/search'

import { parseToolCallXml } from './parse-tool-call'

describe('parseToolCallXml', () => {
  test('omits optional arrays when no tags are provided', () => {
    const xml = `
      <tool_call>
        <tool>search</tool>
        <parameters>
          <query>Find our release notes</query>
        </parameters>
      </tool_call>
    `

    const { tool, parameters } = parseToolCallXml(xml, searchSchema)

    expect(tool).toBe('search')
    expect(parameters).toBeDefined()
    expect(parameters?.query).toBe('Find our release notes')

    const parameterRecord = parameters as Record<string, unknown>
    expect('include_domains' in parameterRecord).toBe(false)
    expect('exclude_domains' in parameterRecord).toBe(false)
  })

  test('parses comma or newline separated include/exclude lists', () => {
    const xml = `
      <tool_call>
        <tool>search</tool>
        <parameters>
          <query>Summarise the documentation</query>
          <include_domains>example.com, https://docs.example.com\nguides.example.com/faq</include_domains>
          <exclude_domains>ads.example.com\n HTTPS://analytics.example.com/path</exclude_domains>
          <max_results>25</max_results>
        </parameters>
      </tool_call>
    `

    const { parameters } = parseToolCallXml(xml, searchSchema)

    expect(parameters?.include_domains).toEqual([
      'example.com',
      'docs.example.com',
      'guides.example.com'
    ])
    expect(parameters?.exclude_domains).toEqual([
      'ads.example.com',
      'analytics.example.com'
    ])
    expect(parameters?.max_results).toBe(25)
  })
})
