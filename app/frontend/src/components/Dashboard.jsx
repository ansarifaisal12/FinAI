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
  Card,
  CardContent,
  Divider,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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
import { Line, Bar } from 'react-chartjs-2';

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

const Dashboard = () => {
  // State for user query
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // State for available metrics & data
  const [metrics, setMetrics] = useState(['quarterly_revenue', 'profit_margin', 'cash_flow', 'debt_to_equity', 'market_share']);
  const [selectedMetric, setSelectedMetric] = useState('quarterly_revenue');
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [timePeriod, setTimePeriod] = useState('all');
  
  // State for report generation
  const [reportType, setReportType] = useState('financial_performance');
  
  // Fetch initial chart data
  useEffect(() => {
    fetchChartData(selectedMetric);
  }, [selectedMetric, timePeriod]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Fetch chart data for a specific metric
  const fetchChartData = async (metric) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chart-data/${metric}`, {
        params: { time_period: timePeriod !== 'all' ? timePeriod : undefined }
      });
      
      if (response.data && response.data.data) {
        setChartData({
          labels: response.data.data.dates,
          datasets: [
            {
              label: metric.replace('_', ' ').toUpperCase(),
              data: response.data.data.values,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };
  
  // Handle query submission
  const handleSubmitQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/query`, {
        query: query
      });
      
      setResponse(response.data);
    } catch (error) {
      console.error("Error submitting query:", error);
      setResponse({ error: "Failed to process your query. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle report generation
  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-report`, {
        query: query || `Generate a ${reportType} report`,
        report_type: reportType,
        time_period: timePeriod !== 'all' ? timePeriod : 'Last year'
      });
      
      setResponse(response.data);
      
      // If we have visualization data, update the chart
      if (response.data.visualizations && response.data.visualizations.data) {
        const visData = response.data.visualizations;
        setChartData({
          labels: visData.data.labels || visData.data.dates,
          datasets: [
            {
              label: visData.title || 'Financial Data',
              data: visData.data.values,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setResponse({ error: "Failed to generate the report. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom align="center" sx={{ fontWeight: 'bold', mb: 4 }}>
        Financial AI Assistant
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Dashboard" />
          <Tab label="AI Assistant" />
          <Tab label="Report Generator" />
        </Tabs>
      </Box>
      
      {/* Dashboard Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Financial Metrics
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metrics.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {metric.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={timePeriod}
                  label="Time Period"
                  onChange={(e) => setTimePeriod(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={chartType}
                  label="Chart Type"
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <MenuItem value="line">Line Chart</MenuItem>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 400,
              }}
            >
              {chartData ? (
                chartType === 'line' ? (
                  <Line 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: selectedMetric.replace('_', ' ').toUpperCase(),
                          font: { size: 16 }
                        }
                      }
                    }}
                  />
                ) : (
                  <Bar 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: selectedMetric.replace('_', ' ').toUpperCase(),
                          font: { size: 16 }
                        }
                      }
                    }}
                  />
                )
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Key Insights
              </Typography>
              <Typography variant="body1">
                {selectedMetric === 'quarterly_revenue' && 'Revenue shows a consistent upward trend with a 32% annual growth rate.'}
                {selectedMetric === 'profit_margin' && 'Profit margins have improved steadily, indicating better operational efficiency.'}
                {selectedMetric === 'cash_flow' && 'Cash flow has increased by 34% over the past year, providing better financial stability.'}
                {selectedMetric === 'debt_to_equity' && 'The debt-to-equity ratio is decreasing, indicating improved financial health and lower risk.'}
                {selectedMetric === 'market_share' && 'Market share has grown from 12% to 17%, showing successful business expansion.'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* AI Assistant Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Ask me anything about your financial data
              </Typography>
              <TextField
                fullWidth
                label="Your financial question"
                variant="outlined"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., What was our revenue growth over the past two quarters?"
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
            </Paper>
          </Grid>
          
          {response && (
            <Grid item xs={12}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Response
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {response.error ? (
                  <Typography color="error">{response.error}</Typography>
                ) : response.response ? (
                  <Typography>{response.response}</Typography>
                ) : (
                  <Box>
                    {response.title && (
                      <Typography variant="h5" gutterBottom>{response.title}</Typography>
                    )}
                    {response.summary && (
                      <>
                        <Typography variant="h6" gutterBottom>Summary</Typography>
                        <Typography paragraph>{response.summary}</Typography>
                      </>
                    )}
                    {response.sections && response.sections.map((section, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="h6">{section.title}</Typography>
                        <Typography paragraph>{section.content}</Typography>
                      </Box>
                    ))}
                    {response.insights && (
                      <>
                        <Typography variant="h6" gutterBottom>Key Insights</Typography>
                        <ul>
                          {Array.isArray(response.insights) ? 
                            response.insights.map((insight, index) => (
                              <li key={index}><Typography>{insight}</Typography></li>
                            )) : 
                            <Typography>{response.insights}</Typography>
                          }
                        </ul>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Report Generator Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Generate Financial Reports
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Report Type</InputLabel>
                    <Select
                      value={reportType}
                      label="Report Type"
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <MenuItem value="financial_performance">Financial Performance</MenuItem>
                      <MenuItem value="market_analysis">Market Analysis</MenuItem>
                      <MenuItem value="risk_assessment">Risk Assessment</MenuItem>
                      <MenuItem value="forecast">Financial Forecast</MenuItem>
                      <MenuItem value="investor_presentation">Investor Presentation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time Period</InputLabel>
                    <Select
                      value={timePeriod}
                      label="Time Period"
                      onChange={(e) => setTimePeriod(e.target.value)}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="2023">2023</MenuItem>
                      <MenuItem value="2024">2024</MenuItem>
                      <MenuItem value="Q1">Current Quarter</MenuItem>
                      <MenuItem value="Last_Year">Last Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Specific requirements (optional)"
                variant="outlined"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="E.g., Focus on cash flow and debt management"
                sx={{ mb: 2 }}
                multiline
                rows={2}
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleGenerateReport}
                disabled={isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
              </Button>
            </Paper>
          </Grid>
          
          {response && (
            <Grid item xs={12}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Generated Report
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {response.error ? (
                  <Typography color="error">{response.error}</Typography>
                ) : (
                  <Box>
                    {response.title && (
                      <Typography variant="h5" gutterBottom>{response.title}</Typography>
                    )}
                    {response.summary && (
                      <>
                        <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                        <Typography paragraph>{response.summary}</Typography>
                        <Divider sx={{ my: 2 }} />
                      </>
                    )}
                    {response.sections && response.sections.map((section, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>{section.title}</Typography>
                        <Typography paragraph>{section.content}</Typography>
                        {index < response.sections.length - 1 && <Divider sx={{ my: 2 }} />}
                      </Box>
                    ))}
                    {response.insights && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Key Insights</Typography>
                        <ul>
                          {Array.isArray(response.insights) ? 
                            response.insights.map((insight, index) => (
                              <li key={index}><Typography>{insight}</Typography></li>
                            )) : 
                            <Typography>{response.insights}</Typography>
                          }
                        </ul>
                      </>
                    )}
                    {response.recommendations && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>Recommendations</Typography>
                        <ul>
                          {Array.isArray(response.recommendations) ? 
                            response.recommendations.map((rec, index) => (
                              <li key={index}><Typography>{rec}</Typography></li>
                            )) : 
                            <Typography>{response.recommendations}</Typography>
                          }
                        </ul>
                      </>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard; 