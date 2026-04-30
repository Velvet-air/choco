export async function translateToKo(texts: string[]): Promise<string[]> {
  if (!texts.length) return []

  const results = await Promise.allSettled(
    texts.map(async (text) => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error('translate failed')
      const data = await res.json()
      const translated: string = data?.responseData?.translatedText
      // 번역 결과가 원문과 같거나 비어있으면 원문 반환
      if (!translated || translated === text) return text
      return translated
    }),
  )

  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : texts[i]))
}
