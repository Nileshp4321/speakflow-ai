import { useEffect, useRef } from 'react';
import { LiveTranscriptChunk } from '../types';

interface TranscriptDisplayProps {
  chunks: LiveTranscriptChunk[];
  className?: string;
}

export function TranscriptDisplay({ chunks, className = '' }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chunks]);

  if (chunks.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-3">🎤</div>
          <p className="text-slate-400 text-sm">
            Start recording to see your speech transcribed here in real time.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Supports English, Hindi, and Hinglish
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {chunks.map((chunk) => (
        <span
          key={chunk.id}
          className={`inline ${
            chunk.type === 'partial'
              ? 'text-slate-400 italic'
              : 'text-slate-100'
          } leading-relaxed text-base`}
        >
          {chunk.text}{' '}
        </span>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
