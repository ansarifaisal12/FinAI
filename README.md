# Financial Report Generator AI Agent

An agentic AI system that generates comprehensive financial reports and insights based on user queries. The application uses Groq's Llama-3 models for AI reasoning, LangChain for orchestration, Chart.js for visualizations, and FastAPI for the backend.

## Features

- **AI-Powered Financial Analysis**: Ask questions about financial data and get comprehensive insights
- **Automated Report Generation**: Create detailed financial reports with visualizations
- **Data Integration**: Upload and process different types of financial data
- **Interactive Dashboard**: Visualize financial metrics and trends with Chart.js
- **Modern Web Interface**: Responsive and intuitive user experience
- **Real-time Stock Data**: Fetch and analyze real-time stock data from Yahoo Finance
- **Stock Screening and Comparison**: Compare stocks and screen them based on various metrics
- **Technical Analysis**: Calculate and visualize technical indicators for stocks

## Technology Stack

- **Backend**: FastAPI
- **AI Model**: Groq's Llama-3 70B model
- **AI Framework**: LangChain
- **Data Processing**: Pandas, NumPy
- **Visualization**: Chart.js
- **Frontend**: React (with modern UI components)
- **Market Data**: Yahoo Finance API (via yfinance)

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+ (for frontend development)
- A Groq API key

### Installation

1. Clone the repository
```
git clone https://github.com/ansarifaisal12/FinAI.git
cd financial-report-ai
```

2. Set up the Python environment
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables
```
cp .env.example .env
```
Edit the `.env` file and add your Groq API key.

4. Run the application
```
python run.py
```

5. Access the API at `http://localhost:8000` and the frontend at `http://localhost:3000`

## Usage

### API Endpoints

#### Financial AI Endpoints
- **GET /health**: Check if the API is running
- **POST /query**: Ask a question about financial data
- **POST /generate-report**: Generate a comprehensive financial report
- **POST /upload-data**: Upload financial data files
- **GET /data-sources**: List available data sources
- **GET /chart-data/{metric}**: Get data for specific financial metrics

#### Yahoo Finance Endpoints
- **POST /stock-data**: Get historical stock price data
- **POST /company-info**: Get company information
- **POST /financials**: Get financial statements
- **GET /market-indices**: Get data for major market indices
- **GET /sector-performance**: Get performance data for market sectors
- **POST /company-comparison**: Compare multiple companies across metrics
- **POST /technical-indicators**: Get technical indicators for a stock
- **POST /stock-screening**: Screen stocks based on various criteria
- **POST /stock-query**: Ask an AI-powered question about stocks

### Example Queries

- "What was our quarterly revenue growth over the past year?"
- "Generate a financial performance report comparing Q1 2024 to Q1 2023"
- "Analyze our debt-to-equity ratio trend and provide recommendations"
- "What is the correlation between our marketing spend and revenue growth?"
- "Compare the P/E ratios of Apple, Microsoft, and Google"
- "What are the technical indicators suggesting for Tesla stock?"
- "Which technology stocks have the highest dividend yield?"
- "How has the S&P 500 performed compared to the NASDAQ over the past year?"

## Components

### Financial Dashboard
The main dashboard provides insights into your financial data, with visualizations for key metrics and the ability to generate AI-powered reports.

### Stock Market Dashboard
A comprehensive stock market dashboard with the following features:
- **Market Overview**: Current state of major market indices and sector performance
- **Stock Analysis**: Detailed analysis of individual stocks with price charts and key metrics
- **Stock Comparison**: Side-by-side comparison of multiple stocks
- **AI Insights**: Ask questions about stocks and get AI-powered answers

## Frontend Development

The frontend is a React application that communicates with the FastAPI backend.

1. Navigate to the frontend directory
```
cd app/frontend
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Groq API for providing the AI capabilities
- LangChain for the AI orchestration framework
- FastAPI team for the excellent API framework
- Chart.js for the visualization library
- Yahoo Finance for market data 
