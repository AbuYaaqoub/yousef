# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SallaHunter Pro is a lead intelligence system that scrapes and extracts contact information from Salla e-commerce stores. It features two scraping modes:
- **Google Search mode**: Uses Serper.dev API to find Salla stores, then extracts contact data from homepages
- **Mahally mode**: Scrapes mahally.com product pages to discover stores, with optional deep enrichment

## Tech Stack

- **Framework**: Next.js 14.0.4 (App Router)
- **Language**: TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.19
- **Scraping**: Playwright (Mahally), Cheerio + Axios (homepage extraction)
- **Search**: Serper.dev API (Google Custom Search alternative)
- **Export**: ExcelJS, XLSX

## Commands

```bash
npm run dev    # Start development server (localhost:3000)
npm run build  # Build for production
npm run start  # Start production server
```

## Environment Variables

Required environment variables in `.env`:

```bash
# Serper.dev API (Google Search)
SERPER_API_KEY=your_api_key

# Google Sheets (optional - for auto-saving leads)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@...iam.gserviceaccount.com
SPREADSHEET_ID=your_spreadsheet_id
```

## Architecture

### Directory Structure
- `app/` - Next.js App Router pages and API routes
- `lib/` - Core business logic
- `types/` - TypeScript type definitions

### API Routes
- `POST /api/scrape` - Main scraping endpoint (Google Search + homepage extraction)
- `POST /api/mahally` - Scrape mahally.com for stores by product name
- `POST /api/mahally/enrich` - Deep enrichment: find official websites for Mahally stores
- `GET /api/mahally/sheets` - List available sheets in Mahally_Leads.xlsx
- `GET /api/export` - Export results as Excel file

### Core Libraries
- `lib/scraper/googleSearch.ts` - Serper.dev API integration for finding Salla stores
- `lib/scraper/extractStoreInfo.ts` - Cheerio-based homepage data extraction (email, phone, social links)
- `lib/scraper/mahallyScraper.ts` - Playwright-based mahally.com scraper
- `lib/scraper/mahallyEnricher.ts` - Combines search + extraction for Mahally stores
- `lib/leadScoring.ts` - Calculates lead quality rating (strong/medium/weak)
- `lib/excel/mahallyExcel.ts` - Saves Mahally results to Excel workbook
- `lib/export/excel.ts` - Exports leads to Excel buffer
- `lib/sheets/googleSheets.ts` - Optional Google Sheets integration

### Data Flow

1. **Google Search Flow**: User clicks Start → Serper.dev search → Extract homepage data → Score leads → Save to Google Sheets
2. **Mahally Flow**: User enters product name → Scrape mahally.com → Save to Mahally_Leads.xlsx → (optional) Enrich with official website data → Save to Final_Stores_Data.xlsx

### Key Files
- `Mahally_Leads.xlsx` - Input workbook with scraped Mahally stores (categorized by product)
- `Final_Stores_Data.xlsx` - Output workbook with enriched store data (contact info, social links)

## Development Notes

- Playwright runs headless Chromium for JavaScript-heavy sites (mahally.com)
- Cheerio handles static homepage scraping (faster, no browser overhead)
- Concurrency limit of 3 requests with random delays to avoid rate limiting
- Lead scoring: 3+ contact points = strong, 1-2 = medium, 0 = weak (filtered out)
- Excel files must be closed during writes (EBUSY error handling in place)
