import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  CircularProgress,
  Box,
  Divider,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReactMarkdown from 'react-markdown';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// API base URL
const API_BASE_URL = 'http://localhost:8000';

const StockDashboard = () => {
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [technicalIndicators, setTechnicalIndicators] = useState(null);
  const [marketIndices, setMarketIndices] = useState(null);
  const [sectorPerformance, setSectorPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState('1y');
  const [activeTab, setActiveTab] = useState(0);
  const [compareStocks, setCompareStocks] = useState(['AAPL', 'MSFT', 'GOOG']);
  const [comparisonData, setComparisonData] = useState(null);
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState(null);

  // Fetch market indices on component mount
  useEffect(() => {
    fetchMarketIndices();
    fetchSectorPerformance();
  }, []);

  // Fetch stock data when symbol or period changes
  useEffect(() => {
    if (stockSymbol) {
      fetchStockData();
      fetchCompanyInfo();
      fetchTechnicalIndicators();
    }
  }, [stockSymbol, period]);

  // Fetch comparison data when compareStocks changes
  useEffect(() => {
    if (compareStocks.length > 0) {
      fetchComparisonData();
    }
  }, [compareStocks]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/stock-data`, {
        ticker: stockSymbol,
        period: period
      });
      setStockData(response.data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      setStockData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/company-info`, {
        ticker: stockSymbol
      });
      setCompanyInfo(response.data);
    } catch (error) {
      console.error("Error fetching company info:", error);
      setCompanyInfo(null);
    }
  };

  const fetchTechnicalIndicators = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/technical-indicators`, {
        ticker: stockSymbol,
        period: period
      });
      setTechnicalIndicators(response.data.indicators);
    } catch (error) {
      console.error("Error fetching technical indicators:", error);
      setTechnicalIndicators(null);
    }
  };

  const fetchMarketIndices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/market-indices`);
      setMarketIndices(response.data);
    } catch (error) {
      console.error("Error fetching market indices:", error);
      setMarketIndices(null);
    }
  };

  const fetchSectorPerformance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sector-performance`);
      setSectorPerformance(response.data.sectors);
    } catch (error) {
      console.error("Error fetching sector performance:", error);
      setSectorPerformance(null);
    }
  };

  const fetchComparisonData = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/company-comparison`, {
        tickers: compareStocks,
        metrics: ['shortName', 'sector', 'marketCap', 'trailingPE', 'forwardPE', 'dividendYield', 'beta']
      });
      setComparisonData(response.data);
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      setComparisonData(null);
    }
  };

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/stock-query`, {
        query: query
      });
      
      setQueryResponse(response.data);
      
      // If the query mentioned a stock that's not currently displayed, update it
      if (response.data.stock_data) {
        const tickers = Object.keys(response.data.stock_data);
        if (tickers.length > 0 && tickers[0] !== stockSymbol) {
          setStockSymbol(tickers[0]);
        }
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      setQueryResponse({ error: "Failed to process your query. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStockChart = () => {
    if (!stockData || !stockData.data) return null;
    
    const chartData = {
      labels: stockData.data.dates,
      datasets: [
        {
          label: stockSymbol,
          data: stockData.data.close,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    };
    
    return (
      <Line 
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${stockSymbol} Stock Price - ${period}`,
              font: { size: 16 }
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }}
      />
    );
  };

  const renderCompanyInfo = () => {
    if (!companyInfo) return null;
    
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Company Overview</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2"><strong>Name:</strong> {companyInfo.shortName || companyInfo.longName}</Typography>
            <Typography variant="body2"><strong>Sector:</strong> {companyInfo.sector || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Industry:</strong> {companyInfo.industry || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Website:</strong> {companyInfo.website || 'N/A'}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{companyInfo.longBusinessSummary?.slice(0, 300)}...</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Key Metrics</Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2"><strong>Market Cap:</strong> ${(companyInfo.marketCap / 1e9).toFixed(2)}B</Typography>
            <Typography variant="body2"><strong>P/E Ratio:</strong> {companyInfo.trailingPE?.toFixed(2) || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Forward P/E:</strong> {companyInfo.forwardPE?.toFixed(2) || 'N/A'}</Typography>
            <Typography variant="body2"><strong>EPS (TTM):</strong> ${companyInfo.trailingEps?.toFixed(2) || 'N/A'}</Typography>
            <Typography variant="body2"><strong>Dividend Yield:</strong> {(companyInfo.dividendYield * 100)?.toFixed(2) || 'N/A'}%</Typography>
            <Typography variant="body2"><strong>52 Week High:</strong> ${companyInfo.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</Typography>
            <Typography variant="body2"><strong>52 Week Low:</strong> ${companyInfo.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Technical Indicators</Typography>
            <Divider sx={{ mb: 2 }} />
            {technicalIndicators ? (
              <>
                <Typography variant="body2"><strong>Current Price:</strong> ${technicalIndicators.price}</Typography>
                <Typography variant="body2"><strong>SMA 50:</strong> ${technicalIndicators.SMA_50 || 'N/A'}</Typography>
                <Typography variant="body2"><strong>SMA 200:</strong> ${technicalIndicators.SMA_200 || 'N/A'}</Typography>
                <Typography variant="body2"><strong>RSI (14):</strong> {technicalIndicators.RSI?.toFixed(2) || 'N/A'}</Typography>
                <Typography variant="body2"><strong>MACD:</strong> {technicalIndicators.MACD?.toFixed(2) || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Signal Line:</strong> {technicalIndicators.Signal_Line?.toFixed(2) || 'N/A'}</Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1"><strong>Signals:</strong></Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip 
                      icon={technicalIndicators.signals.trend === 'bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />} 
                      label={`Trend: ${technicalIndicators.signals.trend}`} 
                      color={technicalIndicators.signals.trend === 'bullish' ? 'success' : 'error'} 
                      size="small"
                    />
                    <Chip 
                      icon={technicalIndicators.signals.RSI > 70 ? <WarningIcon /> : technicalIndicators.signals.RSI < 30 ? <WarningIcon /> : <CheckCircleIcon />} 
                      label={`RSI: ${technicalIndicators.signals.overbought_oversold}`} 
                      color={technicalIndicators.signals.overbought_oversold === 'neutral' ? 'success' : 'warning'} 
                      size="small"
                    />
                    <Chip 
                      icon={technicalIndicators.signals.MACD === 'bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />} 
                      label={`MACD: ${technicalIndicators.signals.MACD}`} 
                      color={technicalIndicators.signals.MACD === 'bullish' ? 'success' : 'error'} 
                      size="small"
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={30} />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
        Financial Market Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Market Overview" />
          <Tab label="Stock Analysis" />
          <Tab label="Stock Comparison" />
          <Tab label="AI Insights" />
        </Tabs>
      </Box>
      
      {/* Market Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Market Indices */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Market Indices</Typography>
              <Divider sx={{ mb: 2 }} />
              {marketIndices ? (
                <Grid container spacing={2}>
                  {Object.entries(marketIndices).map(([name, data]) => {
                    const startValue = data.close[0];
                    const currentValue = data.close[data.close.length - 1];
                    const pctChange = ((currentValue - startValue) / startValue) * 100;
                    const isPositive = pctChange >= 0;
                    
                    return (
                      <Grid item xs={12} sm={6} key={name}>
                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                          <Typography variant="subtitle1">{name}</Typography>
                          <Typography variant="h6">{currentValue.toFixed(2)}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {isPositive ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                            <Typography 
                              variant="body2" 
                              color={isPositive ? 'success.main' : 'error.main'}
                              sx={{ ml: 1 }}
                            >
                              {isPositive ? '+' : ''}{pctChange.toFixed(2)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Sector Performance */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Sector Performance (1 Year)</Typography>
              <Divider sx={{ mb: 2 }} />
              {sectorPerformance ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sector</TableCell>
                        <TableCell align="right">Change (%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(sectorPerformance)
                        .sort((a, b) => b[1] - a[1])
                        .map(([sector, change]) => (
                          <TableRow key={sector}>
                            <TableCell>{sector}</TableCell>
                            <TableCell 
                              align="right" 
                              sx={{ 
                                color: change >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 'bold'
                              }}
                            >
                              {change >= 0 ? '+' : ''}{change}%
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Stock Analysis Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Stock Symbol"
                    value={stockSymbol}
                    onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, MSFT, TSLA"
                    variant="outlined"
                    helperText="Enter a valid ticker symbol"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={period}
                      label="Time Period"
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <MenuItem value="1mo">1 Month</MenuItem>
                      <MenuItem value="3mo">3 Months</MenuItem>
                      <MenuItem value="6mo">6 Months</MenuItem>
                      <MenuItem value="1y">1 Year</MenuItem>
                      <MenuItem value="2y">2 Years</MenuItem>
                      <MenuItem value="5y">5 Years</MenuItem>
                      <MenuItem value="max">Maximum</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={fetchStockData}
                    disabled={!stockSymbol || isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Analyze'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {stockData && (
            <>
              <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 3, height: 400 }}>
                  {renderStockChart()}
                </Paper>
              </Grid>
              
              {renderCompanyInfo()}
            </>
          )}
        </Grid>
      )}
      
      {/* Stock Comparison Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Compare Stocks</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={10}>
                  <TextField
                    fullWidth
                    label="Stock Symbols (comma-separated)"
                    value={compareStocks.join(', ')}
                    onChange={(e) => setCompareStocks(e.target.value.toUpperCase().split(/,\s*/).filter(Boolean))}
                    placeholder="e.g., AAPL, MSFT, GOOG"
                    variant="outlined"
                    helperText="Enter up to 5 ticker symbols separated by commas"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={fetchComparisonData}
                    disabled={compareStocks.length === 0}
                  >
                    Compare
                  </Button>
                </Grid>
              </Grid>
              
              {comparisonData && (
                <TableContainer sx={{ mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        {Object.keys(comparisonData).map(ticker => (
                          <TableCell key={ticker} align="right">{ticker}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Company Name</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">{data.shortName || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Sector</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">{data.sector || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Market Cap</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">
                            {data.marketCap ? `$${(data.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>P/E Ratio</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">{data.trailingPE?.toFixed(2) || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Forward P/E</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">{data.forwardPE?.toFixed(2) || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Dividend Yield</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">
                            {data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Beta</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">{data.beta?.toFixed(2) || 'N/A'}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Current Price</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell key={index} align="right">
                            {data.current_price ? `$${data.current_price}` : 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>1Y Performance</TableCell>
                        {Object.values(comparisonData).map((data, index) => (
                          <TableCell 
                            key={index} 
                            align="right"
                            sx={{ 
                              color: data.yearly_performance >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {data.yearly_performance ? `${data.yearly_performance >= 0 ? '+' : ''}${data.yearly_performance}%` : 'N/A'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* AI Insights Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Ask About Stocks</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                label="Your stock market question"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What is the PE ratio of AAPL compared to the tech industry average?"
                variant="outlined"
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmitQuery}
                disabled={isLoading || !query.trim()}
                sx={{ alignSelf: 'flex-end' }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Ask'}
              </Button>
              
              {queryResponse && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Response</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {queryResponse.error ? (
                    <Typography color="error">{queryResponse.error}</Typography>
                  ) : queryResponse.response ? (
                    <Paper elevation={1} sx={{ p: 3, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                      <Box sx={{
                        '& h2': { 
                          borderBottom: '1px solid #e0e0e0',
                          pb: 1,
                          mb: 2,
                          color: 'primary.main',
                          fontWeight: 600,
                        },
                        '& h3': {
                          mt: 2,
                          mb: 1,
                          fontWeight: 600,
                          color: 'secondary.main'
                        },
                        '& table': {
                          width: '100%',
                          borderCollapse: 'collapse',
                          my: 2
                        },
                        '& th, & td': {
                          borderBottom: '1px solid #e0e0e0',
                          py: 1,
                          px: 2,
                          textAlign: 'left'
                        },
                        '& th': {
                          fontWeight: 'bold',
                          backgroundColor: '#f0f0f0',
                        },
                        '& ul, & ol': {
                          pl: 3
                        },
                        '& code': {
                          backgroundColor: '#f0f0f0',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontFamily: 'monospace'
                        },
                        '& blockquote': {
                          borderLeft: '4px solid #e0e0e0',
                          pl: 2,
                          py: 1,
                          my: 2,
                          fontStyle: 'italic',
                          color: 'text.secondary'
                        }
                      }}>
                        <ReactMarkdown>{queryResponse.response}</ReactMarkdown>
                      </Box>
                    </Paper>
                  ) : (
                    <Box>
                      {Object.entries(queryResponse).map(([key, value]) => {
                        if (key === 'stock_data') return null;
                        return (
                          <Paper key={key} elevation={1} sx={{ p: 3, mb: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
                            <Box sx={{
                              '& h2': { 
                                borderBottom: '1px solid #e0e0e0',
                                pb: 1,
                                mb: 2,
                                color: 'primary.main',
                                fontWeight: 600,
                              },
                              '& h3': {
                                mt: 2,
                                mb: 1,
                                fontWeight: 600,
                                color: 'secondary.main'
                              },
                              '& table': {
                                width: '100%',
                                borderCollapse: 'collapse',
                                my: 2
                              },
                              '& th, & td': {
                                borderBottom: '1px solid #e0e0e0',
                                py: 1,
                                px: 2,
                                textAlign: 'left'
                              },
                              '& th': {
                                fontWeight: 'bold',
                                backgroundColor: '#f0f0f0',
                              },
                              '& ul, & ol': {
                                pl: 3
                              },
                              '& code': {
                                backgroundColor: '#f0f0f0',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontFamily: 'monospace'
                              },
                              '& blockquote': {
                                borderLeft: '4px solid #e0e0e0',
                                pl: 2,
                                py: 1,
                                my: 2,
                                fontStyle: 'italic',
                                color: 'text.secondary'
                              }
                            }}>
                              <ReactMarkdown>{value}</ReactMarkdown>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                  
                  {queryResponse.stock_data && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>Stock Data</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ticker</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell>Sector</TableCell>
                              <TableCell align="right">Price</TableCell>
                              <TableCell align="right">1Y Change</TableCell>
                              <TableCell align="right">P/E Ratio</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(queryResponse.stock_data).map(([ticker, data]) => (
                              <TableRow key={ticker}>
                                <TableCell><strong>{ticker}</strong></TableCell>
                                <TableCell>{data.company_name}</TableCell>
                                <TableCell>{data.sector}</TableCell>
                                <TableCell align="right">${data.current_price}</TableCell>
                                <TableCell 
                                  align="right"
                                  sx={{ 
                                    color: data.yearly_change_pct >= 0 ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {data.yearly_change_pct >= 0 ? '+' : ''}{data.yearly_change_pct}%
                                </TableCell>
                                <TableCell align="right">{data.pe_ratio?.toFixed(2) || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default StockDashboard;