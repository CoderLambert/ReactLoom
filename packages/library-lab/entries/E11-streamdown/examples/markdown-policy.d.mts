import type { StreamdownProps } from 'streamdown'

export function trustedDocumentationUrl(value: string | undefined): string
export const markdownPolicy: Pick<
  StreamdownProps,
  'skipHtml' | 'controls' | 'urlTransform' | 'components'
>
