"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import React from "react";

// Platform-agnostic StreamActions component for VLC/Browser buttons
function getVlcUrl(streamUrl: string) {
  if (typeof window !== "undefined") {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    if (isIOS) {
      // iOS: use x-callback
      return `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`;
    }
    // Android and Desktop: use vlc://
    return `vlc://${streamUrl.replace(/^https?:\/\//, "")}`;
  }
  // Fallback for SSR
  return streamUrl;
}

function StreamActions({ streamUrl, onCopy, isCopied }: { streamUrl: string, onCopy: () => void, isCopied: boolean }) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [vlcUrl, setVlcUrl] = React.useState(streamUrl);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      setIsMobile(isIOS || isAndroid);
      if (isIOS) {
        setVlcUrl(`vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`);
      } else if (isAndroid) {
        setVlcUrl(`vlc://${streamUrl.replace(/^https?:\/\//, "")}`);
      } else {
        setVlcUrl(streamUrl);
      }
    }
  }, [streamUrl]);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? "1.5rem" : "0", marginTop: "1.5rem" }}>
      {isMobile && (
        <a
          href={vlcUrl}
          style={{
            padding: "0.5rem 1rem",
            background: "#ff8800",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in VLC
        </a>
      )}
      <Button
        onClick={onCopy}
        className={cn(
          "bg-white text-black font-semibold py-3 px-6 rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 border border-white",
          isCopied && "bg-gray-700 text-white hover:bg-gray-600 shadow-[0_0_10px_rgba(0,255,0,0.5)]",
        )}
      >
        {isCopied ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-white" /> COPIED!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4 text-black" /> COPY URL
          </>
        )}
      </Button>
    </div>
  );
}

export default function Page() {
  const [magnetLink, setMagnetLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamProgress, setStreamProgress] = useState(0) // 0 idle, 1-4 steps
  const [streamingUrl, setStreamingUrl] = useState("")
  const [isError, setIsError] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  // Remove tunnelPassword state

  const { toast } = useToast()

  const progressSteps = [
    "Processing magnet link...",
    "Starting torrent stream...",
    "Creating secure tunnel...",
    "Stream ready!",
  ]

  const validateMagnetLink = (link: string) => /^magnet:\?xt=urn:[a-z0-9]+:[a-z0-9]{32,40}.*$/i.test(link)

  const handleStartStreaming = async () => {
    setIsError(false)
    setStreamingUrl("")
    setStreamProgress(0)
    setIsCopied(false)
    // setTunnelPassword("") // Remove this

    if (!magnetLink.trim()) {
      toast({
        title: "Error",
        description: "Please paste a magnet link.",
        variant: "destructive",
      })
      return
    }

    if (!validateMagnetLink(magnetLink)) {
      toast({
        title: "Invalid Magnet Link",
        description: "Please enter a valid magnet link format.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setStreamProgress(1)

    try {
      // Simulated async steps for progress UI
      await new Promise((r) => setTimeout(r, 1500))
      setStreamProgress(2)
      await new Promise((r) => setTimeout(r, 2000))
      setStreamProgress(3)
      await new Promise((r) => setTimeout(r, 2500))
      setStreamProgress(4)

      // Call backend API
      const res = await fetch("/api/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet: magnetLink }),
      })
      if (!res.ok) {
        throw new Error("Failed to start stream")
      }
      const data = await res.json()
      setStreamingUrl(data.url)
      // setTunnelPassword(data.password) // Remove this
      setMagnetLink("")

      toast({
        title: "Success!",
        description: "Your stream is ready.",
        variant: "success",
      })
    } catch (err) {
      setIsError(true)
      toast({
        title: "Streaming Failed",
        description: "Could not start the stream. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!streamingUrl) return
    try {
      await navigator.clipboard.writeText(streamingUrl)
      setIsCopied(true)
      toast({
        title: "Copied!",
        description: "Stream URL copied to clipboard.",
        variant: "success",
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL. Please copy manually.",
        variant: "destructive",
      })
    }
  }

  const handleRetry = () => {
    setIsError(false)
    setStreamProgress(0)
    setStreamingUrl("")
    setMagnetLink("")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white font-mono">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
          STREAMFLIX
        </h1>
        <p className="mt-3 text-lg md:text-xl text-gray-400">STREAM TORRENTS INSTANTLY - NO DOWNLOADS NEEDED</p>
      </header>

      <main className="w-full max-w-3xl space-y-8">
        {/* Main Form Section */}
        <section className="bg-white/5 backdrop-blur-lg border border-gray-700 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">INITIATE STREAM PROTOCOL</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              type="text"
              placeholder="PASTE YOUR MAGNET LINK HERE..."
              value={magnetLink}
              onChange={(e) => setMagnetLink(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white focus:border-white transition-all duration-300 font-mono"
              disabled={isLoading}
              aria-label="Magnet link input"
            />
            <Button
              onClick={handleStartStreaming}
              className="bg-white text-black font-semibold py-3 px-6 rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 border border-white"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />}
              {isLoading ? "PROCESSING..." : "START STREAMING"}
            </Button>
          </div>
          <p className="mt-4 text-sm text-gray-500 text-center">OBTAIN MAGNET LINKS FROM STREMIO + TORRENTIO ADDON</p>
        </section>

        {/* Status / Progress Section */}
        {(isLoading || isError || streamingUrl) && (
          <section className="bg-white/5 backdrop-blur-lg border border-gray-700 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">STREAM STATUS LOG</h2>

            {isError ? (
              <div className="text-center text-gray-400 space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-gray-400 drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]" />
                <p className="text-lg font-medium">ERROR: STREAM INITIATION FAILED.</p>
                <Button
                  onClick={handleRetry}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-5 rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all duration-300 border border-gray-600"
                >
                  RETRY
                </Button>
              </div>
            ) : (
              <ul className="space-y-4">
                {progressSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 text-lg transition-colors duration-500",
                      streamProgress > idx ? "text-gray-300" : "text-gray-600",
                      streamProgress === idx + 1 && isLoading
                        ? "text-white font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                        : "",
                    )}
                  >
                    {streamProgress > idx ? (
                      <CheckCircle className="h-6 w-6 text-gray-300 drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]" />
                    ) : streamProgress === idx + 1 && isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                    ) : (
                      <span className="h-6 w-6 flex items-center justify-center text-gray-700">{idx + 1}.</span>
                    )}
                    {step.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Results Section */}
        {streamingUrl && (
          <section className="bg-white/5 backdrop-blur-lg border border-gray-700 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">GENERATED STREAM URL</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Input
                type="text"
                value={streamingUrl}
                readOnly
                className="flex-1 bg-gray-900 border border-gray-700 text-white focus:ring-0 focus:border-gray-700 cursor-text font-mono"
                aria-label="Generated streaming URL"
              />
            </div>
            {/* Centered VLC button for mobile, copy button for desktop */}
            <StreamActions streamUrl={streamingUrl} onCopy={handleCopyUrl} isCopied={isCopied} />
            <div className="flex flex-col items-center justify-center gap-4 mt-6">
              <div className="w-full text-center">
                <p className="text-gray-400 mb-2 font-semibold">How to use:</p>
                <ol className="list-decimal list-inside text-gray-400 text-left max-w-xl mx-auto space-y-1">
                  <li>Copy the above link.</li>
                  <li>Paste it directly into your video player (VLC, Outplayer, etc.).</li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {/* Instructions Panel */}
        <Collapsible
          open={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
          className="bg-white/5 backdrop-blur-lg border border-gray-700 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] p-6 md:p-8"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-200 hover:bg-white/10 transition-colors duration-300"
              aria-expanded={isInstructionsOpen}
              aria-controls="instructions-content"
            >
              OPERATION MANUAL
              {isInstructionsOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-300" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-300" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent id="instructions-content" className="mt-4 space-y-4 text-gray-500">
            <p>FOLLOW THESE STEPS TO INITIATE STREAM:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>OBTAIN MAGNET LINK:</strong> ACQUIRE A MAGNET LINK FROM YOUR PREFERRED TORRENT SOURCE, E.G.,
                STREMIO WITH TORRENTIO ADDON.
              </li>
              <li>
                <strong>INPUT & STREAM:</strong> PASTE THE MAGNET LINK INTO THE INPUT FIELD ABOVE AND ACTIVATE "START
                STREAMING".
              </li>
              <li>
                <strong>RETRIEVE URL:</strong> UPON STREAM READINESS, COPY THE GENERATED STREAMING URL.
              </li>
              <li>
                <strong>PLAYER INTEGRATION:</strong> PASTE THE URL INTO YOUR PREFERRED VIDEO PLAYER.
              </li>
            </ol>
            <p>
              <strong>RECOMMENDED APPLICATIONS:</strong> OUTPLAYER (IOS), VLC (ALL PLATFORMS), MX PLAYER (ANDROID).
            </p>
          </CollapsibleContent>
        </Collapsible>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-700 text-sm">
        <p>&copy; {new Date().getFullYear()} STREAMFLIX. ALL RIGHTS RESERVED.</p>
        <p className="mt-1">
          <a href="#" className="hover:text-gray-400 transition-colors duration-300">
            HOW IT WORKS
          </a>{" "}
          |{" "}
          <a href="#" className="hover:text-gray-400 transition-colors duration-300">
            FAQ
          </a>
        </p>
      </footer>
    </div>
  )
}
