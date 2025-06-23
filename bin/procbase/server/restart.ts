import { startServer } from './start';
import { stopServer } from './stop';

export const restartServer = () => {
  console.log("Attempting to restart server...");
  stopServer();
  
  console.log("Waiting for server to shut down...");
  setTimeout(() => {
      console.log("Starting server...");
      startServer();
  }, 2000); // 2 second delay to be safe
}; 