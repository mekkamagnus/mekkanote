/**
 * Org-Mode Parser with real-time syntax highlighting
 * Uses functional programming patterns for robust parsing
 */

import { TaskEither } from '../utils/task-either.ts'
import { pipe } from '../utils/pipeline.ts'
import { Option } from '../utils/lens.ts'
import { OrgElement, OrgElementType, ParseError } from '../types/note.ts'

export interface OrgModeParser {
  parse: (content: string) => TaskEither<ParseError, readonly OrgElement[]>
  parseIncremental: (content: string, startIndex: number) => TaskEither<ParseError, readonly OrgElement[]>
}

interface ParseContext {
  readonly content: string
  readonly position: number
  readonly line: number
  readonly column: number
  readonly elements: readonly OrgElement[]
}

interface TokenizeResult {
  readonly tokens: readonly Token[]
  readonly errors: readonly string[]
}

interface Token {
  readonly type: TokenType
  readonly value: string
  readonly start: number
  readonly end: number
  readonly line: number
  readonly column: number
}

enum TokenType {
  HEADLINE = 'headline',
  TEXT = 'text',
  NEWLINE = 'newline',
  TAG = 'tag',
  TIMESTAMP = 'timestamp',
  PROPERTY = 'property',
  DRAWER_BEGIN = 'drawer_begin',
  DRAWER_END = 'drawer_end',
  CODE_BLOCK_BEGIN = 'code_block_begin',
  CODE_BLOCK_END = 'code_block_end',
  CODE_INLINE = 'code_inline',
  LINK = 'link',
  LIST_ITEM = 'list_item',
  TABLE_ROW = 'table_row',
  FOOTNOTE = 'footnote',
  WHITESPACE = 'whitespace'
}

class OrgModeParserImpl implements OrgModeParser {
  private readonly cache = new Map<string, readonly OrgElement[]>()

  parse = (content: string): TaskEither<ParseError, readonly OrgElement[]> =>
    pipe
      .from(this.validateInput(content))
      .step(validContent => this.tokenize(validContent))
      .step(tokens => this.buildSyntaxTree(tokens))
      .step(elements => this.validateStructure(elements))
      .effect(elements => this.updateCache(content, elements))
      .recover(error => this.handleParseError(error))
      .build()

  parseIncremental = (content: string, startIndex: number): TaskEither<ParseError, readonly OrgElement[]> =>
    pipe
      .from(this.getFromCache(content))
      .step(cachedElements => this.identifyChangedSections(cachedElements, startIndex))
      .step(sections => this.reparseChanged(sections, content))
      .step(newElements => this.mergeParsedElements(cachedElements, newElements))
      .build()

  private validateInput = (content: string): TaskEither<ParseError, string> => {
    if (content.length > 1_000_000) { // 1MB limit
      return TaskEither.left('PARSE_TIMEOUT')
    }
    return TaskEither.right(content)
  }

  private tokenize = (content: string): TaskEither<ParseError, readonly Token[]> =>
    TaskEither.tryCatch(
      async () => {
        const tokens: Token[] = []
        const lines = content.split('\n')
        let position = 0

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
          const line = lines[lineNum]!
          const lineTokens = this.tokenizeLine(line, position, lineNum)
          tokens.push(...lineTokens)
          position += line.length + 1 // +1 for newline
        }

        return tokens
      },
      () => 'SYNTAX_ERROR' as ParseError
    )

  private tokenizeLine = (line: string, startPos: number, lineNum: number): Token[] => {
    const tokens: Token[] = []
    let pos = 0

    while (pos < line.length) {
      const remaining = line.slice(pos)

      // Headlines (*, **, ***, etc.)
      const headlineMatch = remaining.match(/^(\*+)\s+(.+?)(?:\s+:([\w:]+):)?$/)
      if (headlineMatch && pos === 0) {
        const [, stars, title, tags] = headlineMatch
        const level = stars!.length
        
        tokens.push({
          type: TokenType.HEADLINE,
          value: `${stars} ${title}`,
          start: startPos + pos,
          end: startPos + pos + stars!.length + title!.length + 1,
          line: lineNum,
          column: pos
        })

        if (tags) {
          tokens.push({
            type: TokenType.TAG,
            value: tags,
            start: startPos + line.length - tags.length - 1,
            end: startPos + line.length - 1,
            line: lineNum,
            column: line.length - tags.length - 1
          })
        }
        break
      }

      // Properties (:PROPERTY: value)
      const propertyMatch = remaining.match(/^:([A-Z_]+):\s*(.*)$/)
      if (propertyMatch && pos === 0) {
        const [, key, value] = propertyMatch
        tokens.push({
          type: TokenType.PROPERTY,
          value: `:${key}: ${value}`,
          start: startPos + pos,
          end: startPos + line.length,
          line: lineNum,
          column: pos
        })
        break
      }

      // Drawer begin/end
      if (remaining.startsWith(':') && pos === 0) {
        const drawerMatch = remaining.match(/^:([A-Z_]+):$/)
        if (drawerMatch) {
          tokens.push({
            type: drawerMatch[1] === 'END' ? TokenType.DRAWER_END : TokenType.DRAWER_BEGIN,
            value: drawerMatch[0]!,
            start: startPos + pos,
            end: startPos + pos + drawerMatch[0]!.length,
            line: lineNum,
            column: pos
          })
          pos += drawerMatch[0]!.length
          continue
        }
      }

      // Code blocks
      const codeBlockMatch = remaining.match(/^#\+(BEGIN_SRC|END_SRC)(?:\s+(\w+))?/)
      if (codeBlockMatch && pos === 0) {
        tokens.push({
          type: codeBlockMatch[1] === 'BEGIN_SRC' ? TokenType.CODE_BLOCK_BEGIN : TokenType.CODE_BLOCK_END,
          value: codeBlockMatch[0]!,
          start: startPos + pos,
          end: startPos + pos + codeBlockMatch[0]!.length,
          line: lineNum,
          column: pos
        })
        break
      }

      // List items (-, +, *, numbers)
      const listMatch = remaining.match(/^(\s*)([-+*]|\d+[.)]\s+)(.*)$/)
      if (listMatch && pos === 0) {
        const [, indent, marker, content] = listMatch
        tokens.push({
          type: TokenType.LIST_ITEM,
          value: `${indent}${marker}${content}`,
          start: startPos + pos,
          end: startPos + line.length,
          line: lineNum,
          column: pos
        })
        break
      }

      // Timestamps
      const timestampMatch = remaining.match(/<(\d{4}-\d{2}-\d{2})(?:\s+\w+)?(?:\s+\d{1,2}:\d{2})?(?:-\d{1,2}:\d{2})?>/)
      if (timestampMatch) {
        tokens.push({
          type: TokenType.TIMESTAMP,
          value: timestampMatch[0]!,
          start: startPos + pos + remaining.indexOf(timestampMatch[0]!),
          end: startPos + pos + remaining.indexOf(timestampMatch[0]!) + timestampMatch[0]!.length,
          line: lineNum,
          column: pos + remaining.indexOf(timestampMatch[0]!)
        })
      }

      // Links [[url][title]] or [[url]]
      const linkMatch = remaining.match(/\[\[([^\]]+)\](?:\[([^\]]+)\])?\]/)
      if (linkMatch) {
        tokens.push({
          type: TokenType.LINK,
          value: linkMatch[0]!,
          start: startPos + pos + remaining.indexOf(linkMatch[0]!),
          end: startPos + pos + remaining.indexOf(linkMatch[0]!) + linkMatch[0]!.length,
          line: lineNum,
          column: pos + remaining.indexOf(linkMatch[0]!)
        })
      }

      // Inline code
      const inlineCodeMatch = remaining.match(/~([^~]+)~|=([^=]+)=/)
      if (inlineCodeMatch) {
        tokens.push({
          type: TokenType.CODE_INLINE,
          value: inlineCodeMatch[0]!,
          start: startPos + pos + remaining.indexOf(inlineCodeMatch[0]!),
          end: startPos + pos + remaining.indexOf(inlineCodeMatch[0]!) + inlineCodeMatch[0]!.length,
          line: lineNum,
          column: pos + remaining.indexOf(inlineCodeMatch[0]!)
        })
      }

      // Regular text (fallback)
      if (tokens.length === 0 || tokens[tokens.length - 1]?.type !== TokenType.TEXT) {
        tokens.push({
          type: TokenType.TEXT,
          value: line,
          start: startPos + pos,
          end: startPos + line.length,
          line: lineNum,
          column: pos
        })
      }
      break
    }

    return tokens
  }

  private buildSyntaxTree = (tokens: readonly Token[]): TaskEither<ParseError, readonly OrgElement[]> =>
    TaskEither.tryCatch(
      async () => {
        const elements: OrgElement[] = []
        let i = 0

        while (i < tokens.length) {
          const token = tokens[i]!
          const element = this.tokenToElement(token, tokens, i)
          if (element) {
            elements.push(element)
          }
          i++
        }

        return elements
      },
      () => 'INVALID_STRUCTURE' as ParseError
    )

  private tokenToElement = (token: Token, allTokens: readonly Token[], index: number): OrgElement | null => {
    switch (token.type) {
      case TokenType.HEADLINE:
        return this.createHeadlineElement(token, allTokens, index)
      case TokenType.PROPERTY:
        return this.createPropertyElement(token)
      case TokenType.DRAWER_BEGIN:
        return this.createDrawerElement(token, allTokens, index)
      case TokenType.CODE_BLOCK_BEGIN:
        return this.createCodeBlockElement(token, allTokens, index)
      case TokenType.LIST_ITEM:
        return this.createListItemElement(token)
      case TokenType.TIMESTAMP:
        return this.createTimestampElement(token)
      case TokenType.LINK:
        return this.createLinkElement(token)
      case TokenType.CODE_INLINE:
        return this.createInlineCodeElement(token)
      case TokenType.TEXT:
        return this.createParagraphElement(token)
      default:
        return null
    }
  }

  private createHeadlineElement = (token: Token, allTokens: readonly Token[], index: number): OrgElement => {
    const match = token.value.match(/^(\*+)\s+(.+)$/)
    const level = match?.[1]?.length ?? 1
    const title = match?.[2] ?? token.value

    // Look for tags in the same line
    const tagToken = allTokens[index + 1]
    const tags = tagToken?.type === TokenType.TAG 
      ? tagToken.value.split(':').filter(Boolean)
      : []

    return {
      type: OrgElementType.HEADLINE,
      content: title,
      level,
      tags,
      startPosition: token.start,
      endPosition: token.end,
      children: []
    }
  }

  private createPropertyElement = (token: Token): OrgElement => {
    const match = token.value.match(/^:([A-Z_]+):\s*(.*)$/)
    const key = match?.[1] ?? ''
    const value = match?.[2] ?? ''

    return {
      type: OrgElementType.PROPERTY,
      content: token.value,
      properties: { [key]: value },
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private createDrawerElement = (token: Token, allTokens: readonly Token[], index: number): OrgElement => {
    const children: OrgElement[] = []
    let i = index + 1

    // Find drawer content until END
    while (i < allTokens.length && allTokens[i]?.type !== TokenType.DRAWER_END) {
      const childToken = allTokens[i]!
      const childElement = this.tokenToElement(childToken, allTokens, i)
      if (childElement) {
        children.push(childElement)
      }
      i++
    }

    return {
      type: OrgElementType.DRAWER,
      content: token.value,
      children,
      startPosition: token.start,
      endPosition: allTokens[i]?.end ?? token.end
    }
  }

  private createCodeBlockElement = (token: Token, allTokens: readonly Token[], index: number): OrgElement => {
    const language = token.value.match(/BEGIN_SRC\s+(\w+)/)?.[1] ?? ''
    const codeLines: string[] = []
    let i = index + 1

    // Collect code lines until END_SRC
    while (i < allTokens.length && allTokens[i]?.type !== TokenType.CODE_BLOCK_END) {
      const codeToken = allTokens[i]!
      if (codeToken.type === TokenType.TEXT) {
        codeLines.push(codeToken.value)
      }
      i++
    }

    return {
      type: OrgElementType.CODE_BLOCK,
      content: codeLines.join('\n'),
      properties: { language },
      startPosition: token.start,
      endPosition: allTokens[i]?.end ?? token.end
    }
  }

  private createListItemElement = (token: Token): OrgElement => {
    const match = token.value.match(/^(\s*)([-+*]|\d+[.)]\s+)(.*)$/)
    const indent = match?.[1]?.length ?? 0
    const marker = match?.[2] ?? ''
    const content = match?.[3] ?? token.value

    return {
      type: OrgElementType.LIST_ITEM,
      content,
      level: Math.floor(indent / 2), // 2 spaces per level
      properties: { marker: marker.trim() },
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private createTimestampElement = (token: Token): OrgElement => {
    const match = token.value.match(/<(\d{4}-\d{2}-\d{2})(?:\s+\w+)?(?:\s+(\d{1,2}:\d{2}))?(?:-(\d{1,2}:\d{2}))?>/)
    const dateStr = match?.[1] ?? ''
    const timeStr = match?.[2] ?? ''
    
    const timestamp = new Date(`${dateStr}T${timeStr || '00:00'}`)

    return {
      type: OrgElementType.TIMESTAMP,
      content: token.value,
      timestamp,
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private createLinkElement = (token: Token): OrgElement => {
    const match = token.value.match(/\[\[([^\]]+)\](?:\[([^\]]+)\])?\]/)
    const url = match?.[1] ?? ''
    const title = match?.[2] ?? url

    return {
      type: OrgElementType.LINK,
      content: title,
      properties: { url, title },
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private createInlineCodeElement = (token: Token): OrgElement => {
    const content = token.value.replace(/^[~=]|[~=]$/g, '') // Remove delimiters

    return {
      type: OrgElementType.CODE_BLOCK,
      content,
      properties: { inline: 'true' },
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private createParagraphElement = (token: Token): OrgElement => {
    return {
      type: OrgElementType.PARAGRAPH,
      content: token.value,
      startPosition: token.start,
      endPosition: token.end
    }
  }

  private validateStructure = (elements: readonly OrgElement[]): TaskEither<ParseError, readonly OrgElement[]> => {
    // Basic structure validation
    let hasValidStructure = true
    let drawerDepth = 0

    for (const element of elements) {
      if (element.type === OrgElementType.DRAWER) {
        drawerDepth++
      }
      if (drawerDepth > 10) { // Prevent infinite nesting
        hasValidStructure = false
        break
      }
    }

    return hasValidStructure 
      ? TaskEither.right(elements)
      : TaskEither.left('INVALID_STRUCTURE')
  }

  private updateCache = (content: string, elements: readonly OrgElement[]): TaskEither<ParseError, void> => {
    const hash = this.hashContent(content)
    this.cache.set(hash, elements)
    return TaskEither.right(undefined)
  }

  private getFromCache = (content: string): TaskEither<ParseError, readonly OrgElement[]> => {
    const hash = this.hashContent(content)
    const cached = this.cache.get(hash)
    
    return cached 
      ? TaskEither.right(cached)
      : TaskEither.left('SYNTAX_ERROR')
  }

  private identifyChangedSections = (
    cachedElements: readonly OrgElement[], 
    startIndex: number
  ): TaskEither<ParseError, readonly OrgElement[]> => {
    // For simplicity, return all elements - in production would implement diff logic
    return TaskEither.right(cachedElements)
  }

  private reparseChanged = (
    sections: readonly OrgElement[], 
    content: string
  ): TaskEither<ParseError, readonly OrgElement[]> => {
    // Re-parse the sections - for now just return the sections
    return TaskEither.right(sections)
  }

  private mergeParsedElements = (
    cached: readonly OrgElement[], 
    updated: readonly OrgElement[]
  ): TaskEither<ParseError, readonly OrgElement[]> => {
    // Merge logic - for now return updated
    return TaskEither.right([...cached, ...updated])
  }

  private handleParseError = (error: ParseError): TaskEither<ParseError, readonly OrgElement[]> => {
    console.error('Parse error:', error)
    // Return empty elements array for graceful degradation
    return TaskEither.right([])
  }

  private hashContent = (content: string): string => {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }
}

// Factory function
export const createOrgModeParser = (): OrgModeParser => new OrgModeParserImpl()