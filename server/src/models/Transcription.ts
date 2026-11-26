import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment {
  text: string;
  startTime?: number;
  endTime?: number;
  language?: string;
}

export interface ITranscription extends Document {
  title: string;
  transcript: string;
  language: string;
  duration: number; // seconds
  wordCount: number;
  segments: ISegment[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    text: { type: String, required: true },
    startTime: { type: Number },
    endTime: { type: Number },
    language: { type: String },
  },
  { _id: false },
);

const TranscriptionSchema = new Schema<ITranscription>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
      default: function () {
        const now = new Date();
        return `Transcription – ${now.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}, ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
      },
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100000,
    },
    language: {
      type: String,
      default: 'none', // 'none' disables language-specific text processing in MongoDB
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    segments: {
      type: [SegmentSchema],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compute wordCount before saving
TranscriptionSchema.pre('save', function (next) {
  if (this.isModified('transcript')) {
    this.wordCount = this.transcript.trim().split(/\s+/).filter(Boolean).length;
  }
  next();
});

// Text index for search
TranscriptionSchema.index({ title: 'text', transcript: 'text' });
TranscriptionSchema.index({ createdAt: -1 });

export const Transcription = mongoose.model<ITranscription>('Transcription', TranscriptionSchema);
