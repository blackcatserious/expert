import { CoreMessage, DataStreamWriter, generateId, JSONValue } from 'ai'
import { z } from 'zod'

import { retrieveSchema } from '../schema/retrieve'
import { searchSchema } from '../schema/search'
import { retrieveTool } from '../tools/retrieve'
import { search } from '../tools/search'
import { videoSearchTool } from '../tools/video-search'
import { ExtendedCoreMessage, SearchResults } from '../types'

import {
  buildToolPlan,
  DEFAULT_FINAL_RESPONSE_INSTRUCTION,
  getLastUserText,
  ToolPlan
} from './tool-planner'

type SupportedLanguage =
  | 'en'
  | 'ru'
  | 'es'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ar'

interface Localization {
  researchSummaryHeading: string
  sourcesDirectoryHeading: string
  noResultsFound: string
  unableToRetrieve: string
  noVideosFound: string
  plannedApproachHeading: string
  noPlanProvided: string
  executedRunsHeading: string
  noToolsExecuted: string
  completedSuccessfully: string
  failedWithError: (error: string) => string
  descriptionLabel: string
  statusLabel: string
  noSourcesInstruction: string
  useSourcesInstruction: (markers: string) => string
  fallbackSearchDescription: (query: string) => string
  defaultFinalInstruction: string
  fallbackResponderInstruction: string
}

const LOCALIZATIONS: Record<SupportedLanguage, Localization> = {
  en: {
    researchSummaryHeading: 'External research summary',
    sourcesDirectoryHeading: 'Source directory',
    noResultsFound: 'No results found.',
    unableToRetrieve: 'Unable to retrieve content.',
    noVideosFound: 'No relevant videos found.',
    plannedApproachHeading: 'Planned approach',
    noPlanProvided: 'No explicit high-level plan provided by the planner.',
    executedRunsHeading: 'Executed tool runs',
    noToolsExecuted: 'No tools were executed.',
    completedSuccessfully: 'Completed successfully',
    failedWithError: (error: string) => `Failed: ${error}`,
    descriptionLabel: 'Description',
    statusLabel: 'Status',
    noSourcesInstruction:
      'No external sources were gathered. Answer using your existing knowledge and note the limitation.',
    useSourcesInstruction: (markers: string) =>
      `Use the numbered sources ${markers} from the research summary when citing evidence. Follow the [number](url) citation format.`,
    fallbackSearchDescription: (query: string) =>
      `Search the web for up-to-date information about "${query}"`,
    defaultFinalInstruction:
      'Please respond to the user using the collected information.',
    fallbackResponderInstruction: 'Please answer the user using the collected information.'
  },
  ru: {
    researchSummaryHeading: 'Сводка внешних исследований',
    sourcesDirectoryHeading: 'Каталог источников',
    noResultsFound: 'Результатов не найдено.',
    unableToRetrieve: 'Не удалось получить содержимое.',
    noVideosFound: 'Подходящих видео не найдено.',
    plannedApproachHeading: 'План действий',
    noPlanProvided: 'Планировщик не предложил подробного плана.',
    executedRunsHeading: 'Выполненные вызовы инструментов',
    noToolsExecuted: 'Инструменты не запускались.',
    completedSuccessfully: 'Выполнено успешно',
    failedWithError: (error: string) => `Сбой: ${error}`,
    descriptionLabel: 'Описание',
    statusLabel: 'Статус',
    noSourcesInstruction:
      'Внешние источники не найдены. Ответь, используя собственные знания, и упомяни это ограничение.',
    useSourcesInstruction: (markers: string) =>
      `Используй пронумерованные источники ${markers} из сводки исследований для цитирования. Применяй формат [номер](url).`,
    fallbackSearchDescription: (query: string) =>
      `Найти в интернете актуальную информацию о "${query}"`,
    defaultFinalInstruction:
      'Пожалуйста, ответь пользователю, используя собранную информацию.',
    fallbackResponderInstruction: 'Пожалуйста, ответь пользователю, используя собранную информацию.'
  },
  es: {
    researchSummaryHeading: 'Resumen de investigación externa',
    sourcesDirectoryHeading: 'Directorio de fuentes',
    noResultsFound: 'No se encontraron resultados.',
    unableToRetrieve: 'No se pudo obtener el contenido.',
    noVideosFound: 'No se encontraron videos relevantes.',
    plannedApproachHeading: 'Plan',
    noPlanProvided: 'El planificador no proporcionó un plan detallado.',
    executedRunsHeading: 'Herramientas ejecutadas',
    noToolsExecuted: 'No se ejecutaron herramientas.',
    completedSuccessfully: 'Completado correctamente',
    failedWithError: (error: string) => `Fallo: ${error}`,
    descriptionLabel: 'Descripción',
    statusLabel: 'Estado',
    noSourcesInstruction:
      'No se recopilaron fuentes externas. Responde con tu conocimiento e indica esta limitación.',
    useSourcesInstruction: (markers: string) =>
      `Usa las fuentes numeradas ${markers} del resumen de investigación al citar. Sigue el formato [número](url).`,
    fallbackSearchDescription: (query: string) =>
      `Buscar en la web información actualizada sobre "${query}"`,
    defaultFinalInstruction:
      'Responde al usuario utilizando la información recopilada.',
    fallbackResponderInstruction: 'Por favor, responde al usuario usando la información recopilada.'
  },
  ja: {
    researchSummaryHeading: '外部リサーチの要約',
    sourcesDirectoryHeading: '参照元一覧',
    noResultsFound: '結果が見つかりませんでした。',
    unableToRetrieve: 'コンテンツを取得できませんでした。',
    noVideosFound: '関連する動画が見つかりませんでした。',
    plannedApproachHeading: '計画',
    noPlanProvided: 'プランナーから明示的な計画は提供されませんでした。',
    executedRunsHeading: '実行したツール',
    noToolsExecuted: 'ツールは実行されませんでした。',
    completedSuccessfully: '正常に完了',
    failedWithError: (error: string) => `失敗: ${error}`,
    descriptionLabel: '内容',
    statusLabel: 'ステータス',
    noSourcesInstruction:
      '外部ソースはありません。既存の知識を使って回答し、その制限に触れてください。',
    useSourcesInstruction: (markers: string) =>
      `引用する際はリサーチ要約の番号付きソース ${markers} を使い、[番号](url) 形式で記載してください。`,
    fallbackSearchDescription: (query: string) =>
      `「${query}」について最新情報を検索する`,
    defaultFinalInstruction:
      '収集した情報を使ってユーザーに回答してください。',
    fallbackResponderInstruction: '収集した情報を使ってユーザーに回答してください。'
  },
  ko: {
    researchSummaryHeading: '외부 조사 요약',
    sourcesDirectoryHeading: '출처 목록',
    noResultsFound: '결과가 없습니다.',
    unableToRetrieve: '콘텐츠를 가져오지 못했습니다.',
    noVideosFound: '관련 동영상을 찾지 못했습니다.',
    plannedApproachHeading: '계획',
    noPlanProvided: '플래너가 구체적인 계획을 제공하지 않았습니다.',
    executedRunsHeading: '실행한 도구',
    noToolsExecuted: '실행한 도구가 없습니다.',
    completedSuccessfully: '성공적으로 완료',
    failedWithError: (error: string) => `실패: ${error}`,
    descriptionLabel: '설명',
    statusLabel: '상태',
    noSourcesInstruction:
      '외부 출처가 없습니다. 기존 지식을 사용해 답변하고 이 제한을 언급하세요.',
    useSourcesInstruction: (markers: string) =>
      `인용할 때는 조사 요약의 번호가 매겨진 출처 ${markers}를 사용하고 [번호](url) 형식을 따르세요.`,
    fallbackSearchDescription: (query: string) =>
      `"${query}"에 대한 최신 정보를 검색합니다`,
    defaultFinalInstruction:
      '수집한 정보를 사용해 사용자에게 답변해 주세요.',
    fallbackResponderInstruction: '수집한 정보를 사용해 사용자에게 답변해 주세요.'
  },
  zh: {
    researchSummaryHeading: '外部研究摘要',
    sourcesDirectoryHeading: '来源目录',
    noResultsFound: '未找到结果。',
    unableToRetrieve: '无法获取内容。',
    noVideosFound: '未找到相关视频。',
    plannedApproachHeading: '计划',
    noPlanProvided: '规划器未提供明确的计划。',
    executedRunsHeading: '已执行的工具',
    noToolsExecuted: '未执行任何工具。',
    completedSuccessfully: '成功完成',
    failedWithError: (error: string) => `失败：${error}`,
    descriptionLabel: '说明',
    statusLabel: '状态',
    noSourcesInstruction:
      '没有收集到外部来源。请根据现有知识回答，并说明这一限制。',
    useSourcesInstruction: (markers: string) =>
      `引用时请使用研究摘要中的编号来源 ${markers}，采用 [编号](url) 格式。`,
    fallbackSearchDescription: (query: string) =>
      `搜索“${query}”的最新信息`,
    defaultFinalInstruction: '请使用收集到的信息回答用户。',
    fallbackResponderInstruction: '请使用收集到的信息回答用户。'
  },
  fr: {
    researchSummaryHeading: 'Résumé de recherche externe',
    sourcesDirectoryHeading: 'Répertoire des sources',
    noResultsFound: 'Aucun résultat trouvé.',
    unableToRetrieve: 'Impossible de récupérer le contenu.',
    noVideosFound: 'Aucune vidéo pertinente trouvée.',
    plannedApproachHeading: 'Approche planifiée',
    noPlanProvided: 'Le planificateur n’a pas fourni de plan détaillé.',
    executedRunsHeading: 'Outils exécutés',
    noToolsExecuted: 'Aucun outil n’a été exécuté.',
    completedSuccessfully: 'Terminé avec succès',
    failedWithError: (error: string) => `Échec : ${error}`,
    descriptionLabel: 'Description',
    statusLabel: 'Statut',
    noSourcesInstruction:
      'Aucune source externe n’a été collectée. Répondez avec vos connaissances et mentionnez cette limite.',
    useSourcesInstruction: (markers: string) =>
      `Utilisez les sources numérotées ${markers} du résumé de recherche pour citer vos preuves. Respectez le format [numéro](url).`,
    fallbackSearchDescription: (query: string) =>
      `Rechercher des informations à jour sur « ${query} »`,
    defaultFinalInstruction:
      'Veuillez répondre à l’utilisateur en vous appuyant sur les informations recueillies.',
    fallbackResponderInstruction: 'Répondez à l’utilisateur en vous appuyant sur les informations recueillies.'
  },
  de: {
    researchSummaryHeading: 'Zusammenfassung externer Recherche',
    sourcesDirectoryHeading: 'Quellenverzeichnis',
    noResultsFound: 'Keine Ergebnisse gefunden.',
    unableToRetrieve: 'Inhalt konnte nicht abgerufen werden.',
    noVideosFound: 'Keine passenden Videos gefunden.',
    plannedApproachHeading: 'Geplanter Ansatz',
    noPlanProvided: 'Der Planer hat keinen detaillierten Plan bereitgestellt.',
    executedRunsHeading: 'Ausgeführte Tools',
    noToolsExecuted: 'Es wurden keine Tools ausgeführt.',
    completedSuccessfully: 'Erfolgreich abgeschlossen',
    failedWithError: (error: string) => `Fehlgeschlagen: ${error}`,
    descriptionLabel: 'Beschreibung',
    statusLabel: 'Status',
    noSourcesInstruction:
      'Es wurden keine externen Quellen gesammelt. Antworte mit deinem vorhandenen Wissen und erwähne diese Einschränkung.',
    useSourcesInstruction: (markers: string) =>
      `Verwende beim Zitieren die nummerierten Quellen ${markers} aus der Recherche-Zusammenfassung. Nutze das Format [Nummer](URL).`,
    fallbackSearchDescription: (query: string) =>
      `Im Web nach aktuellen Informationen zu „${query}“ suchen`,
    defaultFinalInstruction:
      'Bitte beantworte die Nutzerfrage mit den gesammelten Informationen.',
    fallbackResponderInstruction:
      'Bitte beantworte die Frage des Nutzers mit den gesammelten Informationen.'
  },
  it: {
    researchSummaryHeading: 'Sintesi della ricerca esterna',
    sourcesDirectoryHeading: 'Elenco delle fonti',
    noResultsFound: 'Nessun risultato trovato.',
    unableToRetrieve: 'Impossibile recuperare il contenuto.',
    noVideosFound: 'Nessun video pertinente trovato.',
    plannedApproachHeading: 'Approccio pianificato',
    noPlanProvided: 'Il pianificatore non ha fornito un piano dettagliato.',
    executedRunsHeading: 'Strumenti eseguiti',
    noToolsExecuted: 'Nessuno strumento è stato eseguito.',
    completedSuccessfully: 'Completato con successo',
    failedWithError: (error: string) => `Non riuscito: ${error}`,
    descriptionLabel: 'Descrizione',
    statusLabel: 'Stato',
    noSourcesInstruction:
      'Non sono state raccolte fonti esterne. Rispondi con le tue conoscenze e segnala questa limitazione.',
    useSourcesInstruction: (markers: string) =>
      `Usa le fonti numerate ${markers} presenti nella sintesi della ricerca quando citi le prove. Segui il formato [numero](url).`,
    fallbackSearchDescription: (query: string) =>
      `Cerca sul web informazioni aggiornate su "${query}"`,
    defaultFinalInstruction:
      'Rispondi all’utente utilizzando le informazioni raccolte.',
    fallbackResponderInstruction:
      "Rispondi all'utente utilizzando le informazioni raccolte."
  },
  pt: {
    researchSummaryHeading: 'Resumo de pesquisa externa',
    sourcesDirectoryHeading: 'Diretório de fontes',
    noResultsFound: 'Nenhum resultado encontrado.',
    unableToRetrieve: 'Não foi possível obter o conteúdo.',
    noVideosFound: 'Nenhum vídeo relevante encontrado.',
    plannedApproachHeading: 'Abordagem planejada',
    noPlanProvided: 'O planejador não forneceu um plano detalhado.',
    executedRunsHeading: 'Ferramentas executadas',
    noToolsExecuted: 'Nenhuma ferramenta foi executada.',
    completedSuccessfully: 'Concluído com sucesso',
    failedWithError: (error: string) => `Falhou: ${error}`,
    descriptionLabel: 'Descrição',
    statusLabel: 'Status',
    noSourcesInstruction:
      'Nenhuma fonte externa foi coletada. Responda usando seu conhecimento e mencione essa limitação.',
    useSourcesInstruction: (markers: string) =>
      `Use as fontes numeradas ${markers} do resumo de pesquisa ao citar evidências. Siga o formato [número](url).`,
    fallbackSearchDescription: (query: string) =>
      `Pesquisar na web por informações atualizadas sobre "${query}"`,
    defaultFinalInstruction:
      'Responda ao usuário usando as informações coletadas.',
    fallbackResponderInstruction:
      'Responda ao usuário utilizando as informações coletadas.'
  },
  ar: {
    researchSummaryHeading: 'ملخص البحث الخارجي',
    sourcesDirectoryHeading: 'دليل المصادر',
    noResultsFound: 'لم يتم العثور على نتائج.',
    unableToRetrieve: 'تعذّر جلب المحتوى.',
    noVideosFound: 'لم يتم العثور على مقاطع فيديو ذات صلة.',
    plannedApproachHeading: 'النهج المخطط',
    noPlanProvided: 'لم يقدّم المخطِّط خطة تفصيلية.',
    executedRunsHeading: 'الأدوات التي تم تنفيذها',
    noToolsExecuted: 'لم يتم تنفيذ أي أدوات.',
    completedSuccessfully: 'اكتملت بنجاح',
    failedWithError: (error: string) => `فشل: ${error}`,
    descriptionLabel: 'الوصف',
    statusLabel: 'الحالة',
    noSourcesInstruction:
      'لم يتم جمع أي مصادر خارجية. أجب باستخدام معرفتك الحالية واذكر هذا القيد.',
    useSourcesInstruction: (markers: string) =>
      `استخدم المصادر المرقمة ${markers} من ملخص البحث عند الاستشهاد بالأدلة. اتبع تنسيق [الرقم](الرابط).`,
    fallbackSearchDescription: (query: string) =>
      `ابحث على الويب عن أحدث المعلومات حول "${query}"`,
    defaultFinalInstruction:
      'يرجى الرد على المستخدم باستخدام المعلومات التي جُمعت.',
    fallbackResponderInstruction:
      'يرجى الرد على المستخدم باستخدام المعلومات التي تم جمعها.'
  }
}

function detectLanguageFromText(text: string): SupportedLanguage {
  if (!text) {
    return 'en'
  }

  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru'
  }

  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'zh'
  }

  if (/[\u3040-\u30FF]/.test(text)) {
    return 'ja'
  }

  if (/[\uAC00-\uD7A3]/.test(text)) {
    return 'ko'
  }

  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar'
  }

  const asciiOnly = /^[\u0000-\u007F]*$/.test(text)

  if (!asciiOnly) {
    if (/[ãõ]/i.test(text) || /ção/i.test(text) || /ções/i.test(text)) {
      return 'pt'
    }

    if (/[œæ]/i.test(text) || /[àâçéèêëîïôûùüÿ]/i.test(text)) {
      return 'fr'
    }

    if (/[àèìòù]/i.test(text)) {
      return 'it'
    }
  }

  if (
    /(?:\b(?:não|nao|esta|está|para|com|dos|das|nos|nas|uma|umas|num|numa|será|serao)\b)/i.test(
      text
    )
  ) {
    return 'pt'
  }

  if (
    /(?:\b(?:il|lo|la|gli|le|uno|una|degli|delle|per|con|non|sono|nel|nella)\b)/i.test(text)
  ) {
    return 'it'
  }

  if (
    /(?:\b(?:le|la|les|des|une|un|pour|avec|sans|est|qui|pas|dans|sur)\b)/i.test(text)
  ) {
    return 'fr'
  }

  if (
    /(?:\b(?:der|die|das|und|nicht|mit|ein|eine|auf|für|zum|zur|den|dem)\b)/i.test(text)
  ) {
    return 'de'
  }

  if (
    /(?:\b(?:el|la|los|las|un|una|de|que|para|con|por|del|al|y|en|se)\b)/i.test(text)
  ) {
    return 'es'
  }

  return 'en'
}

function getLocalization(language: SupportedLanguage): Localization {
  return LOCALIZATIONS[language] ?? LOCALIZATIONS.en
}

interface ToolExecutionResult {
  toolCallDataAnnotation: ExtendedCoreMessage | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter,
  model: string,
  searchMode: boolean
): Promise<ToolExecutionResult> {
  // If search mode is disabled, return empty tool call
  if (!searchMode) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const lastUserText = getLastUserText(coreMessages)
  const language = detectLanguageFromText(lastUserText)

  try {
    const toolPlan = await buildToolPlan({
      messages: coreMessages,
      model
    })

    const execution = await executePlannedTools({
      plan: toolPlan,
      dataStream,
      language
    })

    if (execution) {
      return execution
    }
  } catch (error) {
    console.error('Failed to execute planned tools:', error)
  }

  return fallbackSearch({ coreMessages, dataStream, model, language })
}

type ToolName = 'search' | 'retrieve' | 'videoSearch'

interface ExecutePlannedToolsConfig {
  plan: ToolPlan
  dataStream: DataStreamWriter
  language: SupportedLanguage
}

interface ExecutedStep {
  id: string
  tool: ToolName
  description: string
  parameters: Record<string, any>
  result: any
  error?: string
}

interface SourceReference {
  marker: string
  url: string
  title?: string
  stepId: string
}

interface ExecutionSummary {
  summary: string
  sources: SourceReference[]
}

const searchParameterParser = searchSchema
const retrieveParameterParser = retrieveSchema
const videoSearchParameterParser = z.object({
  query: searchSchema.shape.query,
  max_results: searchSchema.shape.max_results,
  search_depth: z.enum(['basic', 'advanced']).optional(),
  include_domains: searchSchema.shape.include_domains,
  exclude_domains: searchSchema.shape.exclude_domains
})

type SearchParameters = z.infer<typeof searchParameterParser>
type RetrieveParameters = z.infer<typeof retrieveParameterParser>
type VideoSearchParameters = z.infer<typeof videoSearchParameterParser>

type ParsedToolParameters =
  | { tool: 'search'; parameters: SearchParameters }
  | { tool: 'retrieve'; parameters: RetrieveParameters }
  | { tool: 'videoSearch'; parameters: VideoSearchParameters }

async function executePlannedTools({
  plan,
  dataStream,
  language
}: ExecutePlannedToolsConfig): Promise<ToolExecutionResult | null> {
  const localization = getLocalization(language)
  const rawInvocations = plan.toolInvocations ?? []
  const supportedToolNames: ToolName[] = ['search', 'retrieve', 'videoSearch']
  const filteredInvocations = rawInvocations.filter(invocation =>
    supportedToolNames.includes(invocation.tool as ToolName)
  )

  const invocations = filteredInvocations
    .map(invocation => toolInvocationSchemaInternal.safeParse(invocation))
    .filter((parsed): parsed is z.SafeParseSuccess<InvocationData> => parsed.success)
    .map(parsed => parsed.data)

  if (invocations.length === 0 && filteredInvocations.length > 0) {
    return null
  }

  const executedSteps: ExecutedStep[] = []

  for (const invocation of invocations) {
    const parsed = parseInvocationParameters(invocation)

    if (!parsed) {
      continue
    }

    const toolCallId = `call_${generateId()}`
    const callAnnotation = {
      type: 'tool_call',
      data: {
        state: 'call' as const,
        toolCallId,
        toolName: parsed.tool,
        args: JSON.stringify(parsed.parameters),
        description: invocation.description
      }
    }

    dataStream.writeData(callAnnotation)

    try {
      const result = await runTool(parsed)

      const resultAnnotation = {
        ...callAnnotation,
        data: {
          ...callAnnotation.data,
          result: JSON.stringify(result),
          state: 'result' as const
        }
      }

      dataStream.writeMessageAnnotation(resultAnnotation)

      executedSteps.push({
        id: invocation.id,
        tool: parsed.tool,
        description: invocation.description,
        parameters: parsed.parameters,
        result
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown tool execution error'

      const errorAnnotation = {
        ...callAnnotation,
        data: {
          ...callAnnotation.data,
          state: 'result' as const,
          error: message
        }
      }

      dataStream.writeMessageAnnotation(errorAnnotation)

      executedSteps.push({
        id: invocation.id,
        tool: parsed.tool,
        description: invocation.description,
        parameters: parsed.parameters,
        result: null,
        error: message
      })
    }
  }

  const summary = buildExecutionSummary(executedSteps, localization)
  const finalInstruction = getPlanFinalInstruction(plan, localization)

  const toolCallDataAnnotation: ExtendedCoreMessage = {
    role: 'data',
    content: {
      type: 'tool_call',
      data: {
        state: 'result',
        toolCallId: 'agent_pipeline',
        toolName: 'agent',
        result: stringifyResultWithSources(
          {
            plan: plan.plan,
            toolInvocations: plan.toolInvocations,
            finalResponseInstruction: finalInstruction,
            steps: executedSteps
          },
          summary.sources
        )
      }
    } as JSONValue
  }

  const toolCallMessages = createToolResponderMessages({
    plan,
    executedSteps,
    summary,
    localization,
    finalInstruction
  })

  return { toolCallDataAnnotation, toolCallMessages }
}

type InvocationData = {
  id: string
  tool: ToolName
  description: string
  parameters: Record<string, any>
}

const toolInvocationSchemaInternal = z.object({
  id: z.string(),
  tool: z.enum(['search', 'retrieve', 'videoSearch']),
  description: z.string(),
  parameters: z.record(z.any())
})

function parseInvocationParameters(
  invocation: z.infer<typeof toolInvocationSchemaInternal>
): ParsedToolParameters | null {
  try {
    switch (invocation.tool) {
      case 'search':
        return {
          tool: 'search',
          parameters: searchParameterParser.parse(invocation.parameters)
        }
      case 'retrieve':
        return {
          tool: 'retrieve',
          parameters: retrieveParameterParser.parse(invocation.parameters)
        }
      case 'videoSearch':
        return {
          tool: 'videoSearch',
          parameters: videoSearchParameterParser.parse(invocation.parameters)
        }
      default:
        return null
    }
  } catch (error) {
    console.warn('Failed to parse tool parameters', invocation, error)
    return null
  }
}

async function runTool(parsed: ParsedToolParameters) {
  switch (parsed.tool) {
    case 'search': {
      const normalizedSearchDepth =
        parsed.parameters.search_depth === 'advanced' ||
        parsed.parameters.search_depth === 'basic'
          ? parsed.parameters.search_depth
          : undefined

      return await search(
        parsed.parameters.query,
        parsed.parameters.max_results,
        normalizedSearchDepth,
        parsed.parameters.include_domains,
        parsed.parameters.exclude_domains
      )
    }
    case 'retrieve':
      return await retrieveTool.execute(parsed.parameters, {
        toolCallId: parsed.parameters.url,
        messages: []
      })
    case 'videoSearch':
      return await videoSearchTool.execute(parsed.parameters, {
        toolCallId: parsed.parameters.query,
        messages: []
      })
    default:
      return null
  }
}

function buildExecutionSummary(
  steps: ExecutedStep[],
  localization: Localization
): ExecutionSummary {
  let nextMarkerIndex = 1
  const sources: SourceReference[] = []

  const parts = steps.map(step => {
    if (step.error) {
      return `• ${step.description}\n  ⚠️ ${localization.failedWithError(step.error)}`
    }

    switch (step.tool) {
      case 'search': {
        const { text, nextIndex } = formatSearchSummary(
          step,
          {
            startIndex: nextMarkerIndex,
            sources
          },
          localization
        )
        nextMarkerIndex = nextIndex
        return text
      }
      case 'retrieve': {
        const { text, nextIndex } = formatRetrieveSummary(
          step,
          {
            startIndex: nextMarkerIndex,
            sources
          },
          localization
        )
        nextMarkerIndex = nextIndex
        return text
      }
      case 'videoSearch': {
        const { text, nextIndex } = formatVideoSummary(
          step,
          {
            startIndex: nextMarkerIndex,
            sources
          },
          localization
        )
        nextMarkerIndex = nextIndex
        return text
      }
      default:
        return ''
    }
  })

  const filtered = parts.filter(Boolean).map(part => part.trim())
  const sourcesDirectory = formatSourcesDirectory(sources, localization)

  const summaryBody =
    filtered.length > 0
      ? filtered.join('\n\n')
      : steps.length === 0
        ? localization.noToolsExecuted
        : localization.noResultsFound

  const summary =
    `${localization.researchSummaryHeading}:\n\n` +
    summaryBody +
    (sourcesDirectory ? `\n\n${sourcesDirectory}` : '')

  return {
    summary,
    sources
  }
}

function formatSearchSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] },
  localization: Localization
): { text: string; nextIndex: number } {
  const result = step.result as SearchResults | null

  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return {
      text: `• ${step.description}\n  – ${localization.noResultsFound}`,
      nextIndex: context.startIndex
    }
  }

  const topResults = result.results.slice(0, 3)
  const formatted = topResults
    .map((item, index) => {
      const marker = createMarker(context.startIndex + index)
      context.sources.push({
        marker,
        url: item.url,
        title: item.title,
        stepId: step.id
      })
      const snippet = item.content.replace(/\s+/g, ' ').slice(0, 160)
      return `  ${marker} ${item.title} – ${item.url}\n    ${snippet}${
        item.content.length > 160 ? '…' : ''
      }`
    })
    .join('\n')

  return {
    text: `• ${step.description}\n${formatted}`,
    nextIndex: context.startIndex + topResults.length
  }
}

function formatRetrieveSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] },
  localization: Localization
): { text: string; nextIndex: number } {
  const result = step.result as SearchResults | null
  if (!result || !Array.isArray(result.results) || result.results.length === 0) {
    return {
      text: `• ${step.description}\n  – ${localization.unableToRetrieve}`,
      nextIndex: context.startIndex
    }
  }

  const marker = createMarker(context.startIndex)
  const item = result.results[0]
  const snippet = item.content.replace(/\s+/g, ' ').slice(0, 200)

  context.sources.push({
    marker,
    url: item.url,
    title: item.title,
    stepId: step.id
  })

  return {
    text: `• ${step.description}\n  ${marker} ${item.url}\n    ${snippet}${
      item.content.length > 200 ? '…' : ''
    }`,
    nextIndex: context.startIndex + 1
  }
}

function formatVideoSummary(
  step: ExecutedStep,
  context: { startIndex: number; sources: SourceReference[] },
  localization: Localization
): { text: string; nextIndex: number } {
  const result = step.result as
    | { videos?: Array<{ title: string; link: string; snippet?: string }> }
    | null

  const videos = result?.videos

  if (!videos || videos.length === 0) {
    return {
      text: `• ${step.description}\n  – ${localization.noVideosFound}`,
      nextIndex: context.startIndex
    }
  }

  const limitedVideos = videos.slice(0, 3)
  const formatted = limitedVideos
    .map((video, index) => {
      const marker = createMarker(context.startIndex + index)
      context.sources.push({
        marker,
        url: video.link,
        title: video.title,
        stepId: step.id
      })
      const snippet = (video.snippet || '').replace(/\s+/g, ' ').slice(0, 160)
      return `  ${marker} ${video.title} – ${video.link}${
        snippet
          ? `\n    ${snippet}${
              video.snippet && video.snippet.length > 160 ? '…' : ''
            }`
          : ''
      }`
    })
    .join('\n')

  return {
    text: `• ${step.description}\n${formatted}`,
    nextIndex: context.startIndex + limitedVideos.length
  }
}

function formatSourcesDirectory(
  sources: SourceReference[],
  localization: Localization
): string {
  if (sources.length === 0) {
    return ''
  }

  const lines = sources.map(source => {
    const titlePart = source.title ? `${source.title} – ` : ''
    return `${source.marker} ${titlePart}${source.url}`
  })

  return `${localization.sourcesDirectoryHeading}:\n` + lines.join('\n')
}

function createMarker(index: number): string {
  return `[${index}]`
}

function createToolResponderMessages({
  plan,
  executedSteps,
  summary,
  localization,
  finalInstruction
}: {
  plan: ToolPlan
  executedSteps: ExecutedStep[]
  summary: ExecutionSummary
  localization: Localization
  finalInstruction: string
}): CoreMessage[] {
  const messages: CoreMessage[] = []

  messages.push({
    role: 'assistant',
    content: buildPlanAndExecutionOverview(plan, executedSteps, localization)
  })

  messages.push({
    role: 'assistant',
    content: summary.summary
  })

  messages.push({
    role: 'user',
    content: buildFinalResponderInstruction(
      finalInstruction,
      summary.sources,
      localization
    )
  })

  return messages
}

function getPlanFinalInstruction(
  plan: ToolPlan,
  localization: Localization
): string {
  const trimmed = plan.finalResponseInstruction?.trim()

  if (!trimmed || trimmed === DEFAULT_FINAL_RESPONSE_INSTRUCTION) {
    return localization.defaultFinalInstruction
  }

  return trimmed
}

function buildPlanAndExecutionOverview(
  plan: ToolPlan,
  executedSteps: ExecutedStep[],
  localization: Localization
): string {
  const planLines = plan.plan.map((step, index) => {
    return `${index + 1}. ${step.step}\n   ${step.detail}`
  })

  const invocationLines = executedSteps.map(step => {
    const status = step.error
      ? localization.failedWithError(step.error)
      : localization.completedSuccessfully
    return `- ${step.id} (${step.tool})\n  ${localization.descriptionLabel}: ${step.description}\n  ${localization.statusLabel}: ${status}`
  })

  const plannedSection =
    planLines.length > 0
      ? [`${localization.plannedApproachHeading}:`, ...planLines].join('\n')
      : `${localization.plannedApproachHeading}:\n${localization.noPlanProvided}`

  const executedSection =
    invocationLines.length > 0
      ? [`${localization.executedRunsHeading}:`, ...invocationLines].join('\n')
      : `${localization.executedRunsHeading}:\n${localization.noToolsExecuted}`

  return `${plannedSection}\n\n${executedSection}`
}

function buildFinalResponderInstruction(
  baseInstruction: string,
  sources: SourceReference[],
  localization: Localization
): string {
  if (sources.length === 0) {
    return (
      baseInstruction +
      `\n\n${localization.noSourcesInstruction}`
    )
  }

  const markers = sources.map(source => source.marker).join(', ')

  return (
    baseInstruction +
    `\n\n${localization.useSourcesInstruction(markers)}`
  )
}

function buildFallbackOverview(
  executedSteps: ExecutedStep[],
  localization: Localization
): string {
  const details = executedSteps.map(step => {
    const status = step.error
      ? localization.failedWithError(step.error)
      : localization.completedSuccessfully
    return `- ${step.description}\n  ${localization.statusLabel}: ${status}`
  })

  return `${localization.executedRunsHeading}:\n${details.join('\n')}`
}

function stringifyResultWithSources(
  payload: unknown,
  sources: SourceReference[]
): string {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return JSON.stringify({ ...(payload as Record<string, unknown>), sources })
  }

  return JSON.stringify({ value: payload, sources })
}

async function fallbackSearch({
  coreMessages,
  dataStream,
  model,
  language
}: {
  coreMessages: CoreMessage[]
  dataStream: DataStreamWriter
  model: string
  language: SupportedLanguage
}): Promise<ToolExecutionResult> {
  const query = getLastUserText(coreMessages)

  if (!query) {
    return { toolCallDataAnnotation: null, toolCallMessages: [] }
  }

  const localization = getLocalization(language)
  const toolCallId = `call_${generateId()}`

  const callAnnotation = {
    type: 'tool_call',
    data: {
      state: 'call' as const,
      toolCallId,
      toolName: 'search',
      args: JSON.stringify({ query })
    }
  }

  dataStream.writeData(callAnnotation)

  const result = await search(query)

  const resultAnnotation = {
    ...callAnnotation,
    data: {
      ...callAnnotation.data,
      result: JSON.stringify(result),
      state: 'result' as const
    }
  }

  dataStream.writeMessageAnnotation(resultAnnotation)

  const executedSteps: ExecutedStep[] = [
    {
      id: 'fallback-search',
      tool: 'search',
      description: localization.fallbackSearchDescription(query),
      parameters: { query },
      result
    }
  ]

  const summary = buildExecutionSummary(executedSteps, localization)

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: buildFallbackOverview(executedSteps, localization)
    },
    {
      role: 'assistant',
      content: summary.summary
    },
    {
      role: 'user',
      content: buildFinalResponderInstruction(
        localization.fallbackResponderInstruction,
        summary.sources,
        localization
      )
    }
  ]

  return {
    toolCallDataAnnotation: {
      role: 'data',
      content: {
        type: 'tool_call',
        data: {
          ...resultAnnotation.data,
          result: stringifyResultWithSources(
            {
              result,
              steps: executedSteps,
              finalResponseInstruction: localization.fallbackResponderInstruction
            },
            summary.sources
          )
        }
      } as JSONValue
    },
    toolCallMessages
  }
}
