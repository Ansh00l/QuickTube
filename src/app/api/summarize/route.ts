import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      )
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API configuration error. Please check environment variables.' },
        { status: 500 }
      )
    }

    console.log(`Processing video ID: ${videoId}`)

    // Get transcript with enhanced error handling
    let transcriptText: string
    try {
      transcriptText = await getTranscriptEnhanced(videoId)
      
      if (!transcriptText || transcriptText.trim().length === 0) {
        return NextResponse.json(
          { error: 'The video transcript is empty. This video may not have captions or the captions may be unavailable.' },
          { status: 404 }
        )
      }

      if (transcriptText.length < 50) {
        return NextResponse.json(
          { error: 'The video transcript is too short to generate a meaningful summary.' },
          { status: 400 }
        )
      }

      console.log(`Transcript length: ${transcriptText.length} characters`)
      
    } catch (transcriptError) {
      console.error('Transcript error:', transcriptError)
      return NextResponse.json(
        { 
          error: transcriptError instanceof Error ? transcriptError.message : 'Unable to fetch video transcript'
        },
        { status: 404 }
      )
    }

    // Generate summary
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      
      const prompt = `Please provide a comprehensive and well-structured summary of the following YouTube video transcript. 

Format your response as follows:
1. **Main Topic**: Brief description of what the video is about
2. **Key Points**: List the most important points discussed  
3. **Detailed Summary**: Comprehensive overview of the content
4. **Key Takeaways**: Main conclusions or actionable insights

Please make the summary informative, easy to read, and well-organized.

Transcript:
${transcriptText.substring(0, 30000)}`  // Limit to avoid token limits

      const result = await model.generateContent(prompt)
      const response = await result.response
      const summary = response.text()

      return NextResponse.json({ summary })
    } catch (aiError) {
      console.error('AI processing error:', aiError)
      return NextResponse.json(
        { error: 'Failed to generate summary. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error processing video:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process video. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

async function getTranscriptEnhanced(videoId: string): Promise<string> {
  try {
    console.log(`Fetching transcript for video: ${videoId}`)
    
    const { YoutubeTranscript } = await import('youtube-transcript')
    
    // Try with different language options
    const languages = ['en', 'en-US', 'en-GB', undefined]
    
    for (const lang of languages) {
      try {
        const options = lang ? { lang } : {}
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, options)
        
        if (transcript && transcript.length > 0) {
          const transcriptText = transcript.map((entry: any) => entry.text).join(' ')
          if (transcriptText.trim().length > 0) {
            console.log(`Transcript found with language: ${lang || 'auto'}`)
            return transcriptText
          }
        }
      } catch (langError) {
        console.log(`Failed with language ${lang}:`)
        continue
      }
    }
    
    throw new Error('No captions found for this video')
    
  } catch (error) {
    console.error('Transcript fetch error:', error)
    throw new Error('No transcript available. This video may not have captions enabled, may be private, or may have restricted access.')
  }
}
