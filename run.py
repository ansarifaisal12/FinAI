import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Default port
DEFAULT_PORT = 8000

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", DEFAULT_PORT))
    
    # Run the FastAPI app
    uvicorn.run("app.api.main:app", host="0.0.0.0", port=port, reload=True) 