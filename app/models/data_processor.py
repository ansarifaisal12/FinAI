import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Union
from fastapi import UploadFile
import pathlib
import matplotlib.pyplot as plt
import io
import base64
from datetime import datetime, timedelta

class DataProcessor:
    """
    Processes and manages financial data for the AI agent
    """
    def __init__(self):
        # Directory for storing data files
        self.data_dir = pathlib.Path("app/data")
        self.data_dir.mkdir(exist_ok=True, parents=True)
        
        # Types of data we can handle
        self.data_types = {
            "financial_statements": ["csv", "xlsx", "json"],
            "market_data": ["csv", "json"],
            "economic_indicators": ["csv", "json"],
            "company_reports": ["pdf", "txt"],
            "custom_data": ["csv", "xlsx", "json"]
        }
        
        # Sample data for demos (if no real data is uploaded)
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """Initialize sample financial data for demonstration purposes"""
        # Create sample data directory
        sample_dir = self.data_dir / "sample"
        sample_dir.mkdir(exist_ok=True)
        
        # Sample financial metrics
        sample_metrics = {
            "quarterly_revenue": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [1250000, 1320000, 1450000, 1550000, 1650000]
            },
            "profit_margin": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [0.15, 0.16, 0.17, 0.18, 0.19]
            },
            "cash_flow": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [350000, 380000, 410000, 450000, 470000]
            },
            "debt_to_equity": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [0.45, 0.43, 0.41, 0.39, 0.37]
            },
            "market_share": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [0.12, 0.14, 0.15, 0.16, 0.17]
            }
        }
        
        # Save sample data
        with open(sample_dir / "financial_metrics.json", "w") as f:
            json.dump(sample_metrics, f, indent=2)
        
        # Sample stock prices (daily for 180 days)
        today = datetime.now()
        dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(180, 0, -1)]
        
        # Generate realistic-looking stock data with some volatility
        base_price = 150.0
        volatility = 0.015
        trend = 0.0003
        stock_prices = []
        
        price = base_price
        for i in range(len(dates)):
            change = np.random.normal(trend, volatility)
            price *= (1 + change)
            stock_prices.append(round(price, 2))
        
        # Create dataframe and save as CSV
        stock_df = pd.DataFrame({
            "Date": dates,
            "Price": stock_prices,
            "Volume": np.random.randint(100000, 1000000, len(dates))
        })
        stock_df.to_csv(sample_dir / "stock_prices.csv", index=False)
        
        # Sample economic indicators
        indicators = {
            "GDP_Growth": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [2.1, 2.3, 2.5, 2.4, 2.6]
            },
            "Inflation_Rate": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [3.5, 3.7, 3.9, 3.8, 3.6]
            },
            "Unemployment_Rate": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [4.2, 4.1, 4.0, 3.9, 3.8]
            },
            "Interest_Rate": {
                "dates": ["2023-Q1", "2023-Q2", "2023-Q3", "2023-Q4", "2024-Q1"],
                "values": [4.5, 4.75, 5.0, 5.0, 4.75]
            }
        }
        
        # Save indicators
        with open(sample_dir / "economic_indicators.json", "w") as f:
            json.dump(indicators, f, indent=2)
    
    async def process_uploaded_file(self, file: UploadFile, data_type: str) -> Dict[str, str]:
        """Process and save uploaded financial data files"""
        # Validate data type
        if data_type not in self.data_types:
            raise ValueError(f"Invalid data type. Supported types: {list(self.data_types.keys())}")
        
        # Create directory for this data type if it doesn't exist
        data_type_dir = self.data_dir / data_type
        data_type_dir.mkdir(exist_ok=True)
        
        # Get file extension
        filename = file.filename
        extension = filename.split(".")[-1].lower()
        
        # Validate file extension for this data type
        if extension not in self.data_types[data_type]:
            raise ValueError(f"Invalid file format for {data_type}. Supported formats: {self.data_types[data_type]}")
        
        # Save file
        file_path = data_type_dir / filename
        contents = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Process file based on type
        if extension == "csv":
            df = pd.read_csv(file_path)
            # Additional processing can be done here
        elif extension == "xlsx":
            df = pd.read_excel(file_path)
            # Additional processing can be done here
        elif extension == "json":
            with open(file_path, "r") as f:
                data = json.load(f)
            # Additional processing can be done here
        
        return {"filename": filename, "path": str(file_path)}
    
    async def list_data_sources(self) -> List[Dict[str, Any]]:
        """List all available data sources"""
        sources = []
        
        # Check all data type directories
        for data_type in self.data_types:
            data_type_dir = self.data_dir / data_type
            if data_type_dir.exists():
                for file_path in data_type_dir.glob("*"):
                    if file_path.is_file():
                        sources.append({
                            "name": file_path.name,
                            "type": data_type,
                            "path": str(file_path),
                            "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                        })
        
        # Include sample data
        sample_dir = self.data_dir / "sample"
        if sample_dir.exists():
            for file_path in sample_dir.glob("*"):
                if file_path.is_file():
                    sources.append({
                        "name": file_path.name,
                        "type": "sample",
                        "path": str(file_path),
                        "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                    })
        
        return sources
    
    async def get_data(self, data_source: str) -> Dict[str, Any]:
        """Get data from a specific data source"""
        file_path = pathlib.Path(data_source)
        
        if not file_path.exists():
            # Check if it's a relative path
            alt_path = self.data_dir / data_source
            if alt_path.exists():
                file_path = alt_path
            else:
                raise FileNotFoundError(f"Data source not found: {data_source}")
        
        # Load data based on file extension
        extension = file_path.suffix.lower()[1:]  # Remove the dot
        
        if extension == "csv":
            df = pd.read_csv(file_path)
            return {"data": df.to_dict(orient="records")}
        elif extension == "xlsx":
            df = pd.read_excel(file_path)
            return {"data": df.to_dict(orient="records")}
        elif extension == "json":
            with open(file_path, "r") as f:
                data = json.load(f)
            return {"data": data}
        else:
            # For other file types, return basic info
            return {
                "file": str(file_path),
                "size": file_path.stat().st_size,
                "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            }
    
    async def get_chart_data(self, metric: str, time_period: Optional[str] = None) -> Dict[str, Any]:
        """Get data for a specific chart metric"""
        # For demo purposes, we'll use sample data
        sample_file = self.data_dir / "sample" / "financial_metrics.json"
        
        if sample_file.exists():
            with open(sample_file, "r") as f:
                all_metrics = json.load(f)
            
            # Check if the requested metric exists
            if metric in all_metrics:
                metric_data = all_metrics[metric]
                
                # Filter by time period if specified
                if time_period:
                    # Simple filtering logic (can be enhanced)
                    filtered_data = {"dates": [], "values": []}
                    for i, date in enumerate(metric_data["dates"]):
                        if time_period in date:  # Simple contains check
                            filtered_data["dates"].append(date)
                            filtered_data["values"].append(metric_data["values"][i])
                    
                    return {
                        "metric": metric,
                        "time_period": time_period,
                        "data": filtered_data
                    }
                
                return {
                    "metric": metric,
                    "data": metric_data
                }
            
            # If metric not found, check economic indicators
            econ_file = self.data_dir / "sample" / "economic_indicators.json"
            if econ_file.exists():
                with open(econ_file, "r") as f:
                    indicators = json.load(f)
                
                if metric in indicators:
                    return {
                        "metric": metric,
                        "data": indicators[metric]
                    }
        
        # If we get here, try to generate a chart from stock data
        if metric.lower() == "stock_price":
            stock_file = self.data_dir / "sample" / "stock_prices.csv"
            if stock_file.exists():
                df = pd.read_csv(stock_file)
                
                # Filter by time period if needed
                if time_period:
                    df = df[df["Date"].str.contains(time_period)]
                
                return {
                    "metric": "Stock Price",
                    "data": {
                        "dates": df["Date"].tolist(),
                        "values": df["Price"].tolist()
                    }
                }
        
        # Default response if metric not found
        return {
            "metric": metric,
            "error": "Metric not found",
            "available_metrics": list(all_metrics.keys()) if 'all_metrics' in locals() else []
        }
    
    async def generate_chart_image(self, metric: str, chart_type: str = "line") -> Dict[str, Any]:
        """Generate a chart image for a specific metric"""
        # Get the data for the metric
        data = await self.get_chart_data(metric)
        
        if "error" in data:
            return data
        
        # Extract the data
        dates = data["data"]["dates"]
        values = data["data"]["values"]
        
        # Create a figure
        plt.figure(figsize=(10, 6))
        
        if chart_type == "line":
            plt.plot(dates, values, marker='o', linestyle='-')
        elif chart_type == "bar":
            plt.bar(dates, values)
        else:
            return {"error": f"Unsupported chart type: {chart_type}"}
        
        plt.title(f"{metric} Over Time")
        plt.xlabel("Date")
        plt.ylabel(metric.replace("_", " ").title())
        plt.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Save to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        
        # Encode as base64
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        
        return {
            "metric": metric,
            "chart_type": chart_type,
            "image": f"data:image/png;base64,{img_str}"
        } 