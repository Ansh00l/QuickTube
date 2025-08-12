export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Try to fetch transcript using youtube-transcript package
    const { YoutubeTranscript } = await import('youtube-transcript')
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map(entry => entry.text).join(' ')
  } catch (error) {
    // Fallback: You could implement alternative methods here
    throw new Error('Transcript not available for this video')
  }
}
