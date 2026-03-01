"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"

interface UseSpeechRecognitionReturn {
    isListening: boolean
    transcript: string
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
    supported: boolean
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [supported, setSupported] = useState(false)
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SpeechRecognition) {
            setSupported(true)
            const recognition = new SpeechRecognition()
            recognition.continuous = false // Stop after one phrase
            recognition.interimResults = true
            recognition.lang = "en-IN" // Set to Indian English or dynamic

            recognition.onstart = () => {
                console.log("🎤 Microphone started listening...")
                setIsListening(true)
            }
            recognition.onend = () => {
                console.log("🛑 Microphone stopped listening.")
                setIsListening(false)
            }

            recognition.onresult = (event: any) => {
                let currentTranscript = ""
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript
                }
                console.log("📝 LIVE TRANSCRIPT:", currentTranscript)
                setTranscript(currentTranscript)
            }

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error)

                // Handle specific errors
                if (event.error === 'not-allowed') {
                    toast.error("Microphone access denied. Please allow it in browser settings.")
                } else if (event.error === 'no-speech') {
                    // Silent fail for 'no-speech' as it's common and noisy
                    // Just reset states
                } else {
                    toast.error(`Speech recognition failed: ${event.error}`)
                }
                setIsListening(false)
            }

            recognitionRef.current = recognition
        }
    }, [])

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript("")
            try {
                recognitionRef.current.start()
            } catch (err) {
                console.error("Error starting recognition:", err)
            }
        } else {
            toast.error("Speech recognition not supported in this browser.")
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript("")
    }, [])

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        supported
    }
}
