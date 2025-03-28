import os
from typing import Dict, List, Optional, Any, Union
import json
from dotenv import load_dotenv
from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()

class FinancialAIAgent:
    """
    AI Agent for generating financial reports and insights using Groq
    """
    def __init__(self):
        self.model = ChatGroq(
            model="deepseek-r1-distill-llama-70b",  # Using Llama 3 70B model from Groq
            temperature=0.2,
            groq_api_key=os.getenv("GROQ_API_KEY", ""),
        )
        
        # Initialize prompt templates
        self._init_prompt_templates()
        
        # Create LangChain chains
        self._init_chains()
        
        # Data context
        self.data_context = {}
        
    def _init_prompt_templates(self):
        """Initialize various prompt templates for different tasks"""
        
        # Basic query prompt
        self.query_prompt = PromptTemplate(
            input_variables=["query", "context"],
            template="""
            You are a highly specialized financial analysis AI assistant. Please provide a detailed and accurate response to the following query based on the context provided.
            
            CONTEXT INFORMATION:
            {context}
            
            USER QUERY:
            {query}
            
            Provide a comprehensive, structured, and informative response focusing on financial insights and data analysis.
            If you don't have enough information, indicate what data would be needed for a more complete analysis.
            
            FORMAT YOUR RESPONSE USING MARKDOWN:
            - Use ## headings for major sections
            - Use ### for subsections
            - Use **bold** for important metrics and numbers
            - Use bullet points or numbered lists for multiple items
            - Use tables with | delimiters for comparative data
            - Use `code formatting` for ticker symbols
            
            Make your response visually structured and professional.
            """
        )
        
        # Report generation prompt
        self.report_prompt = PromptTemplate(
            input_variables=["query", "data_sources", "time_period", "report_type", "additional_params"],
            template="""
            You are a financial report generation AI assistant. Please generate a comprehensive financial report based on the following specifications.
            
            USER QUERY: {query}
            DATA SOURCES: {data_sources}
            TIME PERIOD: {time_period}
            REPORT TYPE: {report_type}
            ADDITIONAL PARAMETERS: {additional_params}
            
            Your report should include:
            1. Executive summary
            2. Key financial metrics and KPIs
            3. Trend analysis with visualizations
            4. Insights and recommendations
            5. Risk assessment
            
            Format your response as a structured JSON with the following keys:
            - title: The title of the report
            - summary: Executive summary
            - sections: Array of report sections, each with title, content, and any visualization data
            - insights: Key insights from the analysis
            - recommendations: Actionable recommendations
            - visualizations: Data needed for charts (formatted for Chart.js)
            """
        )
        
        # Data analysis prompt
        self.analysis_prompt = PromptTemplate(
            input_variables=["data", "query"],
            template="""
            You are a data analysis AI assistant specialized in financial data. Analyze the following financial data and respond to the query.
            
            DATA:
            {data}
            
            QUERY:
            {query}
            
            Provide detailed analysis including:
            1. Key trends and patterns
            2. Statistical insights
            3. Anomalies or outliers
            4. Correlations between different metrics
            5. Forecasts or predictions if applicable
            
            Format your response as a structured JSON with analysis sections.
            """
        )
    
    def _init_chains(self):
        """Initialize LangChain chains"""
        self.query_chain = LLMChain(
            llm=self.model,
            prompt=self.query_prompt,
            verbose=True
        )
        
        self.report_chain = LLMChain(
            llm=self.model,
            prompt=self.report_prompt,
            verbose=True
        )
        
        self.analysis_chain = LLMChain(
            llm=self.model,
            prompt=self.analysis_prompt,
            verbose=True
        )
    
    async def process_query(self, query: str, additional_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a user query about financial data
        """
        # Merge any additional context with our stored data context
        context = {**self.data_context}
        if additional_context:
            context.update(additional_context)
            
        # Convert context to string format for the prompt
        context_str = json.dumps(context) if context else "No additional context provided."
        
        # Run the query chain
        result = await self.query_chain.arun(query=query, context=context_str)
        
        # Try to parse the result as JSON if it looks like JSON
        try:
            if result.strip().startswith('{') and result.strip().endswith('}'):
                parsed_result = json.loads(result)
                return parsed_result
        except:
            pass
            
        # If not JSON or parsing failed, return as plain text
        return {"response": result}
    
    async def generate_report(
        self, 
        query: str,
        data_sources: Optional[List[str]] = None,
        time_period: Optional[str] = None,
        report_type: Optional[str] = None,
        additional_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive financial report
        """
        # Default values
        data_sources = data_sources or ["All available data"]
        time_period = time_period or "Last quarter"
        report_type = report_type or "General financial analysis"
        additional_params = additional_params or {}
        
        # Format parameters for the prompt
        data_sources_str = ", ".join(data_sources)
        additional_params_str = json.dumps(additional_params)
        
        # Run the report generation chain
        result = await self.report_chain.arun(
            query=query,
            data_sources=data_sources_str,
            time_period=time_period,
            report_type=report_type,
            additional_params=additional_params_str
        )
        
        # Try to parse the result as JSON
        try:
            if result.strip().startswith('{') and result.strip().endswith('}'):
                parsed_result = json.loads(result)
                return parsed_result
        except Exception as e:
            print(f"Error parsing report JSON: {e}")
        
        # If not JSON or parsing failed, try to extract JSON portions
        try:
            # Look for JSON-like content between triple backticks
            import re
            json_match = re.search(r'```json\n(.*?)\n```', result, re.DOTALL)
            if json_match:
                parsed_result = json.loads(json_match.group(1))
                return parsed_result
        except Exception as e:
            print(f"Error extracting JSON from markdown: {e}")
        
        # If all parsing attempts fail, return as structured text
        return {
            "title": "Financial Report",
            "content": result,
            "format": "text"
        }
    
    async def analyze_data(self, data: Union[Dict, List, str], query: str) -> Dict[str, Any]:
        """
        Analyze financial data based on a specific query
        """
        # Convert data to string if it's a dict or list
        if isinstance(data, (dict, list)):
            data_str = json.dumps(data)
        else:
            data_str = str(data)
            
        # Run the analysis chain
        result = await self.analysis_chain.arun(data=data_str, query=query)
        
        # Parse the result (with fallbacks)
        try:
            return json.loads(result)
        except:
            return {"analysis": result} 