import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const weatherSchema = new Schema(
  {
    location: { type: String, required: true },
    date: { type: String, required: true },
    currentTemperature: { type: Number, required: true },
    weatherDescription: { type: String, required: true },
    maxTemperature: { type: Number, required: true },
    minTemperature: { type: Number, required: true },
    precipitationProbability: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    source: { type: String, required: true },
  },
  { _id: false },
);

const stockSchema = new Schema(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    volume: { type: Number, required: true },
    source: { type: String, required: true },
  },
  { _id: false },
);

const newsItemSchema = new Schema(
  {
    title: { type: String, required: true },
    link: { type: String, required: true },
    publishedAt: { type: String, default: "" },
    summary: { type: String, default: "" },
    relatedSymbol: { type: String, default: "" },
    relatedName: { type: String, default: "" },
  },
  { _id: false },
);

const briefingSummarySchema = new Schema(
  {
    weatherSummary: { type: String, required: true },
    stockSummary: { type: String, required: true },
    newsSummary: { type: String, required: true },
    encouragement: { type: String, required: true },
  },
  { _id: false },
);

const briefingLogSchema = new Schema(
  {
    // 這份簡報資料產生的時間（來自 buildBriefingPayload）
    generatedAt: { type: Date, required: true },
    weather: { type: weatherSchema, required: true },
    stock: { type: stockSchema, required: true },
    news: { type: [newsItemSchema], default: [] },
    briefing: { type: briefingSummarySchema, required: true },
    // 寄信相關中繼資料
    from: { type: String, required: true },
    to: { type: String, required: true },
    resendEmailId: { type: String, default: "" },
  },
  { timestamps: true },
);

export type BriefingLogDocument = InferSchemaType<typeof briefingLogSchema>;

export const BriefingLog: Model<BriefingLogDocument> =
  (mongoose.models.BriefingLog as Model<BriefingLogDocument>) ||
  mongoose.model<BriefingLogDocument>("BriefingLog", briefingLogSchema);
