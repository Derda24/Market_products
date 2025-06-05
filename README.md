<<<<<<< HEAD
# Barcelona Product Scraper

A Python script to enrich product data with nutritional information from OpenFoodFacts database.

## Features

- Scrapes nutritional information from OpenFoodFacts
- Fuzzy matching for better product identification
- Robust error handling and retry logic
- Progress saving for interrupted operations
- Rate limiting to respect API constraints

## Prerequisites

- Python 3.8+
- Supabase account and credentials
- Internet connection

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Barcelona_scraper.git
cd Barcelona_scraper
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the project root with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Usage

Run the script:
```bash
python enrich_products.py
```

The script will:
- Fetch products from your Supabase database
- Search for matches on OpenFoodFacts
- Update products with nutritional information
- Save progress in case of interruption

## Error Handling

- Connection errors are handled with exponential backoff
- Progress is automatically saved
- Failed searches are logged in `not_found.txt`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 8890b4c4d0599f0730cfde4924933630aff82ee3
