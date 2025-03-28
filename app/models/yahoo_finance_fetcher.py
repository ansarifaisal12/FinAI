import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
import pathlib
from typing import Dict, List, Any, Optional, Union, Tuple

class YahooFinanceFetcher:
    """
    Fetches and processes financial data from Yahoo Finance
    """
    def __init__(self, data_dir: str = "app/data/market_data"):
        self.data_dir = pathlib.Path(data_dir)
        self.data_dir.mkdir(exist_ok=True, parents=True)
        
        # Default tickers to track (can be customized)
        self.default_tickers = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA", "JPM", "V", "WMT"]
        
        # Stock indices
        self.indices = {
            "S&P 500": "^GSPC",
            "Dow Jones": "^DJI",
            "NASDAQ": "^IXIC",
            "Russell 2000": "^RUT"
        }
        
        # Sectors and their ETFs
        self.sectors = {
            "Technology": "XLK",
            "Healthcare": "XLV",
            "Financials": "XLF",
            "Consumer Discretionary": "XLY",
            "Energy": "XLE",
            "Utilities": "XLU",
            "Real Estate": "XLRE",
            "Materials": "XLB",
            "Industrials": "XLI",
            "Consumer Staples": "XLP"
        }
        
        # Cache to store fetched data for performance
        self.cache = {}
        
    async def fetch_stock_data(self, ticker: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        """
        Fetch historical stock data for a specific ticker
        
        Args:
            ticker: Stock symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            
        Returns:
            DataFrame with historical stock data
        """
        cache_key = f"{ticker}_{period}_{interval}"
        
        # Check if data exists in cache
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Check if data exists on disk
        file_path = self.data_dir / f"{cache_key}.csv"
        
        if file_path.exists():
            # Check if file is newer than 24 hours
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            if datetime.now() - file_time < timedelta(hours=24):
                df = pd.read_csv(file_path, index_col=0, parse_dates=True)
                self.cache[cache_key] = df
                return df
        
        # Fetch new data from Yahoo Finance
        try:
            ticker_data = yf.Ticker(ticker)
            df = ticker_data.history(period=period, interval=interval)
            
            # Save to disk for future use
            df.to_csv(file_path)
            
            # Store in cache
            self.cache[cache_key] = df
            
            return df
        except Exception as e:
            print(f"Error fetching data for {ticker}: {e}")
            # Return empty DataFrame if fetch fails
            return pd.DataFrame()
    
    async def fetch_company_info(self, ticker: str) -> Dict[str, Any]:
        """
        Fetch company information for a specific ticker
        
        Args:
            ticker: Stock symbol
            
        Returns:
            Dictionary containing company information
        """
        cache_key = f"{ticker}_info"
        
        # Check if data exists in cache
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Check if data exists on disk
        file_path = self.data_dir / f"{cache_key}.json"
        
        if file_path.exists():
            # Check if file is newer than 24 hours
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            if datetime.now() - file_time < timedelta(hours=24):
                with open(file_path, 'r') as f:
                    info = json.load(f)
                    self.cache[cache_key] = info
                    return info
        
        # Fetch new data from Yahoo Finance
        try:
            ticker_data = yf.Ticker(ticker)
            info = ticker_data.info
            
            # Convert dates to strings to ensure JSON serialization
            for key, value in info.items():
                if isinstance(value, (datetime, pd.Timestamp)):
                    info[key] = value.isoformat()
            
            # Save to disk for future use
            with open(file_path, 'w') as f:
                json.dump(info, f)
            
            # Store in cache
            self.cache[cache_key] = info
            
            return info
        except Exception as e:
            print(f"Error fetching info for {ticker}: {e}")
            return {}
    
    async def fetch_financials(self, ticker: str, statement_type: str = "income") -> Dict[str, Any]:
        """
        Fetch financial statements for a specific ticker
        
        Args:
            ticker: Stock symbol
            statement_type: Type of financial statement ("income", "balance", "cash")
            
        Returns:
            Dictionary containing financial statement data
        """
        cache_key = f"{ticker}_{statement_type}"
        
        # Check if data exists in cache
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Check if data exists on disk
        file_path = self.data_dir / f"{cache_key}.json"
        
        if file_path.exists():
            # Check if file is newer than 24 hours
            file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            if datetime.now() - file_time < timedelta(days=7):  # Financial statements change less frequently
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    self.cache[cache_key] = data
                    return data
        
        # Fetch new data from Yahoo Finance
        try:
            ticker_data = yf.Ticker(ticker)
            
            if statement_type == "income":
                data = ticker_data.income_stmt
            elif statement_type == "balance":
                data = ticker_data.balance_sheet
            elif statement_type == "cash":
                data = ticker_data.cashflow
            else:
                data = pd.DataFrame()
            
            # Convert DataFrame to dict for JSON serialization
            result = {}
            if not data.empty:
                # Convert column names (dates) to strings
                data.columns = data.columns.astype(str)
                
                # Convert to dictionary
                result = data.to_dict()
                
                # Save to disk for future use
                with open(file_path, 'w') as f:
                    json.dump(result, f)
                
                # Store in cache
                self.cache[cache_key] = result
            
            return result
        except Exception as e:
            print(f"Error fetching {statement_type} statement for {ticker}: {e}")
            return {}
    
    async def fetch_market_indices(self, period: str = "1y", interval: str = "1d") -> Dict[str, pd.DataFrame]:
        """
        Fetch data for major market indices
        
        Returns:
            Dictionary of DataFrames with index data
        """
        result = {}
        
        for name, ticker in self.indices.items():
            df = await self.fetch_stock_data(ticker, period, interval)
            if not df.empty:
                result[name] = df
        
        return result
    
    async def fetch_sector_performance(self, period: str = "1y") -> Dict[str, float]:
        """
        Fetch performance data for different market sectors
        
        Returns:
            Dictionary of sector performances (percentage change)
        """
        result = {}
        
        for sector, ticker in self.sectors.items():
            df = await self.fetch_stock_data(ticker, period)
            if not df.empty:
                # Calculate percentage change
                start_price = df["Close"].iloc[0]
                end_price = df["Close"].iloc[-1]
                pct_change = ((end_price - start_price) / start_price) * 100
                result[sector] = round(pct_change, 2)
        
        return result
    
    async def fetch_company_comparison(self, tickers: List[str], metrics: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Compare multiple companies across selected metrics
        
        Args:
            tickers: List of stock symbols
            metrics: List of metrics to compare
            
        Returns:
            Dictionary with comparison data
        """
        result = {}
        
        for ticker in tickers:
            result[ticker] = {}
            
            # Fetch company info
            info = await self.fetch_company_info(ticker)
            
            # Extract requested metrics
            for metric in metrics:
                if metric in info:
                    result[ticker][metric] = info[metric]
                else:
                    result[ticker][metric] = None
            
            # Add stock performance
            df = await self.fetch_stock_data(ticker, "1y")
            if not df.empty:
                start_price = df["Close"].iloc[0]
                current_price = df["Close"].iloc[-1]
                pct_change = ((current_price - start_price) / start_price) * 100
                result[ticker]["yearly_performance"] = round(pct_change, 2)
                result[ticker]["current_price"] = round(current_price, 2)
        
        return result
    
    async def calculate_technical_indicators(self, ticker: str, period: str = "1y") -> Dict[str, Any]:
        """
        Calculate common technical indicators for a stock
        
        Args:
            ticker: Stock symbol
            period: Time period
            
        Returns:
            Dictionary of technical indicators
        """
        df = await self.fetch_stock_data(ticker, period)
        if df.empty:
            return {}
        
        result = {}
        
        # Moving Averages
        df["SMA_50"] = df["Close"].rolling(window=50).mean()
        df["SMA_200"] = df["Close"].rolling(window=200).mean()
        
        # Relative Strength Index (RSI)
        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0).rolling(window=14).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
        rs = gain / loss
        df["RSI"] = 100 - (100 / (1 + rs))
        
        # MACD
        df["EMA_12"] = df["Close"].ewm(span=12, adjust=False).mean()
        df["EMA_26"] = df["Close"].ewm(span=26, adjust=False).mean()
        df["MACD"] = df["EMA_12"] - df["EMA_26"]
        df["Signal_Line"] = df["MACD"].ewm(span=9, adjust=False).mean()
        
        # Bollinger Bands
        df["BB_Middle"] = df["Close"].rolling(window=20).mean()
        std_dev = df["Close"].rolling(window=20).std()
        df["BB_Upper"] = df["BB_Middle"] + (std_dev * 2)
        df["BB_Lower"] = df["BB_Middle"] - (std_dev * 2)
        
        # Get last values for our indicators
        last_row = df.iloc[-1]
        
        result = {
            "price": round(last_row["Close"], 2),
            "SMA_50": round(last_row["SMA_50"], 2) if not pd.isna(last_row["SMA_50"]) else None,
            "SMA_200": round(last_row["SMA_200"], 2) if not pd.isna(last_row["SMA_200"]) else None,
            "RSI": round(last_row["RSI"], 2) if not pd.isna(last_row["RSI"]) else None,
            "MACD": round(last_row["MACD"], 2) if not pd.isna(last_row["MACD"]) else None,
            "Signal_Line": round(last_row["Signal_Line"], 2) if not pd.isna(last_row["Signal_Line"]) else None,
            "BB_Upper": round(last_row["BB_Upper"], 2) if not pd.isna(last_row["BB_Upper"]) else None,
            "BB_Middle": round(last_row["BB_Middle"], 2) if not pd.isna(last_row["BB_Middle"]) else None,
            "BB_Lower": round(last_row["BB_Lower"], 2) if not pd.isna(last_row["BB_Lower"]) else None,
        }
        
        # Add signals based on indicators
        result["signals"] = {
            "trend": "bullish" if result["SMA_50"] > result["SMA_200"] else "bearish",
            "overbought_oversold": "overbought" if result["RSI"] > 70 else "oversold" if result["RSI"] < 30 else "neutral",
            "MACD": "bullish" if result["MACD"] > result["Signal_Line"] else "bearish",
            "bollinger": "upper_band" if last_row["Close"] > result["BB_Upper"] else "lower_band" if last_row["Close"] < result["BB_Lower"] else "middle"
        }
        
        return result
        
    async def stock_screening(self, criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Screen stocks based on various criteria
        
        Args:
            criteria: Dictionary of screening criteria
            
        Returns:
            List of stocks that match the criteria
        """
        results = []
        
        # Use default tickers if none specified
        tickers = criteria.get("tickers", self.default_tickers)
        
        for ticker in tickers:
            try:
                # Fetch basic info
                info = await self.fetch_company_info(ticker)
                
                if not info:
                    continue
                
                # Fetch price data
                price_data = await self.fetch_stock_data(ticker, "1y")
                
                if price_data.empty:
                    continue
                
                # Check if the stock matches all criteria
                match = True
                
                # Market cap screening
                if "min_market_cap" in criteria and info.get("marketCap") is not None:
                    if info["marketCap"] < criteria["min_market_cap"]:
                        match = False
                
                if "max_market_cap" in criteria and info.get("marketCap") is not None:
                    if info["marketCap"] > criteria["max_market_cap"]:
                        match = False
                
                # P/E ratio screening
                if "min_pe_ratio" in criteria and info.get("trailingPE") is not None:
                    if info["trailingPE"] < criteria["min_pe_ratio"]:
                        match = False
                
                if "max_pe_ratio" in criteria and info.get("trailingPE") is not None:
                    if info["trailingPE"] > criteria["max_pe_ratio"]:
                        match = False
                
                # Dividend yield screening
                if "min_dividend_yield" in criteria and info.get("dividendYield") is not None:
                    if info["dividendYield"] < criteria["min_dividend_yield"]:
                        match = False
                
                # Performance screening
                if "min_performance" in criteria:
                    start_price = price_data["Close"].iloc[0]
                    current_price = price_data["Close"].iloc[-1]
                    performance = ((current_price - start_price) / start_price) * 100
                    
                    if performance < criteria["min_performance"]:
                        match = False
                
                # If all criteria are matched, add to results
                if match:
                    # Calculate some key metrics
                    start_price = price_data["Close"].iloc[0]
                    current_price = price_data["Close"].iloc[-1]
                    performance = ((current_price - start_price) / start_price) * 100
                    
                    results.append({
                        "ticker": ticker,
                        "name": info.get("shortName", ticker),
                        "sector": info.get("sector", "N/A"),
                        "market_cap": info.get("marketCap", None),
                        "pe_ratio": info.get("trailingPE", None),
                        "dividend_yield": info.get("dividendYield", None) * 100 if info.get("dividendYield") is not None else None,
                        "current_price": current_price,
                        "yearly_performance": round(performance, 2)
                    })
            
            except Exception as e:
                print(f"Error screening {ticker}: {e}")
                continue
        
        return results 