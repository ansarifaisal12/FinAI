from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import json
import pathlib

# Import from our local modules
from app.models.ai_agent import FinancialAIAgent
from app.models.data_processor import DataProcessor
from app.models.yahoo_finance_fetcher import YahooFinanceFetcher

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Financial Report AI Agent API",
    description="API for generating financial reports and insights using Groq's LLM API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize our models
ai_agent = FinancialAIAgent()
data_processor = DataProcessor()
yahoo_finance = YahooFinanceFetcher()

# Define request/response models
class QueryRequest(BaseModel):
    query: str
    additional_context: Optional[Dict[str, Any]] = None

class ReportRequest(BaseModel):
    query: str
    data_sources: Optional[List[str]] = None
    time_period: Optional[str] = None
    report_type: Optional[str] = None
    additional_params: Optional[Dict[str, Any]] = None

class UploadResponse(BaseModel):
    filename: str
    status: str
    message: str

class StockDataRequest(BaseModel):
    ticker: str
    period: Optional[str] = "1y"
    interval: Optional[str] = "1d"

class CompanyInfoRequest(BaseModel):
    ticker: str

class FinancialsRequest(BaseModel):
    ticker: str
    statement_type: Optional[str] = "income"

class CompanyComparisonRequest(BaseModel):
    tickers: List[str]
    metrics: List[str]

class TechnicalIndicatorsRequest(BaseModel):
    ticker: str
    period: Optional[str] = "1y"

class StockScreeningRequest(BaseModel):
    tickers: Optional[List[str]] = None
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_pe_ratio: Optional[float] = None
    max_pe_ratio: Optional[float] = None
    min_dividend_yield: Optional[float] = None
    min_performance: Optional[float] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Query endpoint
@app.post("/query")
async def process_query(request: QueryRequest):
    try:
        response = await ai_agent.process_query(
            query=request.query,
            additional_context=request.additional_context
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Generate report endpoint
@app.post("/generate-report")
async def generate_report(request: ReportRequest):
    try:
        report = await ai_agent.generate_report(
            query=request.query,
            data_sources=request.data_sources,
            time_period=request.time_period,
            report_type=request.report_type,
            additional_params=request.additional_params
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Data upload endpoint
@app.post("/upload-data", response_model=UploadResponse)
async def upload_data(file: UploadFile = File(...), data_type: str = Form(...)):
    try:
        # Process and save the uploaded file
        result = await data_processor.process_uploaded_file(file, data_type)
        return UploadResponse(
            filename=result["filename"],
            status="success",
            message=f"Successfully processed {result['filename']}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get available data sources
@app.get("/data-sources")
async def get_data_sources():
    try:
        sources = await data_processor.list_data_sources()
        return {"data_sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get chart data for a specific metric
@app.get("/chart-data/{metric}")
async def get_chart_data(metric: str, time_period: Optional[str] = None):
    try:
        data = await data_processor.get_chart_data(metric, time_period)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Yahoo Finance Endpoints

# Get stock data
@app.post("/stock-data")
async def get_stock_data(request: StockDataRequest):
    try:
        df = await yahoo_finance.fetch_stock_data(
            ticker=request.ticker,
            period=request.period,
            interval=request.interval
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for ticker {request.ticker}")
        
        # Convert DataFrame to dict
        result = {
            "ticker": request.ticker,
            "period": request.period,
            "interval": request.interval,
            "data": {
                "dates": df.index.astype(str).tolist(),
                "open": df["Open"].tolist(),
                "high": df["High"].tolist(),
                "low": df["Low"].tolist(),
                "close": df["Close"].tolist(),
                "volume": df["Volume"].tolist()
            }
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get company information
@app.post("/company-info")
async def get_company_info(request: CompanyInfoRequest):
    try:
        info = await yahoo_finance.fetch_company_info(request.ticker)
        
        if not info:
            raise HTTPException(status_code=404, detail=f"No information found for company {request.ticker}")
        
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get financial statements
@app.post("/financials")
async def get_financials(request: FinancialsRequest):
    try:
        data = await yahoo_finance.fetch_financials(
            ticker=request.ticker,
            statement_type=request.statement_type
        )
        
        if not data:
            raise HTTPException(status_code=404, detail=f"No {request.statement_type} statement found for {request.ticker}")
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get market indices
@app.get("/market-indices")
async def get_market_indices(period: str = "1y", interval: str = "1d"):
    try:
        indices = await yahoo_finance.fetch_market_indices(period, interval)
        
        if not indices:
            raise HTTPException(status_code=404, detail="No market indices data found")
        
        # Convert DataFrames to a serializable format
        result = {}
        for name, df in indices.items():
            result[name] = {
                "dates": df.index.astype(str).tolist(),
                "close": df["Close"].tolist()
            }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get sector performance
@app.get("/sector-performance")
async def get_sector_performance(period: str = "1y"):
    try:
        performance = await yahoo_finance.fetch_sector_performance(period)
        
        if not performance:
            raise HTTPException(status_code=404, detail="No sector performance data found")
        
        return {"period": period, "sectors": performance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Compare companies
@app.post("/company-comparison")
async def compare_companies(request: CompanyComparisonRequest):
    try:
        comparison = await yahoo_finance.fetch_company_comparison(
            tickers=request.tickers,
            metrics=request.metrics
        )
        
        if not comparison:
            raise HTTPException(status_code=404, detail="No comparison data found")
        
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get technical indicators
@app.post("/technical-indicators")
async def get_technical_indicators(request: TechnicalIndicatorsRequest):
    try:
        indicators = await yahoo_finance.calculate_technical_indicators(
            ticker=request.ticker,
            period=request.period
        )
        
        if not indicators:
            raise HTTPException(status_code=404, detail=f"No data found for ticker {request.ticker}")
        
        return {"ticker": request.ticker, "period": request.period, "indicators": indicators}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Screen stocks
@app.post("/stock-screening")
async def screen_stocks(request: StockScreeningRequest):
    try:
        criteria = {
            "tickers": request.tickers,
            "min_market_cap": request.min_market_cap,
            "max_market_cap": request.max_market_cap,
            "min_pe_ratio": request.min_pe_ratio,
            "max_pe_ratio": request.max_pe_ratio,
            "min_dividend_yield": request.min_dividend_yield,
            "min_performance": request.min_performance
        }
        
        # Remove None values
        criteria = {k: v for k, v in criteria.items() if v is not None}
        
        results = await yahoo_finance.stock_screening(criteria)
        
        return {"criteria": criteria, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Stock-specific financial query
@app.post("/stock-query")
async def stock_query(request: QueryRequest):
    try:
        # Check if the query contains stock tickers
        query = request.query.upper()
        additional_context = request.additional_context or {}
        
        # Try to identify stock tickers in the query
        # This is a simple approach - in a full app, you'd use NLP for entity extraction
        potential_tickers = [word for word in query.split() if word.isalpha() and len(word) <= 5 and word not in ["AND", "OR", "THE", "FOR", "WITH"]]
        
        stock_data = {}
        
        # Fetch data for potential tickers
        for ticker in potential_tickers:
            try:
                # Basic company info
                info = await yahoo_finance.fetch_company_info(ticker)
                if info:
                    # If we found info, it's probably a valid ticker
                    stock_data[ticker] = {
                        "company_name": info.get("shortName", ticker),
                        "sector": info.get("sector", "Unknown"),
                        "industry": info.get("industry", "Unknown"),
                        "market_cap": info.get("marketCap", None),
                        "pe_ratio": info.get("trailingPE", None),
                    }
                    
                    # Add price data
                    df = await yahoo_finance.fetch_stock_data(ticker, "1y")
                    if not df.empty:
                        current_price = df["Close"].iloc[-1]
                        start_price = df["Close"].iloc[0]
                        pct_change = ((current_price - start_price) / start_price) * 100
                        
                        stock_data[ticker]["current_price"] = round(current_price, 2)
                        stock_data[ticker]["yearly_change_pct"] = round(pct_change, 2)
            except:
                # If error, not a valid ticker
                continue
        
        # Add the stock data to the context for the AI
        if stock_data:
            additional_context["stock_data"] = stock_data
            
            # Add a request for markdown formatting
            if 'query' in request.query.lower():
                original_query = request.query
                request.query = f"""
{original_query}

Please format your response using markdown with:
- Headers for sections
- **Bold** for important numbers/metrics
- Bullet points for lists
- Tables for comparing multiple values
- Use markdown formatting to make the response readable and professional
"""
        
        # Process the query with our AI agent
        response = await ai_agent.process_query(
            query=request.query,
            additional_context=additional_context
        )
        
        # Include the stock data in the response
        if stock_data:
            if isinstance(response, dict):
                response["stock_data"] = stock_data
            else:
                response = {"response": response, "stock_data": stock_data}
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 