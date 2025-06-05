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